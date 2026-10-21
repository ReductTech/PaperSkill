import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPath, drawBar, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;

export const M1Budget: React.FC<WidgetProps> = () => {
  const [budget, setBudget] = useState(160);

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // left: a path that can be paved as far as the budget allows
    drawPath(ctx, 50, 90, 8, 44, 10, (i) => (i < Math.round((budget / 500) * 8) ? { filled: true } : { cracked: budget < 72 && i === 7 }));
    drawSceneLabel(ctx, 50, 78, '小径进度', GQ.ink, 13);
    // right: model size bars + device line
    const x0 = 560;
    const x1 = 1040;
    const scale = (v: number) => x0 + (v / 350) * (x1 - x0);
    const bx = scale(budget);
    ctx.strokeStyle = GQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, 44);
    ctx.lineTo(bx, 214);
    ctx.stroke();
    drawBar(ctx, x0, 60, x1 - x0, 20, 326 / 350, budget >= 326 ? GQ.green : GQ.red);
    drawBar(ctx, x0, 108, x1 - x0, 20, 164 / 350, budget >= 164 ? GQ.green : GQ.red);
    drawBar(ctx, x0, 156, x1 - x0, 20, 72 / 350, budget >= 72 ? GQ.green : GQ.red);
    const dx = scale(80);
    ctx.strokeStyle = GQ.purple;
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(dx, 44);
    ctx.lineTo(dx, 214);
    ctx.stroke();
    ctx.setLineDash([]);
    drawLegend(ctx, x0, 246, [
      { label: 'FP16', color: GQ.red },
      { label: 'INT8', color: GQ.blue },
      { label: 'GPTQ-3', color: GQ.green },
    ]);
  }, W, H);

  const cls = budget < 72 ? 'bad' : budget >= 80 ? 'good' : '';
  const text =
    budget < 72
      ? `预算 ${budget}GB：连 3 位的 175B 都装不下。`
      : budget < 164
      ? `预算 ${budget}GB：3 位能进单卡；8 位还不行。`
      : budget < 326
      ? `预算 ${budget}GB：8 位能放下，但仍需多卡；FP16 要 326GB。`
      : `预算 ${budget}GB：连 FP16 的 175B 都能放下了。`;

  return (
    <div>
      <canvas id="cv-m1-budget" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          可用显存 <span className="val">{budget} GB</span>
        </label>
        <input type="range" min={1} max={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M1Budget;
