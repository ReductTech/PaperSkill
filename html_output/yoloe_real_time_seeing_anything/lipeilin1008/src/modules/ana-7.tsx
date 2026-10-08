import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene } from './birdKit';

// ana-7 — 30 + 2 + 1 的练习表：笔依次在三格打勾，格子变绿（2.8s 循环）。

const W = 560;
const H = 140;
const CELLS = ['30', '2', '1'];

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number) => {
      const t = (now / 1000) % 2.8;
      clearScene(ctx, W, H);

      let penX = 0;
      let penY = 0;
      let penVisible = false;
      CELLS.forEach((label, i) => {
        const x = 120 + i * 130;
        const y = 40;
        const checkAt = 0.5 + i * 0.7;
        const f = easeOutCubic(Math.max(0, Math.min(1, (t - checkAt) / 0.4)));
        const done = f >= 1;
        // 格子
        ctx.save();
        ctx.fillStyle = done ? '#eef8f1' : '#fff';
        ctx.strokeStyle = done ? PALETTE.green : PALETTE.border;
        ctx.lineWidth = done ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, 100, 64, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = done ? PALETTE.green : PALETTE.ink;
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + 50, y + 40);
        ctx.textAlign = 'left';
        // 打勾
        if (f > 0) {
          ctx.strokeStyle = PALETTE.green;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x + 66, y + 14);
          ctx.lineTo(x + 66 + 10 * f, y + 14 + 10 * f);
          if (f > 0.5) {
            const g = (f - 0.5) * 2;
            ctx.lineTo(x + 76 + 18 * g, y + 24 - 20 * g);
          }
          ctx.stroke();
        }
        ctx.restore();
        // 笔的位置：正在打勾的格子
        if (f > 0 && f < 1) {
          penX = x + 70 + 16 * f;
          penY = y + 18;
          penVisible = true;
        }
      });

      // 笔
      if (penVisible) {
        ctx.save();
        ctx.strokeStyle = PALETTE.wood;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(penX + 12, penY - 16);
        ctx.lineTo(penX, penY);
        ctx.stroke();
        ctx.restore();
      }

      // 全部完成后整表亮起
      if (t > 2.4) {
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 8);
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(108, 30, 356, 84, 12);
        ctx.stroke();
        ctx.restore();
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

export default Ana7;
