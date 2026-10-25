import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawKnob, drawSceneLabel, drawTarget, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;
const GRID = 20;

function loss(a: number): number {
  return 0.9 + (a - 0.5) * (a - 0.5) * 2.2;
}

export const M6Search: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const alpha = step / (GRID - 1);
  const cur = loss(alpha);
  let bestI = 0;
  for (let i = 0; i < GRID; i++) if (loss(i / (GRID - 1)) < loss(bestI / (GRID - 1))) bestI = i;

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawKnob(ctx, 150, 120, 52, alpha * Math.PI * 1.6 - Math.PI * 0.8);
    drawSceneLabel(ctx, 150, 190, `α = ${alpha.toFixed(2)}`, AQ.ink, 15, 'center');
    // loss curve
    const x0 = 330;
    const x1 = 1030;
    const y0 = 230;
    const y1 = 60;
    ctx.strokeStyle = AQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y1);
    ctx.lineTo(x0, y0);
    ctx.stroke();
    ctx.strokeStyle = AQ.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < GRID; i++) {
      const a = i / (GRID - 1);
      const xx = x0 + a * (x1 - x0);
      const yy = y0 - ((loss(a) - 0.85) / 1.5) * (y0 - y1);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    // best marker
    const bx = x0 + (bestI / (GRID - 1)) * (x1 - x0);
    const by = y0 - ((loss(bestI / (GRID - 1)) - 0.85) / 1.5) * (y0 - y1);
    drawTarget(ctx, bx, by, 9);
    // current marker
    const cx = x0 + alpha * (x1 - x0);
    const cy = y0 - ((cur - 0.85) / 1.5) * (y0 - y1);
    ctx.fillStyle = AQ.orange;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, x0, y0 + 26, 'α →', AQ.muted, 12);
    drawLegend(ctx, x0, 260, [
      { label: '误差', color: AQ.blue },
      { label: '最优', color: AQ.green },
      { label: '当前', color: AQ.orange },
    ]);
  }, W, H);

  const cls = step === bestI ? 'good' : alpha > 0.8 ? 'bad' : '';
  const text =
    step === bestI
      ? '这一档误差最小（示意；论文在 [0,1] 上用 20 档网格搜索最优 α）。'
      : alpha < 0.2
      ? '几乎不缩放，显著通道没被保护。'
      : alpha > 0.8
      ? '缩放过头，非显著通道的误差开始抬头。'
      : '继续试，误差在下降。';

  return (
    <div>
      <canvas id="cv-m6-search" ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>
          ← 上一档
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / {GRID} 档
        </span>
        <button className="tiny" onClick={() => setStep((v) => Math.min(GRID - 1, v + 1))} disabled={step === GRID - 1}>
          下一档 →
        </button>
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M6Search;
