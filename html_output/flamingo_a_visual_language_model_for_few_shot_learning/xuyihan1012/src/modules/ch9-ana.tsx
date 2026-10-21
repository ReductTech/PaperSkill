import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, clamp, drawCuePads, drawLabel, drawLegend, useCanvas } from '../lib/consoleKit';

// §9 analogy (560×140) — one hand carries the most similar cue pads, one by one,
// into the order rail so the closest pad ends up next to the blue query pad.
// Automatic 3.0 s loop, no controls.
const W = 560;
const H = 140;
const LOOP = 3000;
const RACK_X = 155;
const RACK_Y = 100;
const QUERY_X = 422;
const RAIL_Y = 38;

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

export const Ch9Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      clearScene(ctx, W, H);
      const t = (time % LOOP) / LOOP;

      // static prop: the order rail, with the query block fixed at its right end
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(90, RAIL_Y, 380, 26);
      ctx.restore();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.axis;
      ctx.strokeRect(90, RAIL_Y, 380, 26);
      ctx.save();
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = COLORS.route;
      ctx.fillRect(QUERY_X, RAIL_Y, 44, 26);
      ctx.restore();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.route;
      ctx.strokeRect(QUERY_X, RAIL_Y, 44, 26);

      // static prop: the rack of candidate pads below
      drawCuePads(ctx, RACK_X, RACK_Y, 8, 1, 0, { total: 8 });

      // moving subject: the hand carries each selected pad up into the rail
      let handX = RACK_X + 13;
      let handY = RACK_Y - 22;
      for (let k = 0; k < 4; k += 1) {
        const u = clamp((t - k * 0.24) / 0.2, 0, 1);
        const ease = u * u * (3 - 2 * u);
        const slotX = QUERY_X - (k + 1) * 36;
        const slotY = RAIL_Y + (26 - 20) / 2;
        if (u < 0.02) continue;
        const bx = RACK_X + k * 32 + 13 + (slotX + 13 - (RACK_X + k * 32 + 13)) * ease - 13;
        const by = RACK_Y - 20 + (slotY - (RACK_Y - 20)) * ease;
        ctx.save();
        ctx.globalAlpha = u >= 1 ? 0.4 : 0.32;
        ctx.fillStyle = COLORS.fader;
        ctx.fillRect(bx, by, 28, 20);
        ctx.restore();
        ctx.lineWidth = u >= 1 ? 3 : 2;
        ctx.strokeStyle = COLORS.fader;
        ctx.strokeRect(bx, by, 28, 20);
        if (u < 1) {
          handX = bx - 2;
          handY = by - 16;
        }
      }

      drawHand(ctx, handX, handY);

      drawLabel(ctx, '排序条', 96, 82, { color: COLORS.ink, size: 15 });
      drawLabel(ctx, '示例垫', RACK_X, 134, { color: COLORS.ink, size: 15 });
      drawLegend(ctx, 300, 134, [
        { color: COLORS.fader, text: '入选' },
        { color: COLORS.route, text: '查询' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch9Ana;
