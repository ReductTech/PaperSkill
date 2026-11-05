import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawCustomer, drawSceneLabel, drawLegend, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
const N = 32;
const RANGES = Array.from({ length: N }, (_, i) => 8 + 27 * Math.abs(Math.sin(i * 1.7)));

export const M2Token: React.FC<WidgetProps> = () => {
  const [pos, setPos] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const idx = Math.min(N - 1, Math.round(pos * (N - 1)));
  const v = RANGES[idx];
  const small = v < 12;

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const x0 = 60;
    const x1 = 900;
    const y0 = 220;
    const y1 = 50;
    const step = (x1 - x0) / N;
    RANGES.forEach((r, i) => {
      const bh = (r / 36) * (y0 - y1);
      ctx.fillStyle = i === idx ? ZQ.orange : r < 12 ? ZQ.red : ZQ.blue;
      ctx.fillRect(x0 + i * step + 1, y0 - bh, step - 3, bh);
    });
    const ly = y0 - (35 / 36) * (y0 - y1);
    ctx.strokeStyle = ZQ.red;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x0, ly);
    ctx.lineTo(x1, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    drawSceneLabel(ctx, x0, ly - 8, '静态范围 35', ZQ.red, 12);
    const cx = x0 + idx * step + step / 2;
    ctx.strokeStyle = ZQ.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, y1 - 8);
    ctx.lineTo(cx, y0);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      drawCustomer(ctx, 950, 90 + i * 42, 20, { range: RANGES[idx], highlight: i === 0 });
    }
    drawLegend(ctx, x0, 250, [
      { label: '普通', color: ZQ.blue },
      { label: '小范围', color: ZQ.red },
      { label: '当前', color: ZQ.orange },
    ]);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  };

  const text = small
    ? `这个 token 只有 ${v.toFixed(1)}，却要按 35 缩放——大部分档位被浪费，误差大。`
    : `这个 token 范围 ${v.toFixed(1)}，静态范围基本够用。`;

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
        <canvas id="cv-m2-token" ref={ref} width={W} height={H} />
      </div>
      <div className="ctrl">
        <label>
          检查位置 <span className="val">{(pos * 100).toFixed(0)}%</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(pos * 100)} onChange={(e) => setPos(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${small ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M2Token;
