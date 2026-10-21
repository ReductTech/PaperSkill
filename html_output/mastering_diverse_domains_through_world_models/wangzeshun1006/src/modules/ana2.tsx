import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawHold,
  drawChalkPuff,
  drawSceneLabel,
  HOLD,
  GUIDE,
  EMPH,
  MUTED,
} from './climbkit';
import type { WidgetProps } from './registry';

// ana2 — 一个主体（粉笔）、一个动作（沿墙圈出关键支点）、一个目标（把整面墙压成一张简图）。
// 自动循环的隐喻动画，无控件、无反馈条。

const W = 560;
const H = 140;
const DUR = 3000;

const HOLDS: number[][] = [
  [120, 96],
  [200, 44],
  [300, 104],
  [410, 54],
];
const DRAW_END = 0.75;

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const t0 = performance.now();

    const render = (elapsed: number): void => {
      const t = (elapsed % DUR) / DUR;
      // 先描线，再短暂停住，最后擦掉重描
      const alpha = t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.1) : 1;
      const prog = clamp(t / DRAW_END, 0, 1) * (HOLDS.length - 1);

      clearCrag(ctx, W, H);
      drawWall(ctx, 50, 16, 460, 108, { veins: 3 });

      for (const h of HOLDS) drawHold(ctx, h[0], h[1], 7, HOLD);

      ctx.save();
      ctx.globalAlpha = alpha;

      // 已圈出的支点
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      for (let i = 0; i < HOLDS.length; i++) {
        if (i <= Math.floor(prog) + 1e-6) {
          ctx.beginPath();
          ctx.arc(HOLDS[i][0], HOLDS[i][1], 12, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 已连成的虚线简图
      if (prog > 0) {
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = GUIDE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(HOLDS[0][0], HOLDS[0][1]);
        const last = Math.min(Math.floor(prog) + 1, HOLDS.length - 1);
        for (let i = 1; i <= last; i++) ctx.lineTo(HOLDS[i][0], HOLDS[i][1]);
        const frac = prog - Math.floor(prog);
        if (last < HOLDS.length && frac > 0) {
          const a = HOLDS[last];
          const b = HOLDS[last + 1];
          ctx.lineTo(lerp(a[0], b[0], frac), lerp(a[1], b[1], frac));
        }
        ctx.stroke();
        ctx.restore();
      }

      // 粉笔头
      const fi = Math.min(Math.floor(prog), HOLDS.length - 2);
      const frac = clamp(prog - fi, 0, 1);
      const cx = lerp(HOLDS[fi][0], HOLDS[fi + 1][0], frac);
      const cy = lerp(HOLDS[fi][1], HOLDS[fi + 1][1], frac);
      drawChalkPuff(ctx, cx, cy, 0.5 * alpha);
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      drawSceneLabel(ctx, '关键支点', 24, 28, MUTED);
      drawSceneLabel(ctx, '压成简图', 24, 52, t < DRAW_END ? EMPH : GUIDE);
    };

    const tick = (): void => {
      render(performance.now() - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
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

export default Ana2;
