import React, { useState } from 'react';
import { C, Canvas, clear, rect, text, street, line, type Box } from './detr-kit';

type Slot = { box: Box; probabilities: [number, number, number] };
const SLOTS: Slot[] = [
  { box: [.22, .57, .16, .58], probabilities: [.90, .04, .06] },
  { box: [.48, .57, .16, .58], probabilities: [.75, .10, .15] },
  { box: [.74, .72, .28, .30], probabilities: [.04, .88, .08] },
  { box: [.88, .24, .12, .22], probabilities: [.12, .05, .83] },
];
const STAGES = ['预测位置', '四个坐标', '类别概率', '筛选展示'];
function best(slot: Slot) {
  return { className: slot.probabilities[0] >= slot.probabilities[1] ? '人' : '车', score: Math.max(slot.probabilities[0], slot.probabilities[1]) };
}
function pixelCorners(b: Box) {
  return [Math.round((b[0] - b[2] / 2) * 1000), Math.round((b[1] - b[3] / 2) * 600), Math.round((b[0] + b[2] / 2) * 1000), Math.round((b[1] + b[3] / 2) * 600)];
}
function D6Content() {
  const [step, setStep] = useState(0);
  const [threshold, setThreshold] = useState(.70);
  const kept = SLOTS.filter(s => best(s).score >= threshold).length;
  const stageFeedback = [
    '先用4个预测位置缩小算例，真实模型使用100个。这些位置会并行产生结果。',
    '每个位置同时给出一个框；四个数先记录相对中心和宽高，再换回图片上的像素坐标。',
    '每个位置还给出类别和空类别的概率。第4个位置的空类别概率为0.83，表示它主要学会了留空。',
    `按当前阈值${threshold.toFixed(2)}，展示${kept}个框。阈值只改变展示哪些框，匹配算法只在训练时使用。`,
  ];
  return <>
    <Canvas ariaLabel={`预测记录表第${step + 1}步：${STAGES[step]}`} draw={ctx => {
      clear(ctx); street(ctx, 30, 25, 650, 245);
      SLOTS.forEach((slot, i) => {
        const info = best(slot), visible = info.score >= threshold;
        const b = slot.box;
        if (step === 0) {
          ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(780 + (i % 2) * 140, 90 + Math.floor(i / 2) * 120, 26, 0, Math.PI * 2); ctx.fill();
          text(ctx, String(i + 1), 773 + (i % 2) * 140, 99 + Math.floor(i / 2) * 120, 24, '#ffffff');
        } else {
          if (step < 3 || visible) {
            const x = 30 + (b[0] - b[2] / 2) * 650, y = 25 + (b[1] - b[3] / 2) * 245;
            rect(ctx, x, y, b[2] * 650, b[3] * 245, step === 3 ? C.green : i === 3 ? C.orange : C.blue, false, i === 3 && step < 3);
            text(ctx, String(i + 1), x + 5, y + 22, 22, C.ink);
          }
          const barY = 40 + i * 62;
          text(ctx, String(i + 1), 735, barY + 22, 22, C.ink);
          rect(ctx, 780, barY, 240, 24, C.border, true);
          if (step >= 2) {
            ctx.save(); if (step === 3 && !visible) ctx.globalAlpha = .25;
            rect(ctx, 780, barY, 240 * info.score, 24, i === 3 ? C.orange : C.blue, true); ctx.restore();
            text(ctx, info.score.toFixed(2), 950, barY + 48, 20, C.ink);
          } else {
            rect(ctx, 780, barY, 240 * b[2], 24, C.light, true);
            text(ctx, b[2].toFixed(2), 950, barY + 48, 20, C.ink);
          }
          if (step === 3) line(ctx, 780 + threshold * 240, barY - 5, 780 + threshold * 240, barY + 28, C.orange, 3);
        }
      });
    }} />
    <div className="chip-row" style={{ alignItems: 'center' }}>
      <button type="button" className="chip" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>上一步</button>
      <strong>{step + 1} / 4 · {STAGES[step]}</strong>
      <button type="button" className="chip" onClick={() => setStep(Math.min(3, step + 1))} disabled={step === 3}>下一步</button>
      <button type="button" className="chip" onClick={() => { setStep(0); setThreshold(.70); }}>重置</button>
    </div>
    <div className="chip-row" style={{ alignItems: 'center' }}>
      <label style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>展示阈值 {threshold.toFixed(2)}
        <input aria-label="展示阈值" type="range" min=".10" max=".90" step=".01" value={threshold} disabled={step < 3}
          onChange={e => setThreshold(Number(e.target.value))} />
      </label>
      <span>{step === 3 ? `保留 ${kept} / 4 个框` : '尚未筛选'}</span>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 470 }}>
        <thead><tr><th>位置</th><th>左上 / 右下像素</th><th>人 / 车 / 空 概率</th><th>当前展示</th></tr></thead>
        <tbody>{SLOTS.map((slot, i) => {
          const info = best(slot), xy = pixelCorners(slot.box), visible = info.score >= threshold;
          return <tr key={i}><th>{i + 1}</th><td>{step >= 1 ? `(${xy[0]}, ${xy[1]}) / (${xy[2]}, ${xy[3]})` : '—'}</td>
            <td>{step >= 2 ? slot.probabilities.map(p => p.toFixed(2)).join(' / ') : '—'}</td>
            <td style={{ color: step === 3 ? visible ? C.green : C.muted : C.ink }}>{step === 3 ? visible ? `${info.className} · ${info.score.toFixed(2)}` : '低于阈值' : '—'}</td></tr>;
        })}</tbody>
      </table>
    </div>
    <div className={`feedback${step === 3 && kept === 3 ? ' good' : step === 3 && kept === 4 ? ' bad' : ''}`} aria-live="polite">
      {stageFeedback[step]}{step === 3 && kept === 4 ? '阈值较低时，第4条低分预测也会进入展示。' : step === 3 && kept < 3 ? '阈值提高后，图中的部分真实物体也被过滤了。' : ''}
    </div>
  </>;
}

export function D6(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D6Content/></div>;}
