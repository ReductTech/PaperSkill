import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawHold,
  drawRope,
  drawFlag,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  EMPH,
  HOLD,
} from './climbkit';
import type { ClimberPose } from './climbkit';
import type { WidgetProps } from './registry';

// 封面右栏（本文方法）：先读线（粉笔圈点），再闭眼演练（空气中的虚线），
// 然后一次连续上移触顶。同一套流程，换墙不换方法。自动循环，无控件。

const W = 560;
const H = 140;
const CYCLE = 3200;

const READ_END = 0.3;
const REH_END = 0.6;

const HOLDS: number[][] = [
  [95, 100],
  [125, 84],
  [160, 66],
  [195, 50],
  [220, 40],
];

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number): void => {
      const t = ((now - t0) % CYCLE) / CYCLE;
      const reading = t < READ_END;
      const reh = t >= READ_END && t < REH_END;
      const done = t >= 0.9;

      clearCrag(ctx, W, H);
      drawWall(ctx, 40, 20, 230, 104);

      // 蓝色读线路线
      ctx.save();
      ctx.setLineDash([6, 6]);
      drawRope(ctx, HOLDS.map((p) => [p[0], p[1]]), GUIDE, 2.5);
      ctx.restore();

      // 粉笔圈点：读线阶段逐个出现
      const read = clamp(t / READ_END, 0, 1);
      for (let i = 0; i < HOLDS.length; i++) {
        const on = reading && read * HOLDS.length >= i + 0.5;
        drawHold(ctx, HOLDS[i][0], HOLDS[i][1], 5.5, on || !reading ? GUIDE : HOLD, on);
        if (on) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(HOLDS[i][0], HOLDS[i][1], 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 顶端目标点
      const top = HOLDS[HOLDS.length - 1];
      drawHold(ctx, top[0], top[1], 8, done ? OK : EMPH, done);
      if (done) {
        ctx.strokeStyle = OK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(top[0], top[1], 17, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawFlag(ctx, top[0], top[1] - 6, done ? OK : EMPH);

      // 空气中的虚线演练
      if (reh) {
        const rf = clamp((t - READ_END) / (REH_END - READ_END), 0, 1);
        const pts: number[][] = [[150, 108]];
        for (const p of HOLDS) {
          if (rf >= p[0] / 240) pts.push([p[0] + 8, p[1]]);
        }
        if (pts.length > 1) drawRope(ctx, pts, GUIDE, 2.5);
      }

      // 攀岩者：站定读线 → 演练 → 连续上移触顶
      let cx = 130;
      let cy = 116;
      let pose: ClimberPose = 'rest';
      let color = GUIDE;
      if (reh) {
        cx = 140;
        cy = 112;
        pose = 'reach';
        color = GUIDE;
      } else if (!reading) {
        const f = easeOutCubic(clamp((t - REH_END) / 0.3, 0, 1));
        cx = lerp(140, top[0], f);
        cy = lerp(112, top[1] + 6, f);
        pose = done ? 'topout' : 'reach';
        color = done ? OK : GUIDE;
      }
      const bob = reading ? 1.5 * Math.sin(now / 260) : 0;
      drawClimber(ctx, cx, cy + bob, 1.05, color, pose);

      drawSceneLabel(ctx, '读线演练', 40, 14, GUIDE);
      if (done) drawSceneLabel(ctx, '连续触顶', 300, 30, OK);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '读线' },
          { color: OK, text: '触顶' },
        ],
        300,
        120
      );

      if (done) {
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = OK;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, W - 4, H - 4);
      }
    };

    const tick = (now: number): void => {
      render(now);
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

export default HeroNew;
