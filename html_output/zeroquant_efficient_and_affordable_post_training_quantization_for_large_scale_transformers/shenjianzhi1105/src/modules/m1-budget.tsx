import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawRack, drawGarment, drawBar, drawSceneLabel, drawLegend, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;

export const M1Budget: React.FC<WidgetProps> = () => {
  const [budget, setBudget] = useState(24);

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const fill = Math.min(1, 13 / budget);
    drawRack(ctx, 50, 80, 320, 120);
    for (let i = 0; i < 6; i++) {
      drawGarment(ctx, 70 + (i % 3) * 92, 92 + Math.floor(i / 3) * 44, 54, 36, { fit: budget >= 40 ? 'good' : budget >= 20 ? 'neutral' : 'bad' });
    }
    if (budget < 13) {
      drawGarment(ctx, 120, 56, 70, 52, { fit: 'bad' });
      drawGarment(ctx, 250, 50, 60, 46, { fit: 'bad' });
    }
    drawSceneLabel(ctx, 50, 70, `仓库 ${(fill * 100).toFixed(0)}%`, ZQ.ink, 13);
    const x0 = 520;
    const x1 = 1040;
    const sx = (v: number) => x0 + (v / 80) * (x1 - x0);
    const bx = sx(budget);
    ctx.strokeStyle = ZQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, 52);
    ctx.lineTo(bx, 206);
    ctx.stroke();
    drawBar(ctx, x0, 80, x1 - x0, 20, 40 / 80, budget >= 40 ? ZQ.green : ZQ.red);
    drawBar(ctx, x0, 128, x1 - x0, 20, 20 / 80, budget >= 20 ? ZQ.green : ZQ.red);
    drawBar(ctx, x0, 176, x1 - x0, 20, 13 / 80, budget >= 13 ? ZQ.green : ZQ.red);
    drawLegend(ctx, x0, 236, [
      { label: 'FP16 40GB', color: ZQ.red },
      { label: 'INT8 20GB', color: ZQ.blue },
      { label: 'W4/8 13GB', color: ZQ.purple },
    ]);
  }, W, H);

  const cls = budget < 13 ? 'bad' : 'good';
  const text =
    budget < 13
      ? `显存 ${budget}GB：连 W4/8 的 13GB 都放不下。`
      : budget < 20
      ? `显存 ${budget}GB：W4/8 能放下，INT8 还差 ${20 - budget}GB。`
      : budget < 40
      ? `显存 ${budget}GB：INT8 能放下，FP16 还差 ${40 - budget}GB。`
      : `显存 ${budget}GB：FP16 也能放下，但多花约 3× 显存。`;

  return (
    <div>
      <canvas id="cv-m1-budget" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          显存预算 <span className="val">{budget} GB</span>
        </label>
        <input type="range" min={1} max={80} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M1Budget;
