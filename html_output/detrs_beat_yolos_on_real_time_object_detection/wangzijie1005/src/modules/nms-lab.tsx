import { useState } from 'react';
import { C, Scene, clear, photo, frame, text, Feedback, Source } from './shared-kit';

type Box = { id: string; x: number; y: number; w: number; h: number; score: number };
const boxes: Box[] = [
  { id: 'A', x: 120, y: 65, w: 160, h: 115, score: 0.9 },
  { id: 'B', x: 145, y: 78, w: 160, h: 115, score: 0.8 },
  { id: 'C', x: 235, y: 78, w: 120, h: 95, score: 0.7 },
];
function iou(a: Box, b: Box) {
  const intersection = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
    * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return intersection / (a.w * a.h + b.w * b.h - intersection);
}
function suppress(threshold: number) {
  const kept: Box[] = [];
  const decisions: string[] = [];
  for (const box of [...boxes].sort((a, b) => b.score - a.score)) {
    const prior = kept.find(candidate => iou(candidate, box) > threshold);
    if (prior) decisions.push(`${box.id} 被 ${prior.id} 抑制（IoU ${iou(prior, box).toFixed(3)} > ${threshold.toFixed(2)}）`);
    else { kept.push(box); decisions.push(`${box.id} 保留`); }
  }
  return { kept, decisions };
}

export function NmsLab() {
  const [threshold, setThreshold] = useState(0.5);
  const { kept, decisions } = suppress(threshold);
  return <div onKeyDown={event => event.stopPropagation()}>
    <div className="chip-row">
      <label htmlFor="nms-threshold">NMS IoU 阈值 <strong>{threshold.toFixed(2)}</strong></label>
      <input id="nms-threshold" type="range" min="0.1" max="0.9" step="0.01" value={threshold} onChange={event => setThreshold(Number(event.target.value))} />
      <button className="chip" onClick={() => setThreshold(0.5)}>重置</button>
    </div>
    <Scene label={`三个同类教学候选框。阈值 ${threshold.toFixed(2)}，保留 ${kept.map(box => box.id).join('、')}。蓝色实线保留，红色虚线抑制。`} draw={ctx => {
      clear(ctx, 560, 240); photo(ctx, 58, 26, 444, 185);
      boxes.filter(box => !kept.includes(box)).forEach(box => {
        ctx.save(); ctx.setLineDash([7, 5]); frame(ctx, box.x, box.y, box.w, box.h, C.red); ctx.restore();
        text(ctx, `${box.id} ${box.score.toFixed(2)}`, box.x + 5, box.y + 20, C.red);
      });
      kept.forEach(box => { frame(ctx, box.x, box.y, box.w, box.h, C.blue); text(ctx, `${box.id} ${box.score.toFixed(2)}`, box.x + 5, box.y + 20, C.blue); });
    }} />
    <p style={{ color: C.ink, fontSize: 16 }}>蓝色实线＝保留；红色虚线＝抑制。三个框属于同一类别，按 0.90 → 0.80 → 0.70 依次处理；只有 IoU 大于当前阈值才抑制。</p>
    <Feedback>教学示意：保留 <strong>{kept.length}</strong> 个框。阈值改变去重强度，不能从这张示意图估计 AP。</Feedback>
    <div aria-live="polite" style={{ margin: '10px 0', fontSize: 16 }}>{decisions.map(line => <div key={line}>{line}</div>)}</div>
    <Source page={3} label="原文第 3 页 §3.1–3.2 / Table 1；上图为几何教学示意" />
  </div>;
}
