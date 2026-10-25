import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBook, drawCard, drawScope } from './birdKit';

// ana-8 — 一个背包装齐：望远镜、卡片、图鉴依次飞入背包，拉链合上亮起（3.0s 循环）。

const W = 560;
const H = 140;
const BX = 280; // 背包中心
const BY = 88;

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const drawBackpack = (bulge: number, glow: boolean) => {
      ctx.save();
      ctx.fillStyle = PALETTE.wood;
      ctx.strokeStyle = glow ? PALETTE.green : PALETTE.ink;
      ctx.lineWidth = glow ? 3 : 2;
      const w = 84 + bulge * 16;
      const h = 64 + bulge * 8;
      ctx.beginPath();
      ctx.roundRect(BX - w / 2, BY - h / 2, w, h, 14);
      ctx.fill();
      ctx.stroke();
      // 拉链
      ctx.strokeStyle = glow ? PALETTE.green : '#d8b28a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(BX - w / 2 + 8, BY - h / 2 + 14);
      ctx.lineTo(BX + w / 2 - 8, BY - h / 2 + 14);
      ctx.stroke();
      ctx.restore();
    };

    const render = (now: number) => {
      const t = (now / 1000) % 3.0;
      clearScene(ctx, W, H);

      const f1 = easeInOutQuad(Math.max(0, Math.min(1, (t - 0.2) / 0.6)));
      const f2 = easeInOutQuad(Math.max(0, Math.min(1, (t - 0.9) / 0.6)));
      const f3 = easeInOutQuad(Math.max(0, Math.min(1, (t - 1.6) / 0.6)));
      const packed = f3 >= 1;

      // 三件装备从左侧飞入背包
      if (f1 < 1) drawScope(ctx, 60 + (BX - 60) * f1, 40 + (BY - 40) * f1, 0.4 * (1 - f1));
      if (f2 < 1) drawCard(ctx, 60 + (BX - 60) * f2, 80 + (BY - 80) * f2, { lines: 2, w: 26, h: 20 });
      if (f3 < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - f3 * 0.6;
        drawBook(ctx, 60 + (BX - 60) * f3, 116 + (BY - 116) * f3, t, { thick: 1 });
        ctx.restore();
      }

      drawBackpack((f1 + f2 + f3) / 3, packed && t > 2.3);
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

export default Ana8;
