import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPitch,
  drawPlayer,
  drawCard,
  drawRing,
  useCanvas,
  clamp,
  lerp,
} from '../lib/pitchKit';

const W = 560;
const H = 140;
const PERIOD = 3000;

// Three spots on the pitch: watching (neck), circling (query init), walking up (head).
const STATIONS = [96, 280, 464];

// [start, end, fromStation, toStation] — the card is raised in front of each spot in turn.
const PATH: Array<[number, number, number, number]> = [
  [0, 0.24, 0, 0],
  [0.24, 0.4, 0, 1],
  [0.4, 0.58, 1, 1],
  [0.58, 0.74, 1, 2],
  [0.74, 0.9, 2, 2],
  [0.9, 1, 2, 0],
];

function smooth(t: number): number {
  const v = clamp(t, 0, 1);
  return v * v * (3 - 2 * v);
}

// The one moving subject: a hand holding the requirements card.
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x + 24, y + 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const Ch2Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({});

  const { ref } = useCanvas(
    (ctx, time) => {
      clearScene(ctx, W, H);
      const t = (time % PERIOD) / PERIOD;
      let from = 0;
      let to = 0;
      let p = 0;
      for (const [a, b, f, g] of PATH) {
        if (t >= a && t < b) {
          from = f;
          to = g;
          p = smooth((t - a) / (b - a));
          break;
        }
      }
      const cx = lerp(STATIONS[from], STATIONS[to], p);
      const active = p < 0.5 ? from : to;
      const pulse = 0.55 + 0.45 * Math.sin(time / 260);

      drawPitch(ctx, 40, 62, 480, 44, { rows: 1, cols: 8 });
      STATIONS.forEach((sx, i) => drawPlayer(ctx, sx, 96, 1, { kind: 'stand', dim: i !== active }));

      ctx.save();
      ctx.globalAlpha = 0.18 * pulse;
      ctx.fillStyle = COLORS.ring;
      ctx.beginPath();
      ctx.arc(STATIONS[active], 92, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawRing(ctx, STATIONS[active], 96, 18, { color: COLORS.ring, weight: 3 });

      drawCard(ctx, cx - 28, 20, 56, 40, { lines: 2 });
      drawHand(ctx, cx + 22, 58);
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch2Ana;
