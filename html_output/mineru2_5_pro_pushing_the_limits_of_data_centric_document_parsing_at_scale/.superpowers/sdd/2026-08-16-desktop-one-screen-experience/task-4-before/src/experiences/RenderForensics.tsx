import { useEffect, useRef, useState } from 'react';
import { PaperMedia } from '../components/PaperMedia';
import type { ChapterExperienceProps } from '../types';
import '../styles/experience-labeling.css';

const compareState = (value: number) => value >= 100 ? 'compare-p100' : value >= 50 ? 'compare-p50' : 'compare-p0';

export function RenderForensics({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const [progress, setProgress] = useState(0);
  const [repaired, setRepaired] = useState(false);
  const completed = useRef(false);
  const comparison = compareState(progress);
  const hotspotVisible = progress >= 65 && !repaired;

  useEffect(() => {
    if (restoredModuleState?.moduleId !== 'render-verify') return;
    if (restoredModuleState.state === 'repaired') {
      setProgress(100);
      setRepaired(true);
      return;
    }
    const restoredProgress = restoredModuleState.state === 'compare-p0' ? 0 : restoredModuleState.state === 'compare-p50' ? 50 : restoredModuleState.state === 'compare-p100' ? 100 : null;
    if (restoredProgress !== null) {
      setProgress(restoredProgress);
      setRepaired(false);
    }
  }, [restoredModuleState]);

  const repair = () => {
    setRepaired(true);
    onInteract('render-verify');
    onStateChange({ moduleId: 'render-verify', state: 'repaired' });
    if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  return <section className="render-forensics" aria-label="Render then Verify 取证">
    <header className="render-forensics__header">
      <div><span className="source-tag paper">论文原图节选</span><h3>用渲染回看结构恢复的证据</h3></div>
      <p>拖动同一个滑条，定位合并单元格的错位。</p>
    </header>

    <div className="render-forensics__compare" data-testid="render-forensics-canvas" data-compare={comparison} data-repaired={String(repaired)} style={{ '--compare-progress': `${progress}%` } as React.CSSProperties}>
      <PaperMedia assetId="omni-table" cropId="mergedCells" label="论文原图节选" caption="公式与合并单元格裁图，只用于验证视觉结构。" />
      <div className="render-forensics__rendered" aria-hidden="true"><span>教学示意渲染</span><i className={repaired ? 'is-aligned' : ''} /></div>
      <div className="render-forensics__split" aria-hidden="true" />
      {hotspotVisible ? <button type="button" className="render-forensics__hotspot" onClick={repair} aria-describedby="render-hotspot-help">修复合并单元格错位</button> : null}
    </div>
    <p id="render-hotspot-help" className="render-forensics__hotspot-help">当结构与原图相差足够明显时，这个热点可通过键盘聚焦和触发。</p>

    <label className="render-forensics__slider">结构与原图对比进度
      <input type="range" min="0" max="100" value={progress} onChange={(event) => {
        const nextProgress = Number(event.target.value);
        setProgress(nextProgress);
        setRepaired(false);
        onInteract('render-verify');
        onStateChange({ moduleId: 'render-verify', state: compareState(nextProgress) });
      }} />
    </label>

    <div className="render-forensics__code" aria-live="polite">
      <article data-testid="render-source"><span className="source-tag teaching">教学示意</span><strong>生成的结构代码</strong><code>{repaired ? '<td colspan="2">总计</td>' : '<td>总计</td><td></td>'}</code></article>
      <article data-testid="render-diff"><span className="source-tag teaching">教学示意</span><strong>渲染差异</strong><code>{repaired ? '已同步：源码、对齐和差异覆盖层已更新' : '演示错误：合并单元格边界向右错位'}</code></article>
    </div>
    <p className="experience-boundary">专家兜底：教学示意不能替代真实标注或人工复核。</p>
  </section>;
}

export default RenderForensics;
