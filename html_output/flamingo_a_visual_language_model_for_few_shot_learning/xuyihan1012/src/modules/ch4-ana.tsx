import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  clamp,
  drawDeck,
  drawFader,
  drawSignalPath,
  useCanvas,
} from '../lib/consoleKit';

// Analogy card for §4 (560x140): one hand pushes the language-query fader up, and the
// signal of the frozen visual deck merges into the same output bus.
// One subject (hand + fader knob), one verb (push up), one goal (query signal enters the bus),
// two static props (the sealed visual platter and the output bus rail), one 3.0 s loop.

const W = 560;
const H = 140;
const LOOP = 3000;

function ease(x: number): number {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

export const Ch4Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});
  const { ref } = useCanvas<typeof stateRef.current>(
    (ctx, time) => {
      clearScene(ctx, W, H);
      const p = (time % LOOP) / LOOP;
      // The only moving subject: the hand riding the language-query fader.
      const push = ease(p < 0.66 ? p / 0.66 : 1 - (p - 0.66) / 0.34);

      // Static prop 1: the sealed visual platter. Its spin is ambient only.
      drawDeck(ctx, 78, 76, 30, { spin: time / 5000, frozen: true, label: '视觉' });

      // Static prop 2: the output bus rail, plus the query signal reaching it.
      drawSignalPath(ctx, [[330, 76], [520, 76]], { active: false });
      drawSignalPath(ctx, [[330, 76], [330 + 186 * push, 76]], { active: push > 0.02 });

      // The visual content is pulled into the same line only while the query fader is up.
      drawSignalPath(ctx, [[108, 76], [230, 76]], { active: push > 0.35 });
      drawSignalPath(ctx, [[270, 76], [330, 76]], { active: push > 0.35 });

      // The fader rail is fixed; only its knob (with the hand grip) moves.
      drawFader(ctx, 250, 26, 76, push, { vertical: true, label: '查询' });
      const knobY = 26 + 76 * (1 - push);
      ctx.save();
      ctx.fillStyle = COLORS.deckB;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(250, knobY - 15, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    W,
    H,
    stateRef
  );
  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch4Ana;
