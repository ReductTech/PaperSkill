import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { tutorial } from './data/tutorial';
import { PAPER_URL, RESEARCH_DIRECTIONS } from './data/facts';
import { GlossaryButton, GlossaryProvider, GlossaryText } from './components/Glossary';
import { DocumentPrimer } from './components/DocumentPrimer';
import { LearningLab } from './components/LearningLab';
import { EvidencePanel, CheckpointCard } from './components/EvidencePanel';
import { ResearchProblemOverview } from './components/ResearchProblemOverview';
import { HeroMethodContrast } from './components/HeroMethodContrast';
import { RealDocumentCases } from './components/RealDocumentCases';
import { StepConceptVisual } from './components/StepConceptVisual';
import { PaperFigureCard, type PaperFigureHotspot } from './components/PaperFigureCard';
import { FurtherLearning } from './components/FurtherLearning';
import {
  ChapterUnlockProvider,
  ChapterUnlockReset,
  ProgressiveChapter,
  useChapterNavigationState,
} from './components/ProgressiveChapter';

const PROGRESS_KEY = 'mineru2.5-pro.tutorial-progress.v2';
const CHAPTER_IDS = tutorial.chapters.map((chapter) => chapter.id);

const FIGURE_2_HOTSPOTS: readonly PaperFigureHotspot[] = [
  { id: 'engine-overview', label: '数据引擎总览', description: '从 PDF 池出发，经过平衡采样和分层标注，再分别送往预训练、困难样本微调与强化学习。', x: 0.5, y: 0.5, width: 61.5, height: 35 },
  { id: 'ddas', label: 'DDAS：覆盖与难度', description: '页面表征先经 K-Means 聚类补足多样性，再针对不同元素结合难度调整采样。', x: 0.5, y: 37, width: 61.5, height: 31 },
  { id: 'cmcv', label: 'CMCV：三模型分流', description: '目标模型和两个外部模型比较输出一致性，形成 Easy、Medium、Hard 三类训练去向。', x: 0.5, y: 69, width: 61.5, height: 30 },
  { id: 'judge-refine', label: 'Judge-and-Refine', description: 'Hard 输出被渲染回图像，与原图比较；判断器定位错误，修正器只修改发生问题的局部。', x: 63, y: 0.5, width: 36.5, height: 67 },
  { id: 'expert', label: '专家兜底标注', description: '自动修复仍不确定或具有高价值的样本，交由教师模型辅助和人工专家复核。', x: 63, y: 69, width: 36.5, height: 30 },
];

const FIGURE_3_HOTSPOTS: readonly PaperFigureHotspot[] = [
  { id: 'page-level', label: '页级采样', description: '整页先编码为 ViT-base 表征并聚类，再按 CMCV 难度对 Easy、Medium、Hard 调整采样比例，得到约 60M 页候选。', x: 0.5, y: 0.5, width: 99, height: 48 },
  { id: 'element-level', label: '元素级采样', description: '从页面中拆出文本、公式和表格，分别进入独立聚类，防止普通页面中的稀有元素被忽略。', x: 0.5, y: 51, width: 62, height: 48 },
  { id: 'joint-sample', label: '联合平衡结果', description: '不同元素簇再次结合难度信号，汇合为同时覆盖 Layout、Text、Formula 和 Table 的最终 SFT 数据。', x: 64, y: 51, width: 35.5, height: 48 },
];

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    return new Set<string>(Array.isArray(value) ? value : []);
  } catch {
    return new Set<string>();
  }
}

function parseTutorialHash() {
  const raw = decodeURIComponent(window.location.hash.slice(1));
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
  const totalExperiments = useMemo(
    () => tutorial.chapters.flatMap((step) => step.modules).length + 1,
    [],
  );
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

  const exploredCount = Math.min(completed.size, totalExperiments);
  const chapterProgress = Math.round((unlockedCount / tutorial.chapters.length) * 100);
  const restoredStateFor = (moduleId: string) => (
    hashState?.moduleId === moduleId ? hashState.state : undefined
  );

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
          <div className="progress-pill" aria-label={`已解锁 ${unlockedCount} 章，共 ${tutorial.chapters.length} 章；已操作 ${exploredCount} 个实验`}>
            <span style={{ width: `${chapterProgress}%` }} />
            <b>{unlockedCount}/{tutorial.chapters.length} 章</b>
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
            guidedState={restoredStateFor('document-primer')}
            onInteract={() => {
              markInteraction('document-primer');
              writeStateHash('document-primer', 'document-primer', 'explored');
            }}
            onStateChange={(state) => writeStateHash('document-primer', 'document-primer', state)}
          />
        </div>

        <RealDocumentCases />

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
                >
                <header className="step-heading">
                  <div className="step-number">{String(step.step).padStart(2, '0')}</div>
                  <div>
                    <span className={`badge-tag ${step.badge}`}>{step.badgeLabel}</span>
                    <h2><GlossaryText text={step.question} /></h2>
                  </div>
                  <button type="button" className="copy-link" onClick={() => copyStep(step.id)}>
                    {copyNotice === step.id ? '已复制' : '复制此处链接'}
                  </button>
                </header>

                <StepConceptVisual
                  stepId={step.id}
                  intro={step.problem}
                  finalAnswer={step.plainAnswer}
                />

                <div className="labs-stack">
                  {step.modules.map((module) => {
                    const guidedState = restoredStateFor(module.componentId);
                    return (
                      <LearningLab
                        key={module.id}
                        module={module}
                        stepId={step.id}
                        guidedState={guidedState}
                        onInteract={() => markInteraction(module.componentId)}
                        onStateChange={(state) => writeStateHash(step.id, module.componentId, state)}
                      />
                    );
                  })}
                </div>

                {step.id === 'step-1' ? (
                  <PaperFigureCard
                    compact
                    src={`${import.meta.env.BASE_URL}images/paper-figure-2-data-engine.png`}
                    alt="MinerU2.5-Pro 数据引擎总图，包含 DDAS、CMCV、困难样本标注流程与训练去向"
                    figure="Figure 2"
                    title="回到论文总图：核心工作怎样形成闭环"
                    intro="完成控制变量实验后，再沿图查看 DDAS、三模型分流、渲染复检和不同训练去向分别解决哪个数据问题。"
                    sourceHref={`${PAPER_URL}#S3.F2`}
                    width={2004}
                    height={886}
                    hotspots={FIGURE_2_HOTSPOTS}
                  />
                ) : null}

                {step.id === 'step-2' ? (
                  <PaperFigureCard
                    compact
                    src={`${import.meta.env.BASE_URL}images/paper-figure-3-ddas.png`}
                    alt="DDAS 页级采样和元素级采样的论文流程图"
                    figure="Figure 3"
                    title="玩完简图，再核对 DDAS 原始流程"
                    intro="上半部分按整页版式与难度调整采样，下半部分把页面拆成文本、公式和表格后分别聚类，再联合形成训练数据。"
                    sourceHref={`${PAPER_URL}#S3.F3`}
                    width={2027}
                    height={934}
                    hotspots={FIGURE_3_HOTSPOTS}
                  />
                ) : null}

                <EvidencePanel items={step.evidence} />
                <CheckpointCard checkpoint={step.checkpoint} />

                {step.id === 'step-6' ? (
                  <>
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
                  </>
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
          <ChapterUnlockReset label="重置学习路径" />
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
