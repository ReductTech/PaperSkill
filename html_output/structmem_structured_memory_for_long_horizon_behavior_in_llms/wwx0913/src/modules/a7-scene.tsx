import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import { COL, clearScene, drawPage, drawHand, drawStamp, drawTag } from './sceneKit';
import type { WidgetProps } from './registry';

// §7 类比动画（560×140）：一只手握着标注笔，从注记页第一行往下逐行核对；
// 有三行旁边盖着日期章，只有第三行找不到日期支撑，被一道橙色短横线划掉。
// 单手、单动作、2.8 s 循环。静态道具：注记页（含 3 枚日期章）。

const W = 560;
const H = 140;
const LOOP = 2800;

const LINE_Y = [38, 52, 66, 80];
const STAMPED = [0, 1, 3]; // 第 3 行（下标 2）没有日期支撑
const UNSTAMPED = 2;

export const A7Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      const p = (t % LOOP) / LOOP;

      // 注记页（静态道具）
      drawPage(ctx, 140, 20, 240, 100, COL.route, 4);

      // 每一行旁边的日期章：没有日期的那一行就是可疑句
      STAMPED.forEach((i) => {
        drawStamp(ctx, 404, LINE_Y[i] - 4, 8, COL.orange, false);
      });

      // 被划掉的那一句（橙色短横线，逐步画出）
      const strike = clamp((p - 0.62) / 0.14, 0, 1);
      if (strike > 0) {
        ctx.save();
        ctx.strokeStyle = COL.orange;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150, LINE_Y[UNSTAMPED] - 4);
        ctx.lineTo(150 + 220 * strike, LINE_Y[UNSTAMPED] - 4);
        ctx.stroke();
        ctx.restore();
      }

      // 运动主体：一只手 + 它握着的标注笔，自上而下逐行核对
      const hy = 30 + easeInOutQuad(clamp(p / 0.85, 0, 1)) * 56;
      drawHand(ctx, 116, hy, 0.8, 0.35, '#e8c9a8');
      drawTag(ctx, 132, hy - 5, 34, 9, COL.blue, true);

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

export default A7Scene;
