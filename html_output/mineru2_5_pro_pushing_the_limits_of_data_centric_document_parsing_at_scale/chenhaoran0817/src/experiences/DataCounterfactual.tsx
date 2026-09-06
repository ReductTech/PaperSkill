import { useEffect, useRef, useState } from 'react';
import { useGlossaryAttentionPause } from '../components/Glossary';
import { OMNIDOCBENCH_PAPER_URL } from '../data/media';
import type { ChapterExperienceProps } from '../types';

type Choice = 'ordinary' | 'tail';
type PreviewPhase = 'waiting' | 'ordinary-arriving' | 'tail-formula' | 'tail-table' | 'tail-multicolumn' | 'complete';

function OrdinaryPage({ index }: { index: number }) {
  return <div className="ordinary-page" aria-label={`教学示意：普通单栏页 ${index + 1}`}>
    <span className="ordinary-page__tag">教学示意</span>
    <i className="ordinary-page__title" />
    <i /><i /><i /><i className="short" /><i /><i className="short" />
  </div>;
}

/** 自制教学示意：复杂公式页（分式、根号、求和）。 */
function TailFormulaPage() {
  return <div className="tail-page tail-page--formula" data-page-kind="formula" role="img" aria-label="教学示意：复杂公式页，含分式与根号">
    <span className="tail-page__tag">公式页</span>
    <i className="tail-page__title" />
    <i /><i className="short" />
    <div className="tail-page__equation" aria-hidden="true">
      <em>∫</em>
      <span className="tail-page__fraction"><i /><b /><i /></span>
      <em>=</em>
      <span className="tail-page__radical"><i /></span>
    </div>
    <i /><i /><i className="short" />
    <div className="tail-page__equation" aria-hidden="true">
      <em>Σ</em>
      <span className="tail-page__fraction"><i /><b /><i /></span>
      <em>×</em>
      <span className="tail-page__radical"><i /></span>
    </div>
    <i /><i className="short" />
  </div>;
}

/** 自制教学示意：复杂表格页（横向与纵向合并单元格）。 */
function TailTablePage() {
  return <div className="tail-page tail-page--table" data-page-kind="table" role="img" aria-label="教学示意：复杂表格页，含合并单元格">
    <span className="tail-page__tag">表格页</span>
    <i className="tail-page__title" />
    <i className="short" />
    <div className="tail-page__grid" aria-hidden="true">
      <b /><b /><b /><b />
      <u className="m-v" /><u className="m-h" /><u />
      <u /><u />
      <u /><u /><u />
    </div>
    <i /><i className="short" />
  </div>;
}

/** 自制教学示意：三栏版式页（跨栏图与 caption）。 */
function TailMultiColumnPage() {
  return <div className="tail-page tail-page--multicolumn" data-page-kind="multicolumn" role="img" aria-label="教学示意：多栏版式页，含跨栏插图">
    <span className="tail-page__tag">三栏页</span>
    <i className="tail-page__title" />
    <div className="tail-page__columns" aria-hidden="true">
      <div><i /><i /><i /><i className="short" /></div>
      <div><i /><span className="tail-page__figure">图</span><i className="short" /><i /></div>
      <div><i /><i /><i className="short" /><i /></div>
    </div>
    <i /><i className="short" />
  </div>;
}

function TailExample({ index }: { index: number }) {
  if (index === 3) return <TailFormulaPage />;
  if (index === 4) return <TailTablePage />;
  return <TailMultiColumnPage />;
}

export function DataCounterfactual({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const attentionPaused = useGlossaryAttentionPause();
  const initialChoice = restoredModuleState?.moduleId === 'data-bias'
    && (restoredModuleState.state === 'ordinary' || restoredModuleState.state === 'tail')
    ? restoredModuleState.state as Choice
    : null;
  const rootRef = useRef<HTMLElement>(null);
  const [choice, setChoice] = useState<Choice | null>(initialChoice);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const [hasUserChoice, setHasUserChoice] = useState(Boolean(initialChoice));
  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>('waiting');
  const [previewStopped, setPreviewStopped] = useState(false);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const completed = useRef(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !('IntersectionObserver' in window)) {
      setHasEnteredViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setHasEnteredViewport(true);
      observer.disconnect();
    }, { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEnteredViewport || hasUserChoice || previewStopped) return undefined;
    if (reducedMotion) {
      setPreviewPhase('complete');
      return undefined;
    }

    setPreviewPhase('ordinary-arriving');
    const timers = [
      window.setTimeout(() => setPreviewPhase('tail-formula'), 2500),
      window.setTimeout(() => setPreviewPhase('tail-table'), 3500),
      window.setTimeout(() => setPreviewPhase('tail-multicolumn'), 4500),
      window.setTimeout(() => setPreviewPhase('complete'), 6000),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [hasEnteredViewport, hasUserChoice, previewStopped, reducedMotion]);

  useEffect(() => {
    const previewIsRunning = previewPhase !== 'waiting' && previewPhase !== 'complete';
    if (attentionPaused && hasEnteredViewport && !hasUserChoice && previewIsRunning) {
      setPreviewStopped(true);
    }
  }, [attentionPaused, hasEnteredViewport, hasUserChoice, previewPhase]);

  useEffect(() => {
    if (restoredModuleState?.moduleId === 'data-bias' && (restoredModuleState.state === 'ordinary' || restoredModuleState.state === 'tail')) {
      setChoice(restoredModuleState.state);
      setHasUserChoice(true);
      setPreviewStopped(true);
    }
  }, [restoredModuleState]);

  const choose = (next: Choice) => {
    setChoice(next);
    setHasUserChoice(true);
    setPreviewStopped(true);
    onInteract('data-bias');
    onStateChange({ moduleId: 'architecture-lock', state: 'locked' });
    onStateChange({ moduleId: 'data-bias', state: next });
    if (next === 'tail' && !completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  const previewCoverage = previewPhase === 'tail-formula' ? 1
    : previewPhase === 'tail-table' ? 2
      : previewPhase === 'tail-multicolumn' || previewPhase === 'complete' ? 3 : 0;
  const isCovered = (index: number) => hasUserChoice ? choice === 'tail' : previewCoverage > index;
  const slotHasTailExample = (index: number) => index >= 3 && isCovered(index - 3);
  const previewState = hasUserChoice ? `user-${choice}` : previewPhase;
  const hint = hasUserChoice
    ? '你的选择已接管画面并保存为本章状态。'
    : previewStopped
      ? '自动对照已暂停在当前关键帧；请用下方选择继续。'
      : previewPhase === 'complete'
        ? '自动对照仅建立直觉；只有你的选择会保存状态。'
        : previewPhase === 'waiting'
          ? '进入视口后才开始一次自动对照。'
          : previewCoverage > 0
            ? '长尾页正在依次补上公式、表格与多栏缺口。'
            : '普通页正在进入同一预算的对照。';
  return (
    <section ref={rootRef} className="data-counterfactual" data-preview={previewState} aria-label="等预算数据反事实">
      <header className="data-counterfactual__header">
        <div>
          <span className="source-tag teaching">等预算教学对照</span>
          <h3>同一预算下，缺口会留在哪里？</h3>
        </div>
        <div className="architecture-lock" aria-label="架构控制变量已锁定"><strong>固定 1.2B</strong><span>架构锁定</span></div>
      </header>

      <div className="data-counterfactual__budget" aria-label="固定采样预算">
        <span>相同采样预算</span><i aria-hidden="true" /><span>只改变补充策略</span>
      </div>

      <div className="data-counterfactual__stage">
        <div className="data-counterfactual__slots" aria-label="六格固定数据预算">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              id={`budget-slot-${index + 1}`}
              className={`budget-slot ${slotHasTailExample(index) ? 'is-tail' : 'is-ordinary'}`}
              data-testid="budget-slot"
              key={index}
            >
              {slotHasTailExample(index) ? <TailExample index={index} /> : <OrdinaryPage index={index} />}
            </div>
          ))}
        </div>
        <div className="data-counterfactual__gaps" aria-live="polite">
          <span className="gap-chip" data-slot="4" aria-controls="budget-slot-4" data-covered={isCovered(0) ? 'true' : 'false'}><b>槽位 4</b><em>复杂公式</em></span>
          <span className="gap-chip" data-slot="5" aria-controls="budget-slot-5" data-covered={isCovered(1) ? 'true' : 'false'}><b>槽位 5</b><em>复杂表格</em></span>
          <span className="gap-chip" data-slot="6" aria-controls="budget-slot-6" data-covered={isCovered(2) ? 'true' : 'false'}><b>槽位 6</b><em>多栏版式</em></span>
        </div>
      </div>

      <div className="data-counterfactual__actions" role="group" aria-label="选择数据补充策略">
        <button type="button" aria-pressed={choice === 'ordinary'} onClick={() => choose('ordinary')}>继续普通页</button>
        <button type="button" aria-pressed={choice === 'tail'} onClick={() => choose('tail')}>补长尾页</button>
      </div>

      <p className="data-counterfactual__hint" role="status">
        {hint}
      </p>
      <div className="data-counterfactual__result">
        <output aria-describedby="full-process-boundary">+2.71</output>
        <p id="full-process-boundary">论文报告的端点差值来自完整流程的数据工程与训练组合，不能归因于这一次补页操作。</p>
      </div>
      <div className="data-counterfactual__source-boundary">
        <a href={OMNIDOCBENCH_PAPER_URL} target="_blank" rel="noreferrer">版式类别参照：OmniDocBench Figure S7/S10</a>
        <p className="experience-boundary">事实边界：三个长尾格是自制教学示意，仅表达公式、合并单元格表格与多栏版式三类复杂度；它们不是 MinerU2.5-Pro 的训练样本、296 页 Hard 子集或独立性能证据。</p>
      </div>
    </section>
  );
}

export default DataCounterfactual;
