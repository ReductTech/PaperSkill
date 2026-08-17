import { useEffect, useRef, useState } from 'react';
import { PaperMedia } from '../components/PaperMedia';
import type { ChapterExperienceProps } from '../types';

type Choice = 'ordinary' | 'tail';

export function DataCounterfactual({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const [choice, setChoice] = useState<Choice>('ordinary');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [previewComplete, setPreviewComplete] = useState(reducedMotion);
  const completed = useRef(false);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = window.setTimeout(() => setPreviewComplete(true), 6000);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (restoredModuleState?.moduleId === 'data-bias' && (restoredModuleState.state === 'ordinary' || restoredModuleState.state === 'tail')) {
      setChoice(restoredModuleState.state);
    }
  }, [restoredModuleState]);

  const choose = (next: Choice) => {
    setChoice(next);
    onInteract('data-bias');
    onStateChange({ moduleId: 'architecture-lock', state: 'locked' });
    onStateChange({ moduleId: 'data-bias', state: next });
    if (next === 'tail' && !completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  const tail = choice === 'tail';
  return (
    <section className="data-counterfactual" data-preview={previewComplete ? 'tail-previewed' : 'ordinary-arriving'} aria-label="等预算数据反事实">
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
        <article className="counterfactual-lane counterfactual-lane--ordinary" data-active={choice === 'ordinary'}>
          <div><strong>继续加入普通页</strong><span>数量上升，高频版式仍重复进入</span></div>
          <PaperMedia assetId="omni-layout" cropId="doubleColumn" label="论文原图节选" caption="Figure S7 的双栏页面，用作普通版式的可视化对照。" />
        </article>
        <article className="counterfactual-lane counterfactual-lane--tail" data-active={tail}>
          <div><strong>补长尾页</strong><span>把低频版式带入候选范围</span></div>
          <PaperMedia assetId="omni-layout" cropId="complexLayout" label="论文原图节选" caption="Figure S7 的复杂版式页面，用作长尾版式的可视化对照。" />
        </article>
      </div>

      <div className="data-counterfactual__gaps" aria-live="polite">
        <span data-covered={tail ? 'true' : 'false'}>复杂公式</span>
        <span data-covered={tail ? 'true' : 'false'}>复杂表格</span>
        <span data-covered={tail ? 'true' : 'false'}>多栏版式</span>
      </div>

      <div className="data-counterfactual__actions" role="group" aria-label="选择数据补充策略">
        <button type="button" aria-pressed={choice === 'ordinary'} onClick={() => choose('ordinary')}>继续普通页</button>
        <button type="button" aria-pressed={tail} onClick={() => choose('tail')}>补长尾页</button>
      </div>

      <p className="data-counterfactual__hint" role="status">
        {previewComplete ? '自动对照仅建立直觉；只有你的选择会保存状态。' : '普通页正在进入同一预算的对照。'}
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
