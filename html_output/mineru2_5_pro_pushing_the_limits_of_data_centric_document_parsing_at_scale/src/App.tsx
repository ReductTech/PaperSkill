import React, { useCallback, useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { PAPER_URL, RESEARCH_DIRECTIONS } from './data/facts';
import type { ExperienceStateChange, ModuleDef } from './types';
import { GlossaryButton, GlossaryProvider, GlossaryText } from './components/Glossary';
import { DocumentPrimer } from './components/DocumentPrimer';
import { ChapterEvidence } from './components/ChapterEvidence';
import { ChapterExperience } from './components/ChapterExperience';
import { ChapterIntro } from './components/ChapterIntro';
import { ChapterSummary } from './components/ChapterSummary';
import { ChapterLoader } from './components/ChapterLoader';
import { JourneyMap } from './components/JourneyMap';
import { GradingTeaser } from './components/GradingTeaser';
import { ResearchProblemOverview } from './components/ResearchProblemOverview';
import { HeroMethodContrast } from './components/HeroMethodContrast';
import { FurtherLearning } from './components/FurtherLearning';
import { ProgressiveChapter, scrollToChapter } from './components/ProgressiveChapter';

const PROGRESS_KEY = 'mineru2.5-pro.tutorial-progress.v2';
const CHAPTER_IDS = tutorial.chapters.map((chapter) => chapter.id);
// The hero intro (paper-problem overview + document primer) is chapter 1's
// 导入 content: its anchors behave like chapter-1 links.
const INTRO_SECTION_IDS = new Set(['research-problem', 'document-primer']);

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
  const [completed, setCompleted] = useState<Set<string>>(readProgress);
  const [activeStep, setActiveStep] = useState('step-1');
  const [hashState, setHashState] = useState(parseTutorialHash);
  const [copyNotice, setCopyNotice] = useState('');
  // PaperSkill reveal pattern: chapters start hidden behind loaders; the
  // frontier only moves forward. Deep links and free navigation reveal the
  // whole prefix at once — reveal is pacing, never a lock.
  const [maxRevealed, setMaxRevealed] = useState(-1);

  const revealThrough = useCallback((index: number) => {
    setMaxRevealed((current) => Math.max(current, index));
  }, []);

  const jumpToChapter = useCallback((index: number) => {
    const chapterId = CHAPTER_IDS[index];
    if (!chapterId) return;
    revealThrough(index);
    // Wait for the hidden section to re-enter layout before scrolling.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToChapter(chapterId));
    });
  }, [revealThrough]);

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
      const chapterIndex = CHAPTER_IDS.indexOf(target.stepId);
      const introTarget = chapterIndex < 0 && INTRO_SECTION_IDS.has(target.stepId);
      if (chapterIndex >= 0 || introTarget) {
        revealThrough(introTarget ? 0 : chapterIndex);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.getElementById(target.stepId)?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
              block: 'start',
            });
          });
        });
      }
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, [revealThrough]);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('.progressive-chapter'),
    ).filter((section) => !section.hidden);
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
  }, [maxRevealed]);

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
            return (
              <a
                key={step.id}
                className={isActive ? 'active' : ''}
                href={`#${step.id}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={step.shortLabel}
              >
                <i>{step.step}</i><span>{step.shortLabel}</span>
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
            <div className="hero-venue">
              <span className="hero-venue-chip">{tutorial.meta.venue}</span>
              <span className="hero-venue-domain">{tutorial.meta.domain}</span>
            </div>
            <span className="hero-question-label">这篇论文先解决什么？</span>
            <h1 id="hero-title"><GlossaryText text={tutorial.meta.titleZh} /></h1>
            <p className="hero-sub">{tutorial.meta.titleEn}</p>
            <div className="hero-abs">
              <p><b>核心问题</b><span><GlossaryText text={tutorial.meta.coreProblem} /></span></p>
              <p><b>核心思路</b><span><GlossaryText text={tutorial.meta.coreInsight} /></span></p>
            </div>
            <div className="hero-meta" aria-label="论文元信息">
              <span>{tutorial.meta.authors} · {tutorial.meta.affiliation}</span>
              {tutorial.meta.keywords.map((keyword) => (
                <span key={keyword} className="hero-meta-chip">{keyword}</span>
              ))}
            </div>
            <div className="hero-actions">
              <a className="primary-action" href="#research-problem">开始探索：先读懂论文问题 →</a>
              <a className="secondary-action" href="#document-primer">先看一张复杂页面</a>
            </div>
            <SourceLegend />
          </div>

          <HeroMethodContrast />

        </section>

        <div className="chapter-one-intro" aria-label="第 1 章导入：论文问题与复杂页面">
          <p className="chapter-one-intro__tag"><span>第 1 章 · 导入</span>以下两部分属于第一章的导入内容。</p>
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
        </div>

        <JourneyMap
          chapters={tutorial.chapters}
          maxRevealed={maxRevealed}
          completed={(chapterId) => completed.has(`chapter:${chapterId}`)}
          onJump={jumpToChapter}
        />

        <div className="tutorial-layout">
          <div className="process-content">
            {maxRevealed < 0 ? (
              <ChapterLoader
                hint="导入结束 · 开始探索"
                step={tutorial.chapters[0].step}
                label={tutorial.chapters[0].question}
                onReveal={() => jumpToChapter(0)}
              />
            ) : null}
            {tutorial.chapters.map((step, stepIndex) => {
              const revealed = stepIndex <= maxRevealed;
              const nextStep = tutorial.chapters[stepIndex + 1];
              return (
                <React.Fragment key={step.id}>
                  <ProgressiveChapter
                    chapterId={step.id}
                    step={step.step}
                    title={step.question}
                    previousId={tutorial.chapters[stepIndex - 1]?.id ?? null}
                    previousLabel={tutorial.chapters[stepIndex - 1]?.shortLabel}
                    className="process-step"
                    completed={completed.has(`chapter:${step.id}`)}
                    hidden={!revealed}
                    revealed={revealed}
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

                <ChapterIntro bridge={step.bridge} analogy={step.analogy} />

                {step.id === 'step-6' ? <GradingTeaser /> : null}

                <p className="chapter-problem"><GlossaryText text={step.problem} /></p>

                <ChapterExperience
                  stepId={step.id}
                  modules={step.modules}
                  restoredModuleState={restoredStateForModules(step.id, step.modules)}
                  onInteract={markInteraction}
                  onStateChange={({ moduleId, state }) => writeStateHash(step.id, moduleId, state)}
                  onComplete={() => markInteraction(`chapter:${step.id}`)}
                />

                <ChapterSummary takeaways={step.takeaways} checkpoint={step.checkpoint} />

                <ChapterEvidence items={step.evidence} />
                  </ProgressiveChapter>
                  {revealed && nextStep && stepIndex === maxRevealed ? (
                    <ChapterLoader
                      hint="本章结束 · 继续探索"
                      step={nextStep.step}
                      label={nextStep.question}
                      onReveal={() => jumpToChapter(stepIndex + 1)}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        {maxRevealed >= tutorial.chapters.length - 1 ? (
        <section className="page-tail" aria-label="研究延伸与继续学习">
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
          <FurtherLearning />
        </section>
        ) : null}
      </main>

      <footer className="site-footer">
        <div><b>MinerU2.5-Pro 交互式教程</b><span><GlossaryText text="所有核心数字已按 arXiv v2 核对。" /></span></div>
        <div className="site-footer__actions">
          <button
            type="button"
            className="chapter-unlock-reset"
            disabled={completed.size === 0}
            onClick={resetInteractionProgress}
          >
            <span aria-hidden="true">↺</span>
            重置学习进度
          </button>
          <a href={PAPER_URL} target="_blank" rel="noreferrer">阅读原论文 ↗</a>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <GlossaryProvider>
      <AppContent />
    </GlossaryProvider>
  );
}
