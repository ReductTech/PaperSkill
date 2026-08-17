import React, { useCallback, useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { PAPER_URL, RESEARCH_DIRECTIONS } from './data/facts';
import type { ExperienceStateChange, ModuleDef } from './types';
import { GlossaryButton, GlossaryProvider, GlossaryText } from './components/Glossary';
import { DocumentPrimer } from './components/DocumentPrimer';
import { ChapterEvidence } from './components/ChapterEvidence';
import { ChapterExperience } from './components/ChapterExperience';
import { ResearchProblemOverview } from './components/ResearchProblemOverview';
import { HeroMethodContrast } from './components/HeroMethodContrast';
import {
  ChapterUnlockProvider,
  ChapterUnlockReset,
  ProgressiveChapter,
  useChapterNavigationState,
} from './components/ProgressiveChapter';

const PROGRESS_KEY = 'mineru2.5-pro.tutorial-progress.v2';
const CHAPTER_IDS = tutorial.chapters.map((chapter) => chapter.id);

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    return new Set<string>(Array.isArray(value) ? value : []);
  } catch {
    return new Set<string>();
  }
}

function parseTutorialHash() {
  let raw = '';
  try {
    raw = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }
  if (!raw || raw.startsWith('glossary/')) return null;
  const [stepId, moduleId, state] = raw.split('/');
  return { stepId, moduleId, state };
}

function SourceLegend() {
  return (
    <div className="source-legend" aria-label="内容来源图例">
      <span className="source-tag paper">论文事实</span>
      <span className="source-tag teaching">教学示意</span>
      <span className="source-tag research">研究者视角</span>
    </div>
  );
}

function AppContent() {
  const { isUnlocked, unlockedCount } = useChapterNavigationState();
  const [completed, setCompleted] = useState<Set<string>>(readProgress);
  const [activeStep, setActiveStep] = useState('step-1');
  const [hashState, setHashState] = useState(parseTutorialHash);
  const [copyNotice, setCopyNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
    } catch {
      // Device-local progress is an enhancement; the lesson never depends on it.
    }
  }, [completed]);

  useEffect(() => {
    const onHash = () => {
      const target = parseTutorialHash();
      setHashState(target);
      if (!target?.stepId) return;
      requestAnimationFrame(() => {
        const requested = document.getElementById(target.stepId);
        const nextAvailableId = CHAPTER_IDS[Math.min(unlockedCount, CHAPTER_IDS.length - 1)];
        const destination = requested ?? document.getElementById(nextAvailableId);
        destination?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        });
      });
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, [unlockedCount]);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-chapter-lock="unlocked"]'),
    );
    if (!sections.length) return undefined;

    let frame = 0;
    let disposed = false;
    const updateActiveStep = () => {
      if (disposed) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const headerHeight = document.querySelector<HTMLElement>('.site-header')
          ?.getBoundingClientRect().height ?? 0;
        // Read the section just below the sticky header. Using section tops rather
        // than intersection ratios keeps the previous step active in the gaps.
        const readingLine = window.scrollY + headerHeight + 24;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

        let current = sections[0].id;
        for (const section of sections) {
          const sectionTop = section.getBoundingClientRect().top + window.scrollY;
          if (sectionTop <= readingLine) current = section.id;
          else break;
        }

        // The last heading cannot always reach the reading line on short screens.
        // Pinning the final step at the document end makes the state deterministic.
        if (maxScroll > 0 && window.scrollY >= maxScroll - 2) {
          current = sections[sections.length - 1].id;
        }
        setActiveStep((previous) => previous === current ? previous : current);
      });
    };

    window.addEventListener('scroll', updateActiveStep, { passive: true });
    window.addEventListener('resize', updateActiveStep);
    void document.fonts?.ready.then(updateActiveStep);
    updateActiveStep();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateActiveStep);
      window.removeEventListener('resize', updateActiveStep);
    };
  }, [unlockedCount]);

  const markInteraction = useCallback((moduleId: string) => {
    setCompleted((current) => {
      const next = new Set(current);
      next.add(moduleId);
      return next;
    });
  }, []);

  const resetInteractionProgress = useCallback(() => {
    setCompleted(new Set());
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      // In-memory reset still succeeds when storage is unavailable.
    }
  }, []);

  const writeStateHash = useCallback((stepId: string, moduleId: string, state: string) => {
    const nextHash = `#${stepId}/${moduleId}/${state}`;
    window.history.replaceState(null, '', nextHash);
    setHashState({ stepId, moduleId, state });
  }, []);

  const copyStep = async (stepId: string) => {
    const url = `${window.location.href.split('#')[0]}#${stepId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyNotice(stepId);
      window.setTimeout(() => setCopyNotice(''), 1800);
    } catch {
      window.location.hash = stepId;
    }
  };

  const completedChapterCount = tutorial.chapters.filter((step) => completed.has(`chapter:${step.id}`)).length;
  const chapterProgress = Math.round((completedChapterCount / tutorial.chapters.length) * 100);
  const restoredStateFor = (stepId: string, moduleId: string) => (
    hashState?.stepId === stepId && hashState.moduleId === moduleId ? hashState.state : undefined
  );
  const restoredStateForModules = (
    stepId: string,
    modules: readonly ModuleDef[],
  ): ExperienceStateChange | undefined => {
    if (!hashState?.state || hashState.stepId !== stepId) return undefined;
    const module = modules.find((item) => item.componentId === hashState.moduleId);
    return module ? { moduleId: module.componentId, state: hashState.state } : undefined;
  };

  return (
    <div className="app">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="返回教程顶部">
          <span className="brand-mark">M</span>
          <span><b>MinerU2.5-Pro</b><small>交互式论文教程</small></span>
        </a>
        <nav className="process-nav" aria-label="学习过程">
          {tutorial.chapters.map((step) => {
            const isActive = activeStep === step.id;
            const unlocked = isUnlocked(step.id);
            return (
              <a
                key={step.id}
                className={[isActive ? 'active' : '', unlocked ? '' : 'locked'].filter(Boolean).join(' ')}
                href={`#${step.id}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${step.shortLabel}${unlocked ? '' : '，尚未解锁'}`}
                aria-disabled={!unlocked}
                tabIndex={unlocked ? undefined : -1}
                onClick={(event) => {
                  if (!unlocked) event.preventDefault();
                }}
              >
                <i>{unlocked ? step.step : '·'}</i><span>{step.shortLabel}</span>
              </a>
            );
          })}
        </nav>
        <div className="header-actions">
          <div className="progress-pill" aria-label={`已完成 ${completedChapterCount} 章，共 ${tutorial.chapters.length} 章`}>
            <span style={{ width: `${chapterProgress}%` }} />
            <b>{completedChapterCount}/{tutorial.chapters.length} 章</b>
          </div>
          <GlossaryButton />
        </div>
      </header>

      <main id="top">
        <section className="hero-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-meta"><span>论文精读实验室</span><span>{tutorial.meta.venue}</span></div>
            <span className="hero-question-label">这篇论文先解决什么？</span>
            <h1 id="hero-title"><GlossaryText text={tutorial.meta.titleZh} /></h1>
            <p><GlossaryText text={tutorial.meta.coreProblem} /></p>
            <div className="hero-abstract-note">
              <b>Abstract 一句话</b>
              <span><GlossaryText text={tutorial.meta.coreInsight} /></span>
            </div>
            <div className="hero-actions">
              <a className="primary-action" href="#research-problem">先读懂论文问题</a>
              <a className="secondary-action" href="#document-primer">先看一张复杂页面</a>
            </div>
            <SourceLegend />
          </div>

          <HeroMethodContrast />

        </section>

        <ResearchProblemOverview />

        <div className="primer-shell">
          <DocumentPrimer
            guidedState={restoredStateFor('document-primer', 'document-primer')}
            onInteract={() => {
              markInteraction('document-primer');
              writeStateHash('document-primer', 'document-primer', 'explored');
            }}
            onStateChange={(state) => writeStateHash('document-primer', 'document-primer', state)}
          />
        </div>

        <div className="tutorial-layout">
          <div className="process-content">
            {tutorial.chapters.map((step, stepIndex) => {
              return (
                <ProgressiveChapter
                  key={step.id}
                  chapterId={step.id}
                  step={step.step}
                  title={step.question}
                  previousLabel={tutorial.chapters[stepIndex - 1]?.shortLabel}
                  nextLabel={tutorial.chapters[stepIndex + 1]?.shortLabel}
                  className="process-step"
                  completed={completed.has(`chapter:${step.id}`)}
                >
                <header className="step-heading">
                  <div className="step-number">{String(step.step).padStart(2, '0')}</div>
                  <div>
                    <span className={`badge-tag ${step.badge}`}><GlossaryText text={step.badgeLabel} /></span>
                    <h2><GlossaryText text={step.question} /></h2>
                  </div>
                  <button type="button" className="copy-link" onClick={() => copyStep(step.id)}>
                    {copyNotice === step.id ? '已复制' : '复制此处链接'}
                  </button>
                </header>

                <p className="chapter-problem"><GlossaryText text={step.problem} /></p>

                <ChapterExperience
                  stepId={step.id}
                  modules={step.modules}
                  restoredModuleState={restoredStateForModules(step.id, step.modules)}
                  onInteract={markInteraction}
                  onStateChange={({ moduleId, state }) => writeStateHash(step.id, moduleId, state)}
                  onComplete={() => markInteraction(`chapter:${step.id}`)}
                />

                <ChapterEvidence items={step.evidence} />

                {step.id === 'step-6' ? (
                  <section className="research-lens" aria-labelledby="research-title">
                    <div className="research-head">
                      <span className="source-tag research">研究者视角</span>
                      <h3 id="research-title">如果接着做这项研究，优先补什么？</h3>
                    </div>
                    <div className="research-grid">
                      {RESEARCH_DIRECTIONS.map((item, index) => (
                        <details key={item.title}>
                          <summary><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</summary>
                          <p><GlossaryText text={item.text} /></p>
                        </details>
                      ))}
                    </div>
                  </section>
                ) : null}
                </ProgressiveChapter>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div><b>MinerU2.5-Pro 交互式教程</b><span><GlossaryText text="所有核心数字已按 arXiv v2 核对。" /></span></div>
        <div className="site-footer__actions">
          <ChapterUnlockReset
            label="重置学习路径"
            disabled={unlockedCount <= 1 && completed.size === 0}
            onReset={resetInteractionProgress}
          />
          <a href={PAPER_URL} target="_blank" rel="noreferrer">阅读原论文 ↗</a>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <GlossaryProvider>
      <ChapterUnlockProvider chapterIds={CHAPTER_IDS}>
        <AppContent />
      </ChapterUnlockProvider>
    </GlossaryProvider>
  );
}
