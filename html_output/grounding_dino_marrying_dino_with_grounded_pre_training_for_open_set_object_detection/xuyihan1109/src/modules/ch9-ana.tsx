import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPitch,
  drawCard,
  useCanvas,
  clamp,
  lerp,
} from '../lib/pitchKit';

const W = 560;
const H = 140;
const PERIOD = 2800;

function smooth(t: number): number {
  const v = clamp(t, 0, 1);
  return v * v * (3 - 2 * v);
}

// One hand carrying the same card from one pitch to the next.
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x + 22, y + 46);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const Ch9Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({});

  const { ref } = useCanvas(
    (ctx, time) => {
      clearScene(ctx, W, H);
      const t = (time % PERIOD) / PERIOD;

      // out to the second pitch, short pause, back again — a seamless loop.
      let u = 0;
      if (t < 0.45) u = smooth(t / 0.45);
      else if (t < 0.55) u = 1;
      else u = 1 - smooth((t - 0.55) / 0.45);

      const cx = lerp(138, 422, u);
      const bob = Math.sin(t * Math.PI * 4) * 2;

      drawPitch(ctx, 48, 82, 180, 52, {
        rows: 1,
        cols: 4,
        spots: [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }],
      });
      drawPitch(ctx, 332, 82, 180, 52, {
        rows: 1,
        cols: 4,
        spots: [{ r: 0, c: 0 }, { r: 0, c: 2 }],
      });

      // the route between the two pitches
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(232, 70);
      ctx.lineTo(332, 70);
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.restore();

      // the card never changes: same paper, same ruled lines.
      drawCard(ctx, cx - 27, 10 + bob, 54, 38, { lines: 2 });
      drawHand(ctx, cx + 21, 46 + bob);
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch9Ana;
