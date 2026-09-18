import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, drawPhoto, drawHand, drawPage, drawTag, fillRound, roundRect } from './sceneKit';
import type { WidgetProps } from './registry';

// §9 类比动画：一只手按住橙色批量窗口沿时间卡纸滑到中段，罩住时间上挤在一起的
// 那几张照片，它们被同一次动作归到右侧同一页上。单手、单动作、3.4 s 循环。

const W = 560;
const H = 140;
const LOOP = 3400;
const WIN_W = 108;

export const A9Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const raw = Math.min(1, p / 0.5);
      const move = raw * raw * (3 - 2 * raw);
      const winX = 44 + move * 156;
      const settled = p >= 0.5;
      const lift = p > 0.85 ? Math.min(1, (p - 0.85) / 0.15) : 0;

      // 静态道具一：桌面上的时间卡纸
      fillRound(ctx, 28, 92, 384, 26, 9, COL.white);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 2;
      roundRect(ctx, 28, 92, 384, 26, 9);
      ctx.stroke();
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 12; i += 1) {
        const tx = 40 + i * 30;
        ctx.beginPath();
        ctx.moveTo(tx, 92);
        ctx.lineTo(tx, 100);
        ctx.stroke();
      }

      // 事件照片：两张散落在两端
      drawPhoto(ctx, 52, 62, 38, 34, -0.03, COL.axis, COL.white);
      drawPhoto(ctx, 344, 62, 38, 34, 0.03, COL.axis, COL.white);

      // 橙色窗口的罩色（画在照片之下，表示“罩住”）
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = COL.orange;
      ctx.fillRect(winX, 56, WIN_W, 54);
      ctx.restore();

      // 时间上挤在一起的三张照片
      const cluster = [206, 238, 270];
      cluster.forEach((cx: number, i: number) => {
        drawPhoto(ctx, cx, 62, 38, 34, i === 1 ? 0.03 : -0.02, settled ? COL.blue : COL.axis, COL.white);
      });

      // 窗口描边与把手（画在照片之上）
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      roundRect(ctx, winX, 56, WIN_W, 54, 8);
      ctx.stroke();
      drawTag(ctx, winX + 44, 44, 20, 13, COL.orange, true);

      // 运动主体：一只手按住窗口滑块
      drawHand(ctx, winX + 54, 48 - lift * 12, 1.0, Math.PI);

      // 静态道具二：右侧相册页；窗口停住后，窗内照片被归到同一页
      drawPage(ctx, 428, 30, 112, 86, COL.route, 3);
      if (settled) {
        for (let i = 0; i < 3; i += 1) {
          drawTag(ctx, 440 + (i % 2) * 46, 48 + Math.floor(i / 2) * 28, 40, 24, COL.green, true);
        }
      }

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

export default A9Scene;
