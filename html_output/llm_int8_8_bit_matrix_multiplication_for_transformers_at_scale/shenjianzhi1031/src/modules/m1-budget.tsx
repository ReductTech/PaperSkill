import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBasin, drawGarment, drawBar, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;

export const M1Budget: React.FC<WidgetProps> = () => {
  const [budget, setBudget] = useState(160);

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const fill = Math.min(1, 175 / budget);
    drawBasin(ctx, 50, 80, 320, 130, { fill });
    for (let i = 0; i < 7; i++) {
      drawGarment(ctx, 70 + (i % 4) * 72, 100 + Math.floor(i / 4) * 44, 52, 34, {});
    }
    if (budget < 175) drawGarment(ctx, 120, 60, 90, 60, { big: true });
    if (budget < 175) drawGarment(ctx, 240, 50, 70, 50, { big: true });
    drawSceneLabel(ctx, 50, 70, '衣盆', LI.ink, 13);
    const x0 = 560;
    const x1 = 1040;
    const scale = (v: number) => x0 + (v / 400) * (x1 - x0);
    const bx = scale(budget);
    ctx.strokeStyle = LI.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, 50);
    ctx.lineTo(bx, 210);
    ctx.stroke();
    drawBar(ctx, x0, 80, x1 - x0, 22, 350 / 400, budget >= 350 ? LI.green : LI.red);
    drawBar(ctx, x0, 130, x1 - x0, 22, 175 / 400, budget >= 175 ? LI.green : LI.red);
    drawLegend(ctx, x0, 240, [
      { label: 'FP16', color: LI.red },
      { label: '8 位', color: LI.blue },
      { label: '预算', color: LI.orange },
    ]);
  }, W, H);

  const cls = budget < 175 ? 'bad' : 'good';
  const text =
    budget < 175
      ? `显存 ${budget}GB：连 8 位的 175B 都装不下。`
      : budget < 350
      ? `显存 ${budget}GB：8 位能装下，FP16 还差 ${350 - budget}GB。`
      : `显存 ${budget}GB：FP16 也能装下，但要多花一倍显存。`;

  return (
    <div>
      <canvas id="cv-m1-budget" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          显存容量 <span className="val">{budget} GB</span>
        </label>
        <input type="range" min={1} max={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M1Budget;
