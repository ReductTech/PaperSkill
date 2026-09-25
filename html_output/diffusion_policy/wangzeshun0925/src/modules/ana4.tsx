import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawSceneLabel,
  WOOD_DARK,
  GUIDE,
  INK,
} from './woodKit';
import type { WidgetProps } from './registry';

// 第 2 章类比动画：刨子从右向左匀速滑过板面，木纹在它经过时被一条高亮轨迹短暂扫亮。
// 自动循环，无控制、无反馈条。
const W = 560;
const H = 140;
const LOOP = 3000;

const BOARD_X = 40;
const BOARD_W = 480;
const BOARD_Y = 88;
const BOARD_H = 30;
const TRAIL = 74;

const GRAIN_Y = [9, 16, 23];

/** 木纹：顺着板面的波浪线，整块板共用同一条走向。 */
function grainPath(ctx: CanvasRenderingContext2D, yOff: number, phase: number, x0: number, x1: number) {
  ctx.beginPath();
  let first = true;
  for (let x = x0; x <= x1; x += 6) {
    const y = BOARD_Y + yOff + Math.sin((x - BOARD_X) / 46 + phase) * 2.4;
    if (first) {
      ctx.moveTo(x, y);
      first = false;
    } else {
      ctx.lineTo(x, y);
    }
  }
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef<number>(0);

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
      if (t0Ref.current === 0) t0Ref.current = now;
      const u = ((now - t0Ref.current) % LOOP) / LOOP;

      // 从右向左匀速滑过，走完停在左端
      const p = u < 0.85 ? lerp(0.92, 0.08, u / 0.85) : 0.08;
      const cx = BOARD_X + p * BOARD_W;

      clearScene(ctx, W, H);
      drawBoard(ctx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, null);

      // 木纹：先画底色纹理
      ctx.lineWidth = 1;
      ctx.strokeStyle = WOOD_DARK;
      for (let g = 0; g < GRAIN_Y.length; g++) {
        grainPath(ctx, GRAIN_Y[g], g * 1.3, BOARD_X + 6, BOARD_X + BOARD_W - 6);
        ctx.stroke();
      }

      // 扫亮轨迹：只有刨子刚经过的那一小段是亮的，越远越淡
      if (cx > BOARD_X + 8) {
        const grad = ctx.createLinearGradient(cx, 0, cx + TRAIL, 0);
        grad.addColorStop(0, GUIDE);
        grad.addColorStop(1, 'rgba(39,68,110,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        for (let g = 0; g < GRAIN_Y.length; g++) {
          grainPath(ctx, GRAIN_Y[g], g * 1.3, cx, Math.min(cx + TRAIL, BOARD_X + BOARD_W - 6));
          ctx.stroke();
        }
      }

      if (u < 0.85) drawShavings(ctx, cx + 10, BOARD_Y - 16, u * 3, 2);
      drawPlane(ctx, cx, BOARD_Y - 1, { length: 54, flip: true });

      drawSceneLabel(ctx, '木纹走向', 20, 28, GUIDE);
      drawSceneLabel(ctx, '连续几帧', 20, 54, INK);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana4;
