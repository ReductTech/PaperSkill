import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBook, drawFlag } from './birdKit';

// ana-10 — 标满图鉴比赛：旧图鉴标得慢且漏，新图鉴又快又全先亮完成旗（3.2s 循环）。

const W = 560;
const H = 140;

export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const marks = (x: number, count: number, total: number, color: string) => {
      for (let i = 0; i < total; i++) {
        ctx.save();
        if (i < count) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          const mx = x + i * 26;
          ctx.beginPath();
          ctx.moveTo(mx, 96);
          ctx.lineTo(mx + 6, 102);
          ctx.lineTo(mx + 16, 90);
          ctx.stroke();
        } else {
          ctx.strokeStyle = PALETTE.border;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + i * 26, 92, 14, 12);
        }
        ctx.restore();
      }
    };

    const render = (now: number) => {
      const t = (now / 1000) % 3.2;
      clearScene(ctx, W, H);

      // 左面板：旧图鉴（慢，5 格只标 2 格）
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = PALETTE.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 24, 210, 100, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawBook(ctx, 90, 76, t, { thick: 1.6, flip: true });
      const oldCount = Math.min(2, Math.floor(t / 1.2) + 1);
      marks(120, t > 0.5 ? oldCount : 0, 5, PALETTE.muted);

      // 右面板：新图鉴（快，5 格迅速标满）
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = PALETTE.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(310, 24, 210, 100, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawBook(ctx, 360, 76, t, { thick: 1.6 });
      const newCount = Math.min(5, Math.floor(t / 0.5) + 1);
      marks(390, t > 0.25 ? newCount : 0, 5, PALETTE.green);
      // 完成旗
      if (newCount >= 5) {
        const wave = Math.sin(t * 6) * 2;
        drawFlag(ctx, 500, 60 + wave, PALETTE.green);
      }
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana10;
