import { useEffect, useRef, useState } from 'react';
import { useGlossaryAttentionPause } from '../components/Glossary';
import { PaperMedia } from '../components/PaperMedia';
import type { ChapterExperienceProps } from '../types';

type Choice = 'ordinary' | 'tail';
type PreviewPhase = 'waiting' | 'ordinary-arriving' | 'tail-formula' | 'tail-table' | 'tail-multicolumn' | 'complete';

export function DataCounterfactual({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const attentionPaused = useGlossaryAttentionPause();
  const initialChoice = restoredModuleState?.moduleId === 'data-bias'
    && (restoredModuleState.state === 'ordinary' || restoredModuleState.state === 'tail')
    ? restoredModuleState.state as Choice
    : null;
  const rootRef = useRef<HTMLElement>(null);
  const [choice, setChoice] = useState<Choice>(initialChoice ?? 'ordinary');
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
  const tail = hasUserChoice ? choice === 'tail' : previewCoverage > 0;
  const ordinaryActive = hasUserChoice ? choice === 'ordinary' : previewPhase === 'ordinary-arriving';
  const isCovered = (index: number) => hasUserChoice ? choice === 'tail' : previewCoverage > index;
  const previewState = hasUserChoice ? `user-${choice}` : previewPhase;
  const hint = hasUserChoice
    ? '你的选择已接管画面并保存为本章状态。'
    : previewStopped
      ? '自动对照已暂停在当前关键帧；请用下方选择继续。'
      : previewPhase === 'complete'
        ? '自动对照仅建立直觉；只有你的选择会保存状态。'
        : previewPhase === 'waiting'
          ? '进入视口后才开始一次自动对照。'
          : tail
            ? '长尾页正在依次补上公式、表格与多栏缺口。'
            : '普通页正在进入同一预算的对照。';
  return (
    <section ref={rootRef} className="data-counterfactual" data-preview={previewState} aria-label="等预算数据反事实">
      <header className="data-counterfactual__header">
        <div>
          <span className="source-tag paper">论文原图节选</span>
          <h3>同一预算下，缺口会留在哪里？</h3>
        </div>
        <div className="architecture-lock" aria-label="架构控制变量已锁定"><strong>固定 1.2B</strong><span>架构锁定</span></div>
      </header>

      <div className="data-counterfactual__budget" aria-label="固定采样预算">
        <span>相同采样预算</span><i aria-hidden="true" /><span>只改变补充策略</span>
      </div>

      <div className="data-counterfactual__comparison">
        <article className="counterfactual-lane counterfactual-lane--ordinary" data-active={ordinaryActive}>
          <div><strong>继续加入普通页</strong><span>数量上升，高频版式仍重复进入</span></div>
          <PaperMedia assetId="omni-layout" cropId="doubleColumn" label="论文原图节选" caption="Figure S7 的双栏页面，用作普通版式的可视化对照。" />
        </article>
        <article className="counterfactual-lane counterfactual-lane--tail" data-active={tail}>
          <div><strong>补长尾页</strong><span>把低频版式带入候选范围</span></div>
          <PaperMedia assetId="omni-layout" cropId="complexLayout" label="论文原图节选" caption="Figure S7 的复杂版式页面，用作长尾版式的可视化对照。" />
        </article>
      </div>

      <div className="data-counterfactual__gaps" aria-live="polite">
        <span data-covered={isCovered(0) ? 'true' : 'false'}>复杂公式</span>
        <span data-covered={isCovered(1) ? 'true' : 'false'}>复杂表格</span>
        <span data-covered={isCovered(2) ? 'true' : 'false'}>多栏版式</span>
      </div>

      <div className="data-counterfactual__actions" role="group" aria-label="选择数据补充策略">
        <button type="button" aria-pressed={choice === 'ordinary'} onClick={() => choose('ordinary')}>继续普通页</button>
        <button type="button" aria-pressed={tail} onClick={() => choose('tail')}>补长尾页</button>
      </div>

      <p className="data-counterfactual__hint" role="status">
        {hint}
      </p>
      <div className="data-counterfactual__result">
        <output aria-describedby="full-process-boundary">+2.71</output>
        <p id="full-process-boundary">论文报告的端点差值来自完整流程的数据工程与训练组合，不能归因于这一次补页操作。</p>
      </div>
      <p className="experience-boundary">事实边界：这里的 Figure S7 裁图来自 OmniDocBench，只展示版式样例，不是 MinerU2.5-Pro 的训练样本或独立性能证据。</p>
    </section>
  );
}

export default DataCounterfactual;
