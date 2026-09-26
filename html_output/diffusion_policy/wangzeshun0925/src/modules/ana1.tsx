import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawModeMark,
  drawSceneLabel,
  GUIDE,
  BAD,
} from './woodKit';
import type { WidgetProps } from './registry';

// 第 1 章类比动画：两条都对的刨削方向被“平均”到正中间，板面被刨出一个凹坑。
// 自动循环，无控制、无反馈条。
const W = 560;
const H = 140;
const LOOP = 3200;

const BOARD_X = 60;
const BOARD_W = 440;
const BOARD_Y = 96;
const BOARD_H = 22;

/** 板面凸起轮廓：两个凸起分别对应两条都正确的刨削方向，中间是凹下去的一段。 */
const PROFILE: number[] = (() => {
  const out: number[] = [];
  const n = 25;
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    const l = Math.exp(-Math.pow((x - 0.34) / 0.09, 2));
    const r = Math.exp(-Math.pow((x - 0.66) / 0.09, 2));
    out.push(9 * Math.max(l, r));
  }
  return out;
})();

export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // 先向左轻偏，再折回中间，最后停在两条方向标记的正中
      let p: number;
      if (u < 0.3) p = lerp(0.3, 0.2, easeInOutQuad(u / 0.3));
      else if (u < 0.62) p = lerp(0.2, 0.5, easeInOutQuad((u - 0.3) / 0.32));
      else p = 0.5;

      const pit = u < 0.62 ? 0 : clamp((u - 0.62) / 0.16, 0, 1) * 13;
      const cx = BOARD_X + p * BOARD_W;

      clearScene(ctx, W, H);
      drawBoard(ctx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, PROFILE);

      // 两条都正确的刨削方向标记
      drawModeMark(ctx, BOARD_X + 0.34 * BOARD_W, BOARD_Y + BOARD_H - 8, 'left');
      drawModeMark(ctx, BOARD_X + 0.66 * BOARD_W, BOARD_Y + BOARD_H - 8, 'right');

      // 平均之后刀口落在两块凸起之间，刨出的凹坑
      if (pit > 0.5) {
        ctx.fillStyle = BAD;
        ctx.beginPath();
        ctx.moveTo(cx - 17, BOARD_Y);
        ctx.lineTo(cx + 17, BOARD_Y);
        ctx.lineTo(cx, BOARD_Y + pit);
        ctx.closePath();
        ctx.fill();
      }

      if (u < 0.62) drawShavings(ctx, cx - 12, BOARD_Y - 16, u * 3, 2);
      drawPlane(ctx, cx, BOARD_Y - 1, { length: 54, flip: u < 0.3 });

      drawSceneLabel(ctx, '两条都对', 24, 28, GUIDE);
      drawSceneLabel(ctx, '平均出凹坑', 24, 54, BAD);
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

export default Ana1;
