import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawFader, drawTape, drawBar, drawSceneLabel, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;

export const M1Budget: React.FC<WidgetProps> = () => {
  const [budget, setBudget] = useState(80);

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // left: console surface full of faders + tape
    for (let i = 0; i < 12; i++) {
      drawFader(ctx, 50 + i * 30, 40, 140, Math.min(1, 350 / 600 + i * 0.01), {});
    }
    drawTape(ctx, 60, 200, 300, 58, { levels: 8, fill: Math.min(1, budget / 600) });
    drawSceneLabel(ctx, 60, 32, '端侧设备', AQ.ink, 13);
    // right: model size bars vs budget + device lines
    const x0 = 560;
    const x1 = 1040;
    const scale = (v: number) => x0 + (v / 600) * (x1 - x0);
    const bx = scale(budget);
    ctx.strokeStyle = AQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, 44);
    ctx.lineTo(bx, 220);
    ctx.stroke();
    drawBar(ctx, x0, 60, x1 - x0, 20, 350 / 600, budget >= 350 ? AQ.green : AQ.red);
    drawBar(ctx, x0, 110, x1 - x0, 20, 14 / 600, budget >= 14 ? AQ.green : AQ.red);
    drawBar(ctx, x0, 160, x1 - x0, 20, 3.5 / 600, budget >= 3.5 ? AQ.green : AQ.red);
    for (const dev of [8, 64]) {
      const dx = scale(dev);
      ctx.strokeStyle = AQ.purple;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(dx, 44);
      ctx.lineTo(dx, 220);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    drawLegend(ctx, x0, 250, [
      { label: '预算', color: AQ.orange },
      { label: '模型', color: AQ.blue },
      { label: '设备', color: AQ.purple },
    ]);
  }, W, H);

  const cls = budget < 3.5 ? 'bad' : 'good';
  const text =
    budget < 3.5
      ? `预算 ${budget}GB 连 4-bit 的 7B 都装不下。`
      : budget < 14
      ? `预算 ${budget}GB：4-bit 能放下 7B，FP16 放不下。`
      : budget < 350
      ? `预算 ${budget}GB：FP16 的 7B 放下了，但 175B 的 FP16 仍需 350GB。`
      : `预算 ${budget}GB：连 GPT-3 175B 的 FP16 都能放下。`;

  return (
    <div>
      <canvas id="cv-m1-budget" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          可用内存 <span className="val">{budget} GB</span>
        </label>
        <input type="range" min={1} max={600} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M1Budget;
