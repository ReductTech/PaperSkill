import { useEffect, useRef, useState } from 'react';
import type { ChapterExperienceProps } from '../types';
import '../styles/experience-labeling.css';

const compareState = (value: number) => value >= 100 ? 'compare-p100' : value >= 50 ? 'compare-p50' : 'compare-p0';

function reducedMotionProgress() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 100 : 0;
}

type TableVariant = 'truth' | 'broken' | 'repaired';

/**
 * 自制教学示意表：同一张含合并单元格的小表，按“原表 / 错误渲染 / 修复后渲染”
 * 三种形态输出。所有数字均为占位教学值，不对应论文结果。
 */
function SpecTable({ variant }: { variant: TableVariant }) {
  const testId = variant === 'truth' ? 'rf-truth-table' : 'rf-render-table';
  const className = `rf-table${variant === 'broken' ? ' rf-table--broken' : ''}${variant === 'repaired' ? ' rf-table--repaired' : ''}`;
  return (
    <table className={className} data-testid={testId} data-variant={variant}>
      <caption>{variant === 'truth' ? '合并单元格示例（教学重绘）' : variant === 'broken' ? '渲染输出（教学示意 · 含错位）' : '渲染输出（教学示意 · 已修复）'}</caption>
      <thead>
        <tr><th>组别</th><th>指标</th><th>配置</th><th>得分</th></tr>
      </thead>
      <tbody>
        {variant === 'broken' ? (
          <>
            <tr><th>A 组</th><td>准确率</td><td>默认</td><td>82.4</td></tr>
            <tr>
              <th className="rf-dup">A 组<span className="rf-badge">跨行断裂</span></th>
              <td>召回率</td><td>默认</td><td>79.1</td>
            </tr>
            <tr>
              <th className="rf-split-cell">汇总<span className="rf-badge">合并丢失</span></th>
              <td className="rf-empty" aria-label="错位多出的空单元格" /><td>加权</td><td>80.8</td>
            </tr>
          </>
        ) : variant === 'repaired' ? (
          <>
            <tr><th rowSpan={2}>A 组<span className="rf-badge is-ok">✓ 跨行保留</span></th><td>准确率</td><td>默认</td><td>82.4</td></tr>
            <tr><td>召回率</td><td>默认</td><td>79.1</td></tr>
            <tr><th colSpan={2}>汇总<span className="rf-badge is-ok">✓ 合并保留</span></th><td>加权</td><td>80.8</td></tr>
          </>
        ) : (
          <>
            <tr><th rowSpan={2}>A 组</th><td>准确率</td><td>默认</td><td>82.4</td></tr>
            <tr><td>召回率</td><td>默认</td><td>79.1</td></tr>
            <tr><th colSpan={2}>汇总</th><td>加权</td><td>80.8</td></tr>
          </>
        )}
      </tbody>
    </table>
  );
}

export function RenderForensics({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const [progress, setProgress] = useState(reducedMotionProgress);
  const [repaired, setRepaired] = useState(false);
  const completed = useRef(false);
  const comparison = compareState(progress);
  const repairAvailable = progress >= 65;

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
    if (repaired) return;
    setRepaired(true);
    onInteract('render-verify');
    onStateChange({ moduleId: 'render-verify', state: 'repaired' });
    if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  return <section className="render-forensics" aria-label="Render then Verify 取证">
    <div className="render-forensics__bench" data-testid="render-forensics-bench">
      <div
        className="render-forensics__canvas"
        data-testid="render-forensics-canvas"
        data-compare={comparison}
        data-repaired={String(repaired)}
        style={{ '--compare-progress': `${progress}%`, '--compare-ratio': `${progress / 100}` } as React.CSSProperties}
      >
        <figure className="render-forensics__layer render-forensics__layer--truth">
          <span className="render-forensics__chip">原表 · 教学重绘</span>
          <SpecTable variant="truth" />
        </figure>
        <figure className="render-forensics__layer render-forensics__layer--rendered" aria-hidden="true">
          <span className="render-forensics__chip">渲染输出 · 教学示意</span>
          <SpecTable variant={repaired ? 'repaired' : 'broken'} />
        </figure>
        <div className="render-forensics__split" aria-hidden="true" />
        <p className="render-forensics__caption">拖动对比：合并单元格在渲染中如何断裂错位 · 表格全为自制教学示意</p>
      </div>

      <aside className="render-forensics__sidecar" aria-label="渲染取证控制台">
        <label className="render-forensics__slider">结构与原表对比进度
          <input type="range" min="0" max="100" value={progress} onChange={(event) => {
            const nextProgress = Number(event.target.value);
            setProgress(nextProgress);
            setRepaired(false);
            onInteract('render-verify');
            onStateChange({ moduleId: 'render-verify', state: compareState(nextProgress) });
          }} />
        </label>

        <div className="render-forensics__code" aria-live="polite">
          <article data-testid="render-source"><span className="source-tag teaching">教学示意</span><strong>当前结构代码</strong><code>{repaired ? '<td colspan="2">汇总</td>' : '<td>汇总</td><td></td>'}</code></article>
          <article data-testid="render-diff"><span className="source-tag teaching">教学示意</span><strong>视觉核验</strong><code>{repaired ? '教学演示已应用：跨列边界与渲染叠层同步' : progress < 50 ? '继续拖动，让结构差异显形' : '演示错误：合并单元格边界向右错位'}</code></article>
        </div>

        {repairAvailable ? <button type="button" className="render-forensics__repair" onClick={repair} disabled={repaired}>应用局部结构修复</button> : <p className="render-forensics__hint">差异露出 65% 后可执行局部修复。</p>}
      </aside>
    </div>

    <details className="render-forensics__evidence-note">
      <summary>来源与事实边界</summary>
      <p>本节的表格、渲染错位、结构代码与局部修复全部为自制教学构造，仅用于理解 render-then-verify 的必要性；它们不对应任何论文页面或真实模型输出，也不能据此推断自动修复成效或具体数据归属。</p>
    </details>
  </section>;
}

export default RenderForensics;
