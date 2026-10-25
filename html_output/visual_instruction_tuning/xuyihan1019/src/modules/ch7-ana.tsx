import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawTrail,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/trailKit';

const W = 560;
const H = 140;
const LOOP = 3000;
const TAP = 1000;
const LIFT = 9;

const ROUTE: Array<[number, number]> = [
  [36, 118],
  [170, 96],
  [300, 110],
  [430, 90],
  [530, 104],
];
const TIP = { x: 380, y: 104 };
const HAND = { x: 420, y: 48 };

// A cane taps the same trail point again and again while the tread around that
// point deepens. One moving subject, one visible goal.
export const Ch7Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ tick: 0 });

  const { ref } = useCanvas<{ tick: number }>(
    (ctx, time) => {
      clearScene(ctx, W, H);
      drawTrail(ctx, ROUTE, { active: true });

      const loop = (time % LOOP) / LOOP;
      const depth = 0.15 + 0.85 * loop;
      const lift = LIFT * Math.abs(Math.sin(Math.PI * ((time % TAP) / TAP)));
      const tipY = TIP.y - lift;
      const handY = HAND.y - lift * 0.6;

      // worn tread at the fixed tapping point: wider and darker as the loop runs
      ctx.save();
      ctx.strokeStyle = COLORS.trailDark;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        const y = TIP.y + 3 + i * 3;
        const half = 18 - i * 4;
        ctx.beginPath();
        ctx.moveTo(TIP.x - half, y);
        ctx.lineTo(TIP.x + half, y);
        ctx.globalAlpha = 0.35 + depth * 0.4;
        ctx.lineWidth = 2 + 2 * depth;
        ctx.stroke();
      }
      ctx.restore();

      // forearm, hand and the cane it drives
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(HAND.x + 16, handY - 20);
      ctx.lineTo(HAND.x + 2, handY - 2);
      ctx.strokeStyle = COLORS.muted;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(HAND.x, handY);
      ctx.lineTo(TIP.x, tipY);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(HAND.x, handY, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.fader;
      ctx.fill();

      // impact ring at the moment of contact
      if (lift < 2) {
        ctx.beginPath();
        ctx.ellipse(TIP.x, TIP.y + 1, 12, 4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.fader;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      drawLabel(ctx, '同一段路', 36, 24, { color: COLORS.muted, size: 13 });
      drawLegend(ctx, 300, 130, [
        { color: COLORS.route, text: '路线' },
        { color: COLORS.trailDark, text: '踩痕' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch7Ana;
