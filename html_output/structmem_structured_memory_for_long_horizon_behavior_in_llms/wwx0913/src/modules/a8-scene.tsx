import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, drawPage, drawHand, fillRound } from './sceneKit';
import type { WidgetProps } from './registry';

// §8 类比动画：一只手按住装订夹，把边缘错开的一叠相册页从上往下压合，
// 松散的一叠压成一册。单手、单动作、3.0 s 循环。

const W = 560;
const H = 140;
const LOOP = 3000;

export const A8Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number) => {
      clearScene(ctx, W, H, true);
      const p = (now % LOOP) / LOOP;
      // 前 60% 压下去，之后手抬起；页边一旦对齐就保持齐整。
      const raw = Math.min(1, p / 0.6);
      const press = raw * raw * (3 - 2 * raw);
      const settle = p < 0.6 ? press : 1;
      const lift = p > 0.6 ? Math.min(1, (p - 0.6) / 0.4) : 0;

      // 静态道具一：一叠边缘错开的相册页，随压合逐渐对齐
      const pages = 5;
      for (let i = 0; i < pages; i += 1) {
        const spread = (1 - settle) * (i - (pages - 1) / 2) * 9;
        drawPage(ctx, 226 + spread, 36 + i * 3, 118, 62, COL.axis, 2);
      }

      // 绿色书脊：目标是一册装订完成的相册
      fillRound(ctx, 214, 34, 8, 76, 4, COL.green);

      // 静态道具二：装订夹，随手的按压向下合拢
      const clipY = 34 + press * 14;
      fillRound(ctx, 244, clipY, 86, 15, 7, COL.purple);

      // 运动主体：一只手从上方按住装订夹
      drawHand(ctx, 287, clipY - 28 + lift * 4, 1.0, Math.PI);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default A8Scene;
