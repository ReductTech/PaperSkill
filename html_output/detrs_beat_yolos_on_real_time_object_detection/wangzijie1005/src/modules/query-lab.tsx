import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { C, Scene, clear, photo, frame, bar, text, Feedback, Source } from './shared-kit';

function boxIou(x: number) {
  const overlap = Math.max(0, Math.min(x + 100, 350) - Math.max(x, 250)) * 90;
  return overlap / (18000 - overlap);
}
const examples = [
  { label: '常规训练 · 示意', color: C.blue, candidates: [{ score: 0.93, quality: 0.38 }, { score: 0.88, quality: 0.72 }, { score: 0.79, quality: 0.63 }] },
  { label: '质量监督 · 示意', color: C.green, candidates: [{ score: 0.91, quality: 0.86 }, { score: 0.85, quality: 0.78 }, { score: 0.76, quality: 0.54 }] },
];
export function QueryLab() {
  const [boxX, setBoxX] = useState(100);
  const [comparison, setComparison] = useState(false);
  const dragging = useRef<{ id: number; offset: number } | null>(null);
  const iou = boxIou(boxX);
  const clamp = (x: number) => Math.max(90, Math.min(330, x));
  const coordinate = (event: PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - rect.left) * 560 / rect.width, y: (event.clientY - rect.top) * 250 / rect.height }; };
  const stopDragging = (event: PointerEvent<HTMLCanvasElement>) => { if (dragging.current?.id !== event.pointerId) return; dragging.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  return <div onKeyDown={event => event.stopPropagation()}>
    <div className="chip-row"><button className="chip" disabled={boxX <= 90} onClick={() => setBoxX(x => clamp(x - 10))}>左移</button><button className="chip" disabled={boxX >= 330} onClick={() => setBoxX(x => clamp(x + 10))}>右移</button><button className="chip" onClick={() => setBoxX(250)}>对齐</button><button className="chip" onClick={() => { setBoxX(100); setComparison(false); }}>重置</button></div>
    <p style={{ fontSize: 16 }}>拖动橙色预测框，或用上方按钮移动。蓝框只作为教学参照，代表训练 / 评估时可见的真值。</p>
    <Scene height={250} label={`预测框横坐标 ${boxX.toFixed(0)}，固定分类分数 0.90，几何 IoU ${iou.toFixed(3)}。橙框可横向拖动，也可用按钮移动。`} onPointerDown={event => {
      const point = coordinate(event);
      if (point.x < boxX || point.x > boxX + 100 || point.y < 70 || point.y > 160) return;
      event.preventDefault(); dragging.current = { id: event.pointerId, offset: point.x - boxX }; event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => { if (dragging.current?.id !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return; setBoxX(clamp(coordinate(event).x - dragging.current.offset)); }} onPointerUp={stopDragging} onPointerCancel={stopDragging} draw={ctx => {
      clear(ctx, 560, 250); photo(ctx, 26, 24, 414, 187);
      frame(ctx, 250, 70, 100, 90, C.blue); frame(ctx, boxX, 70, 100, 90, C.orange);
      ctx.save(); ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(boxX + 50, 170); ctx.lineTo(boxX + 50, 185); ctx.stroke(); ctx.restore();
      bar(ctx, 463, 56, 27, 148, C.line); bar(ctx, 504, 56, 27, 148, C.line);
      bar(ctx, 463, 204 - 148 * 0.9, 27, 148 * 0.9, C.blue); if (iou > 0) bar(ctx, 504, 204 - 148 * iou, 27, 148 * iou, C.orange);
      text(ctx, '0.90', 453, 37, C.blue); text(ctx, iou.toFixed(2), 499, 37, C.orange); text(ctx, 'cls', 463, 227, C.ink); text(ctx, 'IoU', 503, 227, C.ink);
    }} />
    <div aria-live="polite" style={{ margin: '10px 0' }}>分类分数 <strong>0.90（固定）</strong> · 几何 IoU <strong>{iou.toFixed(3)}</strong> · 两个指标均以 0–1 为范围</div>
    <Feedback>教学示意：分类分数仍为 0.90，IoU = {iou.toFixed(3)}。高分类分数不能保证定位好。真实 IoU 只用于训练 / 评估；推理按预测分类分数取 Top-300。</Feedback>
    <div className="chip-row" style={{ marginTop: 14 }}><button className="chip" aria-pressed={comparison} onClick={() => setComparison(value => !value)}>{comparison ? '收起训练对照' : '比较两种训练结果'}</button></div>
    {comparison && <div>
      <p><strong>教学对照，非 Fig. 6 数据：</strong>下面人为构造两组各 3 个候选，帮助理解训练目标；颜色表达不同训练方案，不能用这些点估计真实提升。</p>
      <Scene height={190} label="两组人为构造的候选，每组各三项。每项蓝色或绿色柱表示分类分数，橙色柱表示定位 IoU；两组都按分类分数排序。" draw={ctx => {
        clear(ctx, 560, 190);
        examples.forEach((group, groupIndex) => {
          const offset = groupIndex * 280;
          group.candidates.forEach((candidate, index) => { const x = offset + 35 + index * 76; bar(ctx, x, 135 - candidate.score * 95, 20, candidate.score * 95, group.color); bar(ctx, x + 24, 135 - candidate.quality * 95, 20, candidate.quality * 95, C.orange); text(ctx, `#${index + 1}`, x + 7, 160, C.ink); });
        });
        text(ctx, '常规训练', 25, 24, C.blue); text(ctx, '质量监督', 305, 24, C.green);
      }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>{examples.map(group => <div key={group.label}><strong>{group.label}</strong>{group.candidates.map((candidate, index) => <div key={index} style={{ fontSize: 16 }}>候选 {index + 1}：分类 {candidate.score.toFixed(2)} / IoU {candidate.quality.toFixed(2)}</div>)}</div>)}</div>
      <Feedback>论文 Table 4 报告 47.9 → 48.7 AP（+0.8 AP 点，1× = 12 epochs）。示意候选不是原始统计点；推理排序没有使用这里为了讲解而列出的真实 IoU。</Feedback>
    </div>}
    <p style={{ fontSize: 16 }}>论文用分类与定位预测分布的差异描述不确定性，但没有指定范数类型或完整张量实现。本页不把它擅自改写成 L2 / KL / JS，也不计算一个推理“不确定性排名”。</p>
    <Source page={5} label="原文第 5 页 Eq. (2)–(3)；Top-300 见第 7 页 §5.3，消融见第 8 页 Table 4" />
  </div>;
}
