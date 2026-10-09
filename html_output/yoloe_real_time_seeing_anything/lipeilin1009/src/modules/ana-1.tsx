import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBirder, drawBird, drawBook } from './birdKit';

// ana-1 — 图鉴里没有的那只鸟：翻遍图鉴也找不到飞来的新鸟（2.8s 循环）。

const W = 560;
const H = 140;

export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // 观鸟者翻厚图鉴
      drawBirder(ctx, 90, 108);
      drawBook(ctx, 140, 96, t, { thick: 2.2, flip: true });
      // 右侧枝头落下一只彩色新鸟，红色问号脉动
      const bob = Math.sin(t * 4) * 2;
      drawBird(ctx, 430, 62 + bob, t, { body: PALETTE.purple });
      const pulse = 0.55 + 0.45 * Math.sin(t * 6);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = PALETTE.red;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('?', 426, 40 + bob);
      ctx.restore();
      // 图鉴与新鸟之间的虚线（找不到对应页）
      ctx.save();
      ctx.strokeStyle = PALETTE.muted;
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(168, 84);
      ctx.quadraticCurveTo(300, 60, 408, 62 + bob);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(292, 62);
      ctx.lineTo(304, 74);
      ctx.moveTo(304, 62);
      ctx.lineTo(292, 74);
      ctx.stroke();
      ctx.restore();
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

export default Ana1;
