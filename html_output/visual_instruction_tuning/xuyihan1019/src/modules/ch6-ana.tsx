import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLandmark,
  drawLegend,
  drawTrail,
  drawWalker,
  useCanvas,
} from '../lib/trailKit';

// §6 analogy (560×140) — the white cane taps forward and the companion's foot lands one
// step further. One moving subject (the walking companion), one goal (the sign at the end),
// 3.2 s automatic loop, no controls.
const W = 560;
const H = 140;
const LOOP = 3200;
const STEPS = 4;
const XS = [64, 152, 240, 328, 416];
const BASE_Y = 90;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export const Ch6Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      clearScene(ctx, W, H, '杖点一步');
      drawTrail(ctx, [[36, 112], [496, 112]], { dashed: true });

      const p = ((time % LOOP) / LOOP) * STEPS;
      const step = Math.min(STEPS - 1, Math.floor(p));
      const local = p - step;
      const travel = easeInOut(Math.min(1, Math.max(0, (local - 0.3) / 0.55)));
      const x = XS[step] + (XS[step + 1] - XS[step]) * travel;

      // footprints of the steps already taken
      for (let i = 0; i <= step; i += 1) {
        ctx.beginPath();
        ctx.ellipse(XS[i] + 12, 114, 5, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.route;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (travel > 0.95) {
        ctx.beginPath();
        ctx.ellipse(XS[step + 1] + 12, 114, 5, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.route;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // the cane taps first, then the foot follows
      if (local < 0.45) {
        const fade = 1 - local / 0.45;
        ctx.save();
        ctx.globalAlpha = 0.35 + fade * 0.6;
        ctx.beginPath();
        ctx.arc(x + 20, 122, 5 + (1 - fade) * 9, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.fader;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x + 20, 122, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.fader;
        ctx.fill();
      }

      drawWalker(ctx, x, BASE_Y, { walking: travel > 0.02 && travel < 0.98 });

      // goal: the sign at the end of the stretch
      drawLandmark(ctx, 500, 112, 'sign');
      ctx.beginPath();
      ctx.arc(500, 82, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.good;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(500, 87);
      ctx.lineTo(500, 92);
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 3;
      ctx.stroke();

      drawLegend(ctx, 320, 26, [
        { color: COLORS.route, text: '落脚点' },
        { color: COLORS.fader, text: '杖尖' },
        { color: COLORS.good, text: '目标' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch6Ana;
