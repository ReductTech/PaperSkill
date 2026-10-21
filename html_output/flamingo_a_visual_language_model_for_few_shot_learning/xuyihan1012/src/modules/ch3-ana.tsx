import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawFader, drawLevelMeter, useCanvas, clamp, COLORS } from '../lib/consoleKit';

// §3 analogy card (560×140) — automatic looping life metaphor on the DJ console.
// ONE subject (a hand on the crossfader knob), ONE verb (push the fader), ONE visible
// goal (the blend grows away from zero). TWO static props: the two level meters.
// The fader rail is the track the verb acts on. Ambient loop only: no learner state.

const W = 560;
const H = 140;
const LOOP = 3400; // 2.4–3.6 s continuous loop

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const Ch3Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});
  const reduceRef = useRef(prefersReducedMotion());

  const { ref } = useCanvas(
    (ctx, time) => {
      clearScene(ctx, W, H);

      // p: 0 = fader resting at the centre (blend 0), 1 = pushed to one side.
      // Reduced motion jumps straight to the pushed end state instead of looping.
      const raw = (time % LOOP) / LOOP;
      const p = reduceRef.current
        ? 1
        : easeInOut(clamp(raw < 0.5 ? raw / 0.5 : (1 - raw) / 0.5, 0, 1));

      // two static props: the level meters of the original output and of the new channel
      const original = 1 - 0.35 * p;
      const fresh = 0.15 + 0.85 * p;
      drawLevelMeter(ctx, 60, 20, 240, 16, original, { direction: 'up', label: '原输出' });
      drawLevelMeter(ctx, 60, 62, 240, 16, fresh, {
        direction: 'up',
        label: '新通道',
        muted: p < 0.2,
      });

      // the only moving subject: the crossfader knob with a hand on it
      const t = 0.5 + 0.38 * p;
      drawFader(ctx, 330, 116, 180, t);
      const kx = 330 + 180 * t;
      const ky = 116;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(kx + 6, ky - 8);
      ctx.lineTo(kx + 14, ky - 26);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(kx + 15, ky - 31, 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.ink;
      ctx.fill();
      ctx.restore();
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch3Ana;
