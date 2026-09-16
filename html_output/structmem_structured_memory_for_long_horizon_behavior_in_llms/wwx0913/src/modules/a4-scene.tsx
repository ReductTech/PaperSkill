import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import { COL, clearScene, fillRound, drawTag, drawPhoto, drawHand, label } from './sceneKit';
import type { WidgetProps } from './registry';

// §4 类比动画：一只手把一张照片插进时间轴卡纸的正确日期刻度。
// 单手、单动作、3.0 s 循环 + 0.6 s 离屏停顿；无控件、无反馈行。

const W = 560;
const H = 140;
const LOOP = 3600;

const TICK_X0 = 80;
const TICK_STEP = 60;
const TARGET_TICK = 5;
const tickX = (i: number): number => TICK_X0 + i * TICK_STEP;

const PHOTO_W = 60;
const PHOTO_H = 42;
const START_X = 88;
const TARGET_X = tickX(TARGET_TICK) - PHOTO_W / 2;
const HOLD_Y = 34;
const SEAT_Y = 74;

export const A4Scene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p = (t % LOOP) / LOOP;
      clearScene(ctx, W, H, true);

      // 静态道具：时间轴卡纸 + 刻度
      fillRound(ctx, 50, 86, 460, 30, 8, COL.white);
      drawTag(ctx, 50, 86, 460, 30, COL.axis, false);
      ctx.save();
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i += 1) {
        ctx.beginPath();
        ctx.moveTo(tickX(i), 92);
        ctx.lineTo(tickX(i), 110);
        ctx.stroke();
      }
      ctx.restore();

      // 正确的日期刻度：橙色
      ctx.save();
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tickX(TARGET_TICK), 86);
      ctx.lineTo(tickX(TARGET_TICK), 116);
      ctx.stroke();
      ctx.restore();

      // 类比动画不画文字标签：动作本身说明一切

      // 运动主体：照片沿时间轴右移，再落到正确刻度上
      let photoX = START_X;
      let photoY = HOLD_Y;
      if (p < 0.5) {
        photoX = START_X + (TARGET_X - START_X) * easeInOutQuad(p / 0.5);
      } else {
        photoX = TARGET_X;
        if (p < 0.68) {
          photoY = HOLD_Y + (SEAT_Y - HOLD_Y) * easeInOutQuad((p - 0.5) / 0.18);
        } else {
          photoY = SEAT_Y;
        }
      }
      drawPhoto(ctx, photoX, photoY, PHOTO_W, PHOTO_H, p < 0.5 ? -0.05 : 0.01, COL.blue, COL.white);

      // 唯一运动主体：手；插好后抬离并从右侧移出画面
      let handX = photoX + 52;
      let handY = photoY + 10;
      if (p >= 0.68) {
        const u = Math.min(1, (p - 0.68) / 0.22);
        handX = photoX + 52 + 200 * u;
        handY = photoY + 10 - 50 * u;
      }
      drawHand(ctx, handX, handY, 0.85, -0.35);

      // 落位后的绿环闪一下
      if (p >= 0.9) {
        const u = (p - 0.9) / 0.1;
        ctx.save();
        ctx.globalAlpha = 0.85 - 0.55 * u;
        ctx.strokeStyle = COL.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(photoX + PHOTO_W / 2, photoY + PHOTO_H / 2, 34 + 8 * u, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
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

export default A4Scene;
