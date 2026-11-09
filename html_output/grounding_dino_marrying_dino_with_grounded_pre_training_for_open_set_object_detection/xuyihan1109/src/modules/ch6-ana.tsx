import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  useCanvas,
  clamp,
  lerp,
} from '../lib/pitchKit';

const W = 560;
const H = 140;
const PERIOD = 3200;
const CX = 280;
const CY = 70;

function smooth(t: number): number {
  const v = clamp(t, 0, 1);
  return v * v * (3 - 2 * v);
}

// A card outline that starts crumpled (wavy edges) and flattens out as `amp` goes to 0.
function wobblyCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amp: number,
  phase: number
): void {
  const steps = 10;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i += 1) {
    pts.push([x + (w * i) / steps, y + Math.sin(i * 1.7 + phase) * amp]);
  }
  for (let i = 1; i <= steps; i += 1) {
    pts.push([x + w + Math.sin(i * 1.9 + phase) * amp, y + (h * i) / steps]);
  }
  for (let i = steps - 1; i >= 0; i -= 1) {
    pts.push([x + (w * i) / steps, y + h + Math.sin(i * 1.5 + phase) * amp]);
  }
  for (let i = steps - 1; i >= 1; i -= 1) {
    pts.push([x + Math.sin(i * 2.1 + phase) * amp, y + (h * i) / steps]);
  }
  ctx.save();
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// One hand smoothing the card flat, left to right.
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 22, y + 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const Ch6Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({});

  const { ref } = useCanvas(
    (ctx, time) => {
      clearScene(ctx, W, H);
      const t = (time % PERIOD) / PERIOD;

      const flat = smooth(clamp((t - 0.08) / 0.42, 0, 1));
      const w = lerp(68, 250, flat);
      const h = lerp(48, 92, flat);
      const x = CX - w / 2;
      const y = CY - h / 2;
      const crumple = 1 - flat;
      const show = clamp((t - 0.36) / 0.26, 0, 1);
      const split = smooth(clamp((t - 0.58) / 0.32, 0, 1));

      wobblyCard(ctx, x, y, w, h, 5.5 * crumple, time / 240);

      // The written requirements: three rows that separate into independent lines.
      const inner = w - 46;
      const tokens = 3;
      const gap = lerp(2, 15, split);
      const tw = (inner - gap * (tokens - 1)) / tokens;
      for (let r = 0; r < 3; r += 1) {
        const ry = y + h * (0.3 + r * 0.22);
        for (let k = 0; k < tokens; k += 1) {
          const tx = x + 23 + k * (tw + gap);
          ctx.save();
          ctx.globalAlpha = show * (1 - 0.15 * r);
          ctx.beginPath();
          ctx.moveTo(tx, ry);
          ctx.lineTo(tx + tw, ry);
          ctx.strokeStyle = split > 0.42 ? COLORS.ring : COLORS.line;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }
      }

      // Hand holds the crumpled ball, then smooths the card from left to right.
      const sweep = smooth(clamp((t - 0.12) / 0.7, 0, 1));
      drawHand(ctx, lerp(x + 24, x + w - 24, sweep), y + h - 6);
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch6Ana;
