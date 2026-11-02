import React, { useState } from 'react';
import { C, Canvas, clear, rect, text, line, street, giou, l1, type Box } from './detr-kit';

export const matchTargets: Box[] = [[0.22, 0.57, 0.13, 0.58], [0.48, 0.57, 0.13, 0.58]];
export const matchPredictions: Box[] = [[0.24, 0.58, 0.13, 0.58], [0.49, 0.57, 0.13, 0.58], [0.33, 0.57, 0.13, 0.58]];
export const personProbabilities = [0.78, 0.82, 0.93];
export const matchAssignments = [[0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [0, 1]];
export function matchParts(target: number, prediction: number) {
  const distance = l1(matchTargets[target], matchPredictions[prediction]);
  const overlap = giou(matchTargets[target], matchPredictions[prediction]);
  const classification = -personProbabilities[prediction];
  const box = 5 * distance + 2 * (1 - overlap);
  return { classification, distance, overlap, box, total: classification + box };
}
export const matchTotals = matchAssignments.map((a) => a.reduce((sum, p, t) => sum + matchParts(t, p).total, 0));
export const bestAssignment = matchTotals.indexOf(Math.min(...matchTotals));

function frame(ctx: CanvasRenderingContext2D, b: Box, color: string, dashed = false) {
  const [cx, cy, w, h] = b;
  rect(ctx, 20 + (cx - w / 2) * 620, 32 + (cy - h / 2) * 220, w * 620, h * 220, color, false, dashed);
}

function D7Content() {
  const [candidate, setCandidate] = useState(0);
  const assignment = matchAssignments[candidate];
  const unassigned = [0, 1, 2].find((p) => !assignment.includes(p))!;
  const best = candidate === bestAssignment;
  const selectedColor = best ? C.green : C.blue;
  const feedback = best
    ? `这是6种配法中总代价最小的一种：甲配预测${assignment[0] + 1}、乙配预测${assignment[1] + 1}。预测${unassigned + 1}接下来学习空类别。`
    : `当前甲配预测${assignment[0] + 1}、乙配预测${assignment[1] + 1}，总代价为${matchTotals[candidate].toFixed(3)}。试着更换配法，让类别分数与框的位置一起参与选择。`;

  return <div>
    <Canvas ariaLabel="三条预测与两个人的六种一一配对" draw={(ctx) => {
      clear(ctx);
      street(ctx, 20, 32, 620, 220);
      matchTargets.forEach((b, t) => {
        frame(ctx, b, C.green, true);
        text(ctx, t === 0 ? '甲' : '乙', 20 + b[0] * 620 - 8, 32 + (b[1] - b[3] / 2) * 220 - 10, 20, C.green);
      });
      matchPredictions.forEach((b, p) => {
        const active = assignment.includes(p);
        frame(ctx, b, active ? selectedColor : C.orange);
        text(ctx, String(p + 1), 20 + b[0] * 620 - 5, 32 + (b[1] + b[3] / 2) * 220 + 26, 22, active ? selectedColor : C.orange);
      });
      assignment.forEach((p, t) => {
        const a = matchTargets[t]; const b = matchPredictions[p];
        line(ctx, 20 + a[0] * 620, 32 + a[1] * 220, 20 + b[0] * 620, 32 + b[1] * 220, selectedColor, 4);
      });
      for (let t = 0; t < 2; t++) for (let p = 0; p < 3; p++) {
        const x = 730 + p * 112; const y = 90 + t * 105;
        const active = assignment[t] === p;
        ctx.beginPath(); ctx.arc(x, y, active ? 36 : 31, 0, Math.PI * 2);
        ctx.fillStyle = active ? selectedColor : '#e7ecdf'; ctx.fill();
        ctx.strokeStyle = active ? selectedColor : '#b8c9a7'; ctx.lineWidth = active ? 4 : 2; ctx.stroke();
        ctx.textAlign = 'center';
        text(ctx, matchParts(t, p).total.toFixed(2), x, y + 7, 21, active ? '#ffffff' : C.ink);
        ctx.textAlign = 'left';
      }
    }} />
    <div className="step-ctrl">
      <button type="button" className="tiny ghost" onClick={() => setCandidate(0)} disabled={candidate === 0}>重置</button>
      <button type="button" className="tiny ghost" onClick={() => setCandidate((v) => Math.max(0, v - 1))} disabled={candidate === 0}>上一种配法</button>
      <span className="step-label"><b>{candidate + 1}</b> / 6</span>
      <button type="button" className="tiny" onClick={() => setCandidate((v) => Math.min(5, v + 1))} disabled={candidate === 5}>下一种配法</button>
      <button type="button" className="tiny" onClick={() => setCandidate(bestAssignment)} disabled={best}>最小总代价</button>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table className="paper" aria-label="两个真实物体对三条预测的匹配代价">
        <thead><tr><th>配对代价</th><th>预测1：人的概率0.78</th><th>预测2：人的概率0.82</th><th>预测3：人的概率0.93</th></tr></thead>
        <tbody>{matchTargets.map((_, t) => <tr key={t}><th scope="row">{t === 0 ? '甲' : '乙'}</th>{matchPredictions.map((_, p) => <td key={p} style={assignment[t] === p ? { background: '#e7f4ec', fontWeight: 700, outline: `2px solid ${selectedColor}`, outlineOffset: '-2px' } : {}}>{matchParts(t, p).total.toFixed(3)}</td>)}</tr>)}</tbody>
      </table>
      <table className="paper" aria-label="当前配对的代价组成">
        <thead><tr><th>当前配对</th><th>类别代价 −p</th><th>5 × L1</th><th>2 × (1 − GIoU)</th><th>合计</th></tr></thead>
        <tbody>{assignment.map((p, t) => { const s = matchParts(t, p); return <tr key={t}><th scope="row">{t === 0 ? '甲' : '乙'} → 预测{p + 1}</th><td>{s.classification.toFixed(3)}</td><td>{(5 * s.distance).toFixed(3)}</td><td>{(2 * (1 - s.overlap)).toFixed(3)}</td><td>{s.total.toFixed(3)}</td></tr>; })}<tr><th scope="row">两项总代价</th><td colSpan={4}><b>{matchTotals[candidate].toFixed(3)}</b></td></tr></tbody>
      </table>
    </div>
    <div className={`feedback ${best ? 'good' : ''}`} role="status" aria-live="polite">{feedback}</div>
  </div>;
}

export function D7(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D7Content/></div>;}
