import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawGuide,
  drawWalker,
  drawLabel,
  lerp,
  useCanvas,
} from '../lib/trailKit';

// Hero, old method: the guide can only talk; no translator booklet. The companion's
// cane keeps drifting toward a red bush mark while the guide points and speaks.
// One moving subject: the drifting cane (carried by the companion's slow sway).
const W = 520;
const H = 140;
const LOOP = 2400;
const TAU = Math.PI * 2;

export const HeroOld: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const { ref } = useCanvas<Record<string, never>>((ctx, time) => {
    clearScene(ctx, W, H);
    const p = (time % LOOP) / LOOP;
    const drift = 0.5 - 0.5 * Math.cos(TAU * p); // smooth 0 → 1 → 0

    // Red bush mark sitting just off the trail edge.
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = COLORS.bad;
    ctx.beginPath();
    ctx.arc(396, 108, 10, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(387, 115, 7, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(405, 115, 6, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = COLORS.bad;
    ctx.beginPath();
    ctx.arc(396, 107, 2.5, 0, TAU);
    ctx.fill();

    // The guide can see, but all he can do is point and talk.
    drawGuide(ctx, 148, 116, { eye: true, talking: true, scale: 1.6 });

    // The companion drifts with the cane, until the cane is over the bush.
    drawWalker(ctx, lerp(324, 346, drift), lerp(116, 119, drift), { scale: 1.6 });

    drawLabel(ctx, '只能靠嘴', 16, 40, { color: COLORS.bad, size: 15, bold: true });
  }, W, H, stateRef);
  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroOld;
