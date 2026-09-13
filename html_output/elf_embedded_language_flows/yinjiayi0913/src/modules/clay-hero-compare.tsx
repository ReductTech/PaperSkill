import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, hand, ring, seal, trace, label, GUIDE, OK, BAD, MUTED, WHEEL, LINE } from './clayKit';

// 封面双panel对比：旧法每步都在离散空间取整并需要独立解码器；
// ELF 让轨迹保持连续，只在终点落款一次。两侧同尺寸、同时间基准。
const W = 480;
const H = 190;
const GY = 132;

function oldScene(ctx: CanvasRenderingContext2D, t: number) {
  field(ctx, W, H);
  const x = 90 + 150 * t;
  const cut = Math.floor(t * 5);
  clay(ctx, x, GY, 26 + cut * 2, 0.55, t * 6, '#d8dfcc');
  for (let i = 0; i <= cut; i++) {
    ctx.save();
    ctx.strokeStyle = BAD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 30 + i * 15, GY - 30);
    ctx.lineTo(x - 30 + i * 15, GY + 26);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.fillRect(W - 118, 40, 92, 52);
  ctx.strokeRect(W - 118, 40, 92, 52);
  ctx.fillStyle = BAD;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('解码器', W - 100, 70);
  ctx.restore();
  trace(ctx, [[310, 66], [W - 118, 66]], BAD, true);
  label(ctx, '每步取整', 18, 28, MUTED);
}

function newScene(ctx: CanvasRenderingContext2D, t: number) {
  field(ctx, W, H);
  const x0 = 90;
  const x1 = 330;
  const x = x0 + (x1 - x0) * t;
  ring(ctx, x1 + 30, GY, 30, GUIDE, true);
  trace(ctx, [[x0, GY - 46], [x1 + 30, GY - 46]], GUIDE, true);
  clay(ctx, x, GY, 26, 0.42 * (1 - t), t * 6, WHEEL);
  hand(ctx, x + 40, GY - 8, 0.85, 1);
  if (t > 0.86) seal(ctx, x1 + 30, GY, true);
  label(ctx, t > 0.86 ? '终点落款' : '连续轨迹', x1 + 4, 28, t > 0.86 ? OK : GUIDE);
}

export const ClayHeroCompare: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = ((now - t0) / 3200) % 1;
      if (moduleId === 'old') oldScene(ctx, t);
      else newScene(ctx, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);

  return <canvas id={`cv-hero-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default ClayHeroCompare;
