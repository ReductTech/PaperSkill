import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, clamp, drawCuePads, drawLabel, drawLegend, useCanvas } from '../lib/consoleKit';

// §6 analogy (560×140) — one hand presses the cue pads one by one so the examples
// queue up in front of the blue query pad. Automatic 3.2 s loop, no controls.
const W = 560;
const H = 140;
const LOOP = 3200;
const PAD_X = 139;
const PAD_Y = 92;
const STEP = 32;

/** The operator's hand: palm plus three finger strokes. */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, 26, 15);
  ctx.fillStyle = COLORS.deckB;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 3; i += 1) {
    const fx = x + 6 + i * 7;
    ctx.moveTo(fx, y);
    ctx.lineTo(fx, y - 7);
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.restore();
}

export const Ch6Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      clearScene(ctx, W, H);
      const phase = ((time % LOOP) / LOOP) * 9;
      const index = clamp(Math.floor(phase), 0, 8);
      const local = phase - Math.floor(phase);
      const lit = clamp(Math.floor(phase) + (local > 0.4 ? 1 : 0), 0, 9);

      // static prop: the prompt groove the pads sit in
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(PAD_X - 14, PAD_Y - 10, 310, 42);
      ctx.restore();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.axis;
      ctx.strokeRect(PAD_X - 14, PAD_Y - 10, 310, 42);

      // eight example pads plus the blue query pad on the right
      drawCuePads(ctx, PAD_X, PAD_Y, 9, 1, lit, { total: 9, queryIndex: 8 });

      // the hand is the only moving subject: it walks the pads and presses down
      drawHand(ctx, PAD_X + index * STEP + 1, 66 + local * 12);

      drawLabel(ctx, '示例垫', PAD_X, 132, { color: COLORS.ink, size: 15 });
      drawLabel(ctx, '查询垫', 372, 132, { color: COLORS.route, size: 15 });
      drawLegend(ctx, 168, 34, [
        { color: COLORS.fader, text: '已按下' },
        { color: COLORS.route, text: '查询' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch6Ana;
