import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBird, drawCard } from './birdKit';

// ana-3 — 哪只更像，谁就得名：卡片移向更像的那只鸟，绿勾亮起（2.6s 循环）。

const W = 560;
const H = 140;

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (now / 1000) % 2.6;
      clearScene(ctx, W, H);

      // 两只鸟：左灰右彩
      drawBird(ctx, 180, 74, t, { body: PALETTE.muted });
      drawBird(ctx, 400, 74, t + 0.9, { body: PALETTE.orange });

      // 卡片从左移到右（0.4–1.4s 移动，之后停在右侧）
      const move = easeInOutQuad(Math.max(0, Math.min(1, (t - 0.4) / 1.0)));
      const cx = 180 + (400 - 180) * move;
      drawCard(ctx, cx - 40, 96, { lines: 2, w: 30, h: 22, glow: move > 0.95 ? PALETTE.green : PALETTE.blue });

      // 到位后右边鸟亮绿勾，左边保持灰
      if (move > 0.95) {
        ctx.save();
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(388, 52);
        ctx.lineTo(396, 60);
        ctx.lineTo(410, 44);
        ctx.stroke();
        ctx.restore();
      } else {
        // 移动中：左侧灰叉淡出
        ctx.save();
        ctx.globalAlpha = 1 - move;
        ctx.strokeStyle = PALETTE.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(172, 50);
        ctx.lineTo(184, 62);
        ctx.moveTo(184, 50);
        ctx.lineTo(172, 62);
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

export default Ana3;
