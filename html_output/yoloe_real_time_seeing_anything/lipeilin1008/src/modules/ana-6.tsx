import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBird, drawFlag, drawBook } from './birdKit';

// ana-6 — 先插旗，再查名：鸟落一只记一旗，图鉴只翻开插旗的页（3.2s 循环）。

const W = 560;
const H = 140;

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (now / 1000) % 3.2;
      clearScene(ctx, W, H);

      // 三只鸟依次落下（0.2/0.7/1.2s）
      const lands = [0.2, 0.7, 1.2];
      lands.forEach((land, i) => {
        const f = Math.max(0, Math.min(1, (t - land) / 0.35));
        if (f <= 0) return;
        const x = 90 + i * 70;
        const y = 40 + (1 - f) * -50 + f * 0 + (1 - Math.abs(1 - f)) * 0;
        drawBird(ctx, x, 44 + (1 - f) * -60, t + i, {
          body: [PALETTE.treeDark, PALETTE.orange, PALETTE.blue][i],
        });
        // 每落下一只，下方小本上画一面旗
        if (f >= 1) drawFlag(ctx, 90 + i * 70, 118);
        void y;
      });

      // 右侧图鉴：1.8s 后翻开，只亮三页插旗页
      const open = Math.max(0, Math.min(1, (t - 1.8) / 0.5));
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.65 * open;
      drawBook(ctx, 430, 110, t, { thick: 1.8, open: true });
      ctx.restore();
      if (open > 0.4) {
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.globalAlpha = open;
          ctx.fillStyle = PALETTE.green;
          ctx.fillRect(402 + i * 20, 76, 12, 16);
          ctx.restore();
        }
        // 其余页灰色掠过
        ctx.save();
        ctx.globalAlpha = 0.35 * open;
        ctx.fillStyle = PALETTE.muted;
        for (let i = 0; i < 4; i++) ctx.fillRect(398 + i * 18, 96, 10, 3);
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

export default Ana6;
