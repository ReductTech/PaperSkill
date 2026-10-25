import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPole, drawBar, drawSceneLabel, drawLegend, drawBalance, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;

export const M1Budget: React.FC<WidgetProps> = () => {
  const [budget, setBudget] = useState(200);

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const tilt = Math.max(0, (350 - budget) / 350) * 0.18;
    drawPole(ctx, 60, 90, 380, tilt, { leftRocks: 3, rightRocks: 4, leftOutlier: tilt > 0.02 });
    drawBalance(ctx, 250, 210, 220, tilt, tilt < 0.01);
    drawSceneLabel(ctx, 60, 78, '两筐行李', SQ.ink, 13);
    const x0 = 620;
    const x1 = 1030;
    const scale = (v: number) => x0 + (v / 400) * (x1 - x0);
    const bx = scale(budget);
    ctx.strokeStyle = SQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, 50);
    ctx.lineTo(bx, 210);
    ctx.stroke();
    drawBar(ctx, x0, 70, x1 - x0, 22, 350 / 400, budget >= 350 ? SQ.green : SQ.red);
    drawBar(ctx, x0, 120, x1 - x0, 22, 175 / 400, budget >= 175 ? SQ.green : SQ.red);
    drawLegend(ctx, x0, 240, [
      { label: 'FP16', color: SQ.red },
      { label: 'W8A8', color: SQ.blue },
      { label: '预算', color: SQ.orange },
    ]);
  }, W, H);

  const cls = budget < 175 ? 'bad' : 'good';
  const text =
    budget < 175
      ? `预算 ${budget}GB：连 W8A8 的 175B 都装不下。`
      : budget < 350
      ? `预算 ${budget}GB：W8A8 能放下，FP16 还差 ${350 - budget}GB。`
      : `预算 ${budget}GB：FP16 也能放下，但要多花一倍显存。`;

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
