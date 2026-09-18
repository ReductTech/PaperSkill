import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, drawPhoto, drawHand, roundRect } from './sceneKit';
import type { WidgetProps } from './registry';

// §1 类比动画：一只手在鞋盒里翻找散落的照片，想找出“两个人一起去过”的那一张，
// 但每一张只有一个人。单手、单动作、3.2 s 循环。

const W = 560;
const H = 140;
const LOOP = 3200;

function drawSingle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 6, 4, 0, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, x - 6, y - 1, 12, 12, 3);
  ctx.fill();
  ctx.restore();
}

export const A1Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (t: number) => {
      clearScene(ctx, W, H, true);

      // 鞋盒（静态道具一）：浅色盒身 + 深色盒沿
      fillRound(ctx, 22, 52, 196, 62, 8, COL.light);
      ctx.strokeStyle = COL.dark;
      ctx.lineWidth = 2;
      roundRect(ctx, 22, 52, 196, 62, 8);
      ctx.stroke();
      ctx.strokeStyle = COL.dark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 76);
      ctx.lineTo(210, 76);
      ctx.stroke();

      // 桌上散落的单张（静态道具二）：每一张只有一个人
      const loose: { x: number; y: number; tilt: number }[] = [
        { x: 306, y: 24, tilt: -0.10 },
        { x: 372, y: 52, tilt: 0.07 },
        { x: 438, y: 20, tilt: -0.04 },
      ];
      loose.forEach((s) => {
        drawPhoto(ctx, s.x, s.y, 66, 50, s.tilt, COL.red, COL.white);
        drawSingle(ctx, s.x + 33, s.y + 26, COL.red);
      });

      // 运动主体：一只手 + 它正在翻起的一张照片
      const p = (t % LOOP) / LOOP;
      const arc = Math.sin(Math.PI * p);
      const hx = 44 + p * 168;
      const hy = 46 - arc * 14;
      drawPhoto(ctx, hx, hy, 66, 48, arc * 0.55 - 0.1, COL.blue, COL.white);
      drawSingle(ctx, hx + 33, hy + 25, COL.blue);
      drawHand(ctx, hx + 34, hy + 48, 0.9, -0.45 + arc * 0.3, '#e8c9a8');

      // 盒沿始终留一张空白相纸：没有合照
      drawPhoto(ctx, 96, 88, 62, 30, 0.02, COL.axis, COL.white);

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

export default A1Scene;
