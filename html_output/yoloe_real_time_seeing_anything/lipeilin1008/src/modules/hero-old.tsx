import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBirder, drawBird, drawBook, drawSceneLabel } from './birdKit';

// hero-old — 闭集检测器：图鉴之外的鸟叫不出名字。
// 520x280 循环动画：观鸟者翻厚图鉴，普通鸟认得（绿勾），新鸟只有红色问号。

const W = 520;
const H = 280;

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (t: number) => {
      clearScene(ctx, W, H);

      // 观鸟者与厚图鉴（页角往复翻动）
      drawBirder(ctx, 78, 224);
      drawBook(ctx, 128, 208, t, { thick: 2.2, flip: true });
      drawSceneLabel(ctx, '收录 80 种', 96, 244, PALETTE.muted);

      // 两只已收录的鸟（绿勾）
      const p1 = (t * 46) % 620;
      const p2 = (t * 38 + 260) % 620;
      drawBird(ctx, 560 - p1, 96, t, { state: 'known' });
      drawBird(ctx, 560 - p2, 150, t + 1.3, { state: 'known' });

      // 一只图鉴里没有的新鸟（彩色 + 红色问号脉动）
      const px = 560 - ((t * 42 + 480) % 620);
      const pulse = 0.6 + 0.4 * Math.sin(t * 5);
      drawBird(ctx, px, 62, t + 2.1, { state: 'plain', body: PALETTE.purple });
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = PALETTE.red;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('?', px - 4, 38);
      ctx.restore();
    };

    const tick = () => {
      render(performance.now() / 1000);
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

export default HeroOld;
