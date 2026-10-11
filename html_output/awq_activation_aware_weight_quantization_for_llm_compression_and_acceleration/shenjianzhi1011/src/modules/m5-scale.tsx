import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawFader, drawMeter, drawSceneLabel, drawLegend, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;

export const M5Scale: React.FC<WidgetProps> = () => {
  const [s, setS] = useState(1);
  const areaRef = useRef<HTMLDivElement>(null);
  const ratio = (1 / s) * (1 + 0.05 * Math.max(0, s - 1));
  const ratioNS = 1 + 0.06 * Math.max(0, s - 2.2);
  const clip = s > 2.2;

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // left: salient fader up, output meter steady
    drawFader(ctx, 140, 40, 160, 0.35 + (s - 1) * 0.16, { salient: true, clipped: clip });
    drawMeter(ctx, 240, 70, 200, 18, clip ? 1 : 0.78, { clip });
    drawMeter(ctx, 240, 110, 200, 18, clip ? 0.95 : 0.7, { clip: false });
    drawSceneLabel(ctx, 240, 60, '输出电平', AQ.ink, 13);
    // right: error ratio curves
    const x0 = 560;
    const x1 = 1030;
    const y0 = 220;
    const y1 = 60;
    const sx = (v: number) => x0 + ((v - 1) / 3) * (x1 - x0);
    const sy = (v: number) => y0 - (Math.min(1.2, v) / 1.2) * (y0 - y1);
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
    ctx.strokeStyle = AQ.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let v = 1; v <= 4.001; v += 0.05) {
      const r = (1 / v) * (1 + 0.05 * Math.max(0, v - 1));
      const xx = sx(v);
      const yy = sy(r);
      if (v === 1) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.strokeStyle = AQ.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let v = 1; v <= 4.001; v += 0.05) {
      const r = 1 + 0.06 * Math.max(0, v - 2.2);
      const xx = sx(v);
      const yy = sy(r);
      if (v === 1) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    // current point
    ctx.fillStyle = clip ? AQ.red : AQ.blue;
    ctx.beginPath();
    ctx.arc(sx(s), sy(ratio), 6, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, x0, y0 + 26, 's →', AQ.muted, 12);
    drawLegend(ctx, x0, 250, [
      { label: '显著', color: AQ.green },
      { label: '非显著', color: AQ.red },
    ]);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    setS(Math.round((1 + rel * 3) * 10) / 10);
  };

  const cls = s > 2.2 ? 'bad' : s >= 1.2 ? 'good' : '';
  const text =
    s <= 1.05
      ? '不缩放；显著通道的相对误差最大。'
      : s <= 2.2
      ? `显著通道相对误差降到约 ${ratio.toFixed(2)}，输出仍等价；论文里 s=2 时 PPL 最好。`
      : `推得太高：非显著通道误差比升到 ${ratioNS.toFixed(2)}，出现削波（s=4 时 21.2% 的通道 Δ 变大）。`;

  return (
    <div>
      <div
        ref={areaRef}
        style={{ cursor: 'ew-resize' }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromClientX(e.clientX);
        }}
      >
        <canvas id="cv-m5-scale" ref={ref} width={W} height={H} />
      </div>
      <div className="ctrl">
        <label>
          缩放 s <span className="val">{s.toFixed(1)}</span>
        </label>
        <input type="range" min={10} max={40} value={Math.round(s * 10)} onChange={(e) => setS(Number(e.target.value) / 10)} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M5Scale;
