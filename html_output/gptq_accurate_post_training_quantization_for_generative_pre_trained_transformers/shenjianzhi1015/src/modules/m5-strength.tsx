import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawTile, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;

export const M5Strength: React.FC<WidgetProps> = () => {
  const [gain, setGain] = useState(1);
  const err = Math.abs(gain - 1) * 0.8 + 0.05;

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const tilt = (1 - gain) * 22;
    for (let i = 0; i < 8; i++) {
      drawTile(ctx, 60 + i * 62, 90 + i * tilt * 0.1, 50, { filled: true, cracked: err > 0.5 && i > 5 });
    }
    // error curve
    const x0 = 620;
    const x1 = 1030;
    const y0 = 220;
    const y1 = 70;
    ctx.strokeStyle = GQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y1);
    ctx.lineTo(x0, y0);
    ctx.stroke();
    ctx.strokeStyle = GQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const g = (i / 100) * 1.5;
      const e = Math.abs(g - 1) * 0.8 + 0.05;
      const xx = x0 + (i / 100) * (x1 - x0);
      const yy = y0 - (e / 0.9) * (y0 - y1);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    const px = x0 + (gain / 1.5) * (x1 - x0);
    const py = y0 - (err / 0.9) * (y0 - y1);
    ctx.fillStyle = err < 0.2 ? GQ.green : err > 0.5 ? GQ.red : GQ.blue;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, x0, y0 + 22, '补偿比例 →', GQ.muted, 12);
    drawLegend(ctx, 620, 250, [{ label: '层误差', color: GQ.orange }]);
  }, W, H);

  const cls = gain < 0.5 ? 'bad' : gain > 1.2 ? 'bad' : 'good';
  const text =
    gain < 0.5
      ? '补得太少，误差留在路上。'
      : gain > 1.2
      ? '补过头，反而把误差反向加上去了。'
      : '按公式补足，路面最平。';

  return (
    <div>
      <canvas id="cv-m5-strength" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          补偿比例 <span className="val">{(gain * 100).toFixed(0)}%</span>
        </label>
        <input type="range" min={0} max={150} value={Math.round(gain * 100)} onChange={(e) => setGain(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M5Strength;
