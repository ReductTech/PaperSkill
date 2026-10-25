import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawHold,
  drawRope,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  BAD,
  EMPH,
  HOLD,
  MUTED,
} from './climbkit';
import type { ClimberPose } from './climbkit';
import type { WidgetProps } from './registry';

// 封面左栏（旧方法）：只认得一面墙的攀岩者。换到新墙后盲目上移、打滑、退回起点，
// 每次换墙都要从头摸索；调参旋钮散落在墙脚旁。自动循环，无控件。

const W = 560;
const H = 140;
const CYCLE = 3200;

const HOLD1 = 125;
const HOLD2 = 165;
const HOLD3 = 200;

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
    const t0 = performance.now();

    const render = (now: number): void => {
      const t = ((now - t0) % CYCLE) / CYCLE;
      const slipping = t >= 0.28 && t < 0.5;
      clearCrag(ctx, W, H);
      drawWall(ctx, 40, 20, 230, 104);

      // 新墙上的岩点：大多是陌生的
      drawHold(ctx, 95, 100, 6, HOLD, false);
      drawHold(ctx, HOLD1, 84, 6, HOLD, false);
      drawHold(ctx, HOLD2, 66, 6, HOLD, false);
      drawHold(ctx, HOLD3, 50, 6, MUTED, false);

      // 盲目上移的虚线尝试
      ctx.save();
      ctx.setLineDash([5, 6]);
      drawRope(
        ctx,
        [
          [120, 116],
          [150, 92],
          [180, 68],
          [HOLD3, 50],
        ],
        slipping ? BAD : MUTED,
        2.5
      );
      ctx.restore();

      // 攀岩者：上移 → 打滑 → 退回起点
      let cx = 120;
      let cy = 116;
      let pose: ClimberPose = 'rest';
      let color = MUTED;
      if (t < 0.28) {
        const f = easeOutCubic(clamp(t / 0.28, 0, 1));
        cx = lerp(120, 190, f);
        cy = lerp(116, 64, f);
        pose = 'reach';
        color = GUIDE;
      } else if (slipping) {
        const f = clamp((t - 0.28) / 0.22, 0, 1);
        cx = lerp(190, 120, f);
        cy = lerp(64, 116, easeOutCubic(f));
        pose = 'hang';
        color = BAD;
      }
      drawClimber(ctx, cx, cy, 1.05, color, pose);

      if (slipping) {
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(182, 54);
        ctx.lineTo(198, 74);
        ctx.moveTo(198, 54);
        ctx.lineTo(182, 74);
        ctx.stroke();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = BAD;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, W - 4, H - 4);
      }

      // 墙脚散落的调参旋钮
      for (let i = 0; i < 4; i++) {
        const kx = 300 + i * 62;
        const ky = 128;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(kx, ky, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = slipping ? BAD : EMPH;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(kx, ky);
        ctx.lineTo(kx + 7 * Math.cos(i * 1.3), ky + 7 * Math.sin(i * 1.3));
        ctx.stroke();
        ctx.fillStyle = BAD;
        ctx.beginPath();
        ctx.arc(kx + 9, ky - 9, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      drawSceneLabel(ctx, '换一面新墙', 40, 14, MUTED);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '盲目上移' },
          { color: BAD, text: '打滑退回' },
        ],
        300,
        34
      );
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

export default HeroOld;
