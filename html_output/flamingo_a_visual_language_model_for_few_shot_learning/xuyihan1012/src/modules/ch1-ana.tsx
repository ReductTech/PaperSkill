import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawDeck, drawFader, useCanvas, clamp } from '../lib/consoleKit';

// §1 analogy card (560×140) — automatic looping life metaphor on the DJ console.
// ONE subject (a hand holding the red re-cutting blade), ONE verb (carve), ONE visible
// goal (the record gets carved full). TWO static props: a sealed spare platter and the
// motionless fader rail. The record being re-cut is the substrate the verb acts on.
// Ambient loop only: it carries no learner state and no controls.

const W = 560;
const H = 140;
const LOOP = 3200; // 2.4–3.6 s continuous loop

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const Ch1Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const reduceRef = useRef(prefersReducedMotion());

  const { ref } = useCanvas(
    (ctx, time) => {
      clearScene(ctx, W, H);

      // p advances the carve to the disc edge, then the blade rests there.
      const p = reduceRef.current
        ? 1
        : easeInOut(clamp((time % LOOP) / LOOP / 0.72, 0, 1));

      // static prop 1: the spare platter, sealed and untouched by the operator
      drawDeck(ctx, 496, 92, 26, { spin: 0, frozen: true, accent: COLORS.route });
      // static prop 2: the fader rail, never moved in this scene
      drawFader(ctx, 300, 124, 130, 0.5);

      // the record that has to be re-cut from scratch
      const cx = 150;
      const cy = 76;
      const r = 40;
      drawDeck(ctx, cx, cy, r, { spin: 0, frozen: false, accent: COLORS.bad });

      const groove = r * 0.86 * 0.72;
      if (p > 0) {
        // the continuous red groove carved so far
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, groove, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
        ctx.strokeStyle = COLORS.bad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }

      // the only moving subject: hand + red blade riding the carve front
      const theta = -Math.PI / 2 + Math.PI * 2 * p;
      const bx = cx + Math.cos(theta) * groove;
      const by = cy + Math.sin(theta) * groove;
      const hx = cx + Math.cos(theta) * (groove + 22);
      const hy = cy + Math.sin(theta) * (groove + 22);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.ink;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.bad;
      ctx.fill();
      ctx.restore();
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch1Ana;
