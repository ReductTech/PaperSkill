import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPath, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;

function curv(x: number): number {
  return 0.1 + 0.9 * Math.pow(Math.abs(Math.sin(x * Math.PI * 2.5)), 2);
}

export const M4Curv: React.FC<WidgetProps> = () => {
  const [pos, setPos] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const c = curv(pos);

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawPath(ctx, 40, 70, 8, 44, 10, (i) => ({ filled: true, highlight: Math.round(pos * 7) === i }));
    // curvature curve
    const x0 = 40;
    const x1 = 1030;
    const y0 = 240;
    const y1 = 130;
    ctx.strokeStyle = GQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.strokeStyle = GQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const xx = x0 + (i / 100) * (x1 - x0);
      const yy = y0 - curv(i / 100) * (y0 - y1);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    const px = x0 + pos * (x1 - x0);
    const py = y0 - c * (y0 - y1);
    ctx.fillStyle = c > 0.7 ? GQ.red : c < 0.35 ? GQ.green : GQ.blue;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, x0, y0 + 22, '位置 →', GQ.muted, 12);
    drawLegend(ctx, 600, 250, [
      { label: '曲率', color: GQ.orange },
      { label: '当前', color: c > 0.7 ? GQ.red : c < 0.35 ? GQ.green : GQ.blue },
    ]);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  };

  const cls = c > 0.7 ? 'bad' : c < 0.35 ? 'good' : '';
  const text =
    c < 0.35
      ? '这里地面软，放砖代价小。'
      : c > 0.7
      ? '这里很硬，放砖代价大——尽量排到后面再动。'
      : '代价中等。';

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
        <canvas id="cv-m4-curv" ref={ref} width={W} height={H} />
      </div>
      <div className="ctrl">
        <label>
          位置 <span className="val">{(pos * 100).toFixed(0)}%</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(pos * 100)} onChange={(e) => setPos(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M4Curv;
