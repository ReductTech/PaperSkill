import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比卡：针在两段轻微错开的布条缝隙正中落针，缝线随之拉直；
// 停顿后布条缓动退回错开状态，首尾无缝，自动循环。

const W = 560;
const H = 140;
const CYCLE = 4.0;

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawStrip(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(x0, y1 - 5, x1 - x0, 5);
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  // 针脚画成小斜线，透明度略有变化
  const n = Math.max(2, Math.round((x1 - x0) / 24));
  for (let i = 1; i < n; i += 1) {
    const x = x0 + ((x1 - x0) * i) / n;
    ctx.globalAlpha = alpha * (0.55 + 0.4 * Math.abs(Math.sin(i * 1.7)));
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 5);
    ctx.lineTo(x + 2, y + 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, len: number) {
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - len - 24, y + 5);
  ctx.quadraticCurveTo(x - len * 0.7, y + 13, x - len + 4, y);
  ctx.stroke();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 8, y - 4);
  ctx.lineTo(x - 8, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x - len + 6, y, 2.6, 0, Math.PI * 2);
  ctx.stroke();
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const clockRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (p: number, now: number) => {
      clearScene(ctx, W, H);

      // 拉直程度：0.5–0.8 拉直，0.8–0.88 保持，0.88–1 缓动退回错开
      let s: number;
      if (p < 0.5) s = 0;
      else if (p < 0.8) s = easeInOutQuad((p - 0.5) / 0.3);
      else if (p < 0.88) s = 1;
      else s = 1 - easeInOutQuad((p - 0.88) / 0.12);
      const off = 9 * (1 - s);

      drawStrip(ctx, 26, 252, 46 - off, 118 - off);
      drawStrip(ctx, 308, 534, 46 + off, 118 + off);

      drawThread(ctx, 46, 234, 88 - off, 1);
      drawThread(ctx, 326, 514, 88 + off, 1);

      if (s > 0.02) {
        drawThread(ctx, 46, 514, 88, s);
      }

      // 针先带阻尼摆动落定，之后保留微小呼吸浮动
      const settle = clamp(p / 0.45, 0, 1);
      const damp = (1 - easeOutCubic(settle)) * clamp(p / 0.05, 0, 1);
      const breathe = Math.sin(now / 320) * 1.3;
      const needleY = 88 + 16 * Math.cos(p * Math.PI * 4.2) * damp + breathe;
      drawNeedle(ctx, 288, needleY, 40);

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('落在正中', 20, 26);
    };

    const tick = (ts: number) => {
      const dt = lastRef.current ? Math.min(0.06, (ts - lastRef.current) / 1000) : 0;
      lastRef.current = ts;
      clockRef.current = (clockRef.current + dt) % CYCLE;
      render(clockRef.current / CYCLE, ts);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default Ana4;
