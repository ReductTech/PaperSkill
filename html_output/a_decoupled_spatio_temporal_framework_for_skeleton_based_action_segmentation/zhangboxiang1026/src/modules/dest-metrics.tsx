// Refinement 2026-10-22. Constructed 12-frame examples; metrics are computed, never paper results.
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
type Segment = { label: string; start: number; end: number };
const gt = Array.from({ length: 12 }, (_, i) => i < 6 ? 'A' : 'B');
const cases = [
  { name: '完整片段', pred: gt, why: '类别和边界都正确，逐帧准确率与片段 F1@50 都是 100%。' },
  { name: '短暂误报', pred: gt.map((label, i) => i === 2 ? 'B' : label), why: '只错一帧，却把完整的 A 切成两段，还插入一个假的 B。逐帧准确率仍很高，片段指标会额外惩罚这些碎片。' },
  { name: '边界偏移', pred: gt.map((label, i) => i === 6 ? 'A' : label), why: '也只错一帧，但仍只有两个完整动作。两段与真值的 IoU 都超过 0.50，因此此示例的 F1@50 仍是 100%；这不表示边界完全准确。' },
];
function segments(labels: string[]): Segment[] {
  const out: Segment[] = [];
  labels.forEach((label, i) => { if (!out.length || out[out.length - 1].label !== label) out.push({ label, start: i, end: i + 1 }); else out[out.length - 1].end = i + 1; });
  return out;
}
function score(pred: string[]) {
  const targets = segments(gt); const proposals = segments(pred); const matched = new Set<number>(); let tp = 0;
  proposals.forEach(p => {
    let best = -1, bestIoU = 0;
    targets.forEach((t, i) => {
      if (matched.has(i) || t.label !== p.label) return;
      const intersection = Math.max(0, Math.min(p.end, t.end) - Math.max(p.start, t.start));
      const iou = intersection / (Math.max(p.end, t.end) - Math.min(p.start, t.start));
      if (iou >= .5 && iou > bestIoU) { best = i; bestIoU = iou; }
    });
    if (best >= 0) { matched.add(best); tp++; }
  });
  const fp = proposals.length - tp, fn = targets.length - tp;
  return { accuracy: pred.filter((label, i) => label === gt[i]).length / 12 * 100, f1: 2 * tp / (2 * tp + fp + fn) * 100, tp, fp, fn, count: proposals.length };
}
export const DestMetrics: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(1); const example = cases[selected]; const result = score(example.pred);
  return <div className="dest-refined">
    <p className="dest-eyebrow">12 帧教学序列 · A / B 表示两种动作</p>
    <div className="ctrl">{cases.map((item, i) => <button key={item.name} className={'chip' + (selected === i ? ' active' : '')} aria-pressed={selected === i} onClick={() => setSelected(i)}>{item.name}</button>)}</div>
    <div className="dest-frame-row"><strong>真实标签</strong><div>{gt.map((label, i) => <span key={i} data-label={label}>{label}</span>)}</div></div>
    <div className="dest-frame-row"><strong>预测标签</strong><div>{example.pred.map((label, i) => <span key={i} data-label={label} className={label !== gt[i] ? 'is-error' : ''}>{label}</span>)}</div></div>
    <div className="dest-metric-grid"><div><span>逐帧 Acc</span><strong>{result.accuracy.toFixed(1)}%</strong></div><div><span>片段 F1@50</span><strong>{result.f1.toFixed(1)}%</strong></div><div><span>预测片段数</span><strong>{result.count}<small> / 真值 2 段</small></strong></div></div>
    <div className="feedback" aria-live="polite">{example.why}</div>
    <details className="dest-details"><summary>这两个指标怎样算？</summary><p>Acc 是答对的帧数除以总帧数。片段 F1 则先把连续相同类别合成动作片段；只有类别相同、片段 IoU ≥ 0.50，并且没有重复匹配，才计为一个正确片段。</p><p>当前 TP={result.tp}、FP={result.fp}、FN={result.fn}；F1 = 2TP / (2TP + FP + FN)。这解释了为什么高帧准确率仍可能伴随严重过分割。论文还报告 Edit 分数，用来衡量动作标签序列的顺序质量。</p></details>
    <p className="module-note">§4.2 定义论文采用的指标。上面三个序列和实时计算均为教学示例，不是论文预测、实验数据或模型性能。</p>
  </div>;
};
