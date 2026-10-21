import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, clamp, drawFader, drawLevelMeter, useCanvas } from '../lib/consoleKit';

// Analogy card for §7 (560x140): one hand sweeps across four channel faders and pushes them
// to different heights, while the total level meter settles at its target.
// One subject (the hand), one verb (push four faders), one goal (the total meter settles),
// two static props (the fader rail bank and the total level meter), one 2.8 s loop.

const W = 560;
const H = 140;
const LOOP = 2800;
const XS = [84, 156, 228, 300];
// Paper-reported weights 1.0 / 0.2 / 0.2 / 0.03 mapped like the module (weights / 1.5).
const TARGETS = [1.0, 0.2, 0.2, 0.03].map((w) => clamp(w / 1.5, 0.05, 1));
const TARGET_SUM = TARGETS.reduce((a, b) => a + b, 0);

function ease(x: number): number {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

export const Ch7Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});
  const { ref } = useCanvas<typeof stateRef.current>(
    (ctx, time) => {
      clearScene(ctx, W, H, '四路推子');
      const p = (time % LOOP) / LOOP;
      const RISE = 0.78;
      // The hand travels left to right while pushing; afterwards everything eases back to rest.
      const travel = ease(p < RISE ? p / RISE : 1);
      const release = p < RISE ? 1 : 1 - ease((p - RISE) / (1 - RISE));
      const handX = 52 + travel * 300;

      let reached = 0;
      XS.forEach((x, i) => {
        const passed = clamp((handX - (x - 18)) / 36, 0, 1);
        const t = TARGETS[i] * passed * release;
        reached += t;
        drawFader(ctx, x, 46, 64, t, { vertical: true });
      });

      // Static prop: the total level meter, whose bar follows the four fader heights.
      drawLevelMeter(ctx, 396, 60, 130, 22, clamp(reached / TARGET_SUM, 0, 1), {
        direction: 'up',
        label: '总电平',
      });

      // The only moving subject: the hand riding the fader bank.
      ctx.save();
      ctx.fillStyle = COLORS.deckB;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(handX, 30, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(handX, 38);
      ctx.lineTo(handX, 48);
      ctx.stroke();
      ctx.restore();
    },
    W,
    H,
    stateRef
  );
  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch7Ana;
