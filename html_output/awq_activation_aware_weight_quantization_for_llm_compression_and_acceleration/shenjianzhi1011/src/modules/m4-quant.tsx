import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawTape, drawSceneLabel, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;
const W16 = [-0.92, -0.74, -0.61, -0.45, -0.33, -0.2, -0.08, 0.03, 0.14, 0.27, 0.4, 0.55, 0.69, 0.81, 0.9, 0.98];
const MAXW = 0.98;

export const M4Quant: React.FC<WidgetProps> = () => {
  const [bits, setBits] = useState(4);
  const levels = Math.pow(2, bits);
  const delta = MAXW / Math.pow(2, bits - 1);
  const maxErr = 0.5 * delta;

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawTape(ctx, 50, 50, 240, 150, { levels: Math.min(32, levels), fill: 1, color: AQ.blue });
    drawSceneLabel(ctx, 50, 40, `档位 ${levels}`, AQ.blue, 13);
    // number line with quantization grid
    const x0 = 380;
    const x1 = 1030;
    const y = 150;
    const px = (v: number) => x0 + ((v + 1) / 2) * (x1 - x0);
    ctx.strokeStyle = AQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    const step = (2 / (levels - 1)) * 0.5;
    for (let i = 0; i < levels; i++) {
      const v = -1 + i * (2 / (levels - 1));
      const gx = px(v);
      ctx.strokeStyle = AQ.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, y - 14);
      ctx.lineTo(gx, y + 14);
      ctx.stroke();
    }
    void step;
    W16.forEach((v) => {
      const gx = px(v);
      const q = Math.round(v / delta) * delta;
      const qx = px(q);
      ctx.strokeStyle = AQ.red;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(gx, y - 40);
      ctx.lineTo(qx, y - 40);
      ctx.stroke();
      ctx.fillStyle = AQ.blue;
      ctx.beginPath();
      ctx.arc(gx, y - 40, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = AQ.deskDark;
      ctx.beginPath();
      ctx.arc(qx, y - 40, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    drawSceneLabel(ctx, x0, y - 58, `Δ=${delta.toFixed(3)}  最大误差 ${maxErr.toFixed(3)}`, AQ.ink, 13);
    drawLegend(ctx, x0, 250, [
      { label: '原始', color: AQ.blue },
      { label: '量化', color: AQ.deskDark },
      { label: '误差', color: AQ.red },
    ]);
  }, W, H);

  const cls = bits <= 3 ? 'bad' : '';
  const text =
    bits >= 6
      ? '格距很小，量化误差可忽略，但每个权重占位更多。'
      : bits >= 4
      ? '4–5 位是端侧常用档位；还要看分组大小（论文用 group size 128）。'
      : '3 位以下格距很大，裸量化会明显掉点——这正是 AWQ 要解决的问题。';

  return (
    <div>
      <canvas id="cv-m4-quant" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          位宽 N <span className="val">{bits}</span>
        </label>
        <input type="range" min={2} max={8} value={bits} onChange={(e) => setBits(Number(e.target.value))} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M4Quant;
