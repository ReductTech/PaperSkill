import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPole, drawBalance, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;

export const M5Alpha: React.FC<WidgetProps> = () => {
  const [alpha, setAlpha] = useState(0.5);
  const tilt = (alpha - 0.5) * 0.6;
  const err = 0.15 + 2.2 * Math.pow(alpha - 0.5, 2);

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawPole(ctx, 60, 90, 380, tilt, { leftRocks: 4, rightRocks: 4, leftOutlier: alpha < 0.4 });
    drawBalance(ctx, 250, 210, 220, tilt, Math.abs(alpha - 0.5) < 0.1);
    drawSceneLabel(ctx, 60, 78, `α = ${alpha.toFixed(2)}`, SQ.ink, 14);
    // error curve
    const x0 = 600;
    const x1 = 1030;
    const y0 = 220;
    const y1 = 60;
    ctx.fillStyle = 'rgba(34,141,92,0.12)';
    ctx.fillRect(x0 + 0.4 * (x1 - x0), y1, 0.2 * (x1 - x0), y0 - y1);
    ctx.strokeStyle = SQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.strokeStyle = SQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const a = i / 100;
      const e = 0.15 + 2.2 * Math.pow(a - 0.5, 2);
      const xx = x0 + a * (x1 - x0);
      const yy = y0 - (Math.min(0.8, e) / 0.8) * (y0 - y1);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    const px = x0 + alpha * (x1 - x0);
    const py = y0 - (Math.min(0.8, err) / 0.8) * (y0 - y1);
    ctx.fillStyle = Math.abs(alpha - 0.5) < 0.1 ? SQ.green : SQ.red;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, x0, y0 + 22, 'α →', SQ.muted, 12);
    drawLegend(ctx, x0, 250, [
      { label: '误差', color: SQ.orange },
      { label: '甜区', color: SQ.green },
    ]);
  }, W, H);

  const cls = alpha < 0.4 || alpha > 0.6 ? 'bad' : 'good';
  const text =
    alpha < 0.4
      ? '前筐还是太重——激活仍难量化。'
      : alpha > 0.6
      ? '后筐太重——权重开始难量化。'
      : '甜区：两边都好量化，OPT-175B 在 LAMBADA 上最稳。';

  return (
    <div>
      <canvas id="cv-m5-alpha" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          迁移强度 α <span className="val">{alpha.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(alpha * 100)} onChange={(e) => setAlpha(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M5Alpha;
