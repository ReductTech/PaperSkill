import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPitch,
  drawPlayer,
  drawCard,
  drawRing,
  drawFrame,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/pitchKit';

const W = 560;
const H = 140;
const LOOP = 3200;

// One hand holds the requirements card up and walks toward the circled player;
// the confirmation frame shrinks until it seats on him.
function drawHoldingHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 8);
  ctx.lineTo(x + 42, y + 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 5, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 4);
  ctx.lineTo(x - 1, y - 10);
  ctx.moveTo(x + 2, y - 3);
  ctx.lineTo(x + 5, y - 9);
  ctx.stroke();
  ctx.restore();
}

export const Ch5Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const t = (time % LOOP) / LOOP;
    const k = Math.min(1, t / 0.78);
    const e = k * k * (3 - 2 * k);
    const handX = 92 + (312 - 92) * e;
    const handY = 104;

    clearScene(ctx, W, H);
    drawPitch(ctx, 14, 10, 532, 120, { rows: 3, cols: 9 });

    drawPlayer(ctx, 120, 50, 1.1, { kind: 'stand', dim: true });
    drawPlayer(ctx, 190, 110, 1.1, { kind: 'run', dim: true });
    drawPlayer(ctx, 470, 52, 1.1, { kind: 'jump', dim: true });
    drawPlayer(ctx, 510, 108, 1.1, { kind: 'stand', dim: true });

    // the one goal: the circled player the scout walks up to
    drawPlayer(ctx, 392, 80, 1.25, { kind: 'run', highlight: true });
    drawRing(ctx, 392, 78, 28, { color: COLORS.ring, weight: 3 });

    const fw = 160 + (52 - 160) * e;
    const fh = 100 + (66 - 100) * e;
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.6 * e;
    drawFrame(ctx, 392, 82, fw, fh, { color: COLORS.confirm, weight: 3, dashed: e < 0.9 });
    ctx.restore();

    drawCard(ctx, handX - 26, handY - 64, 52, 58, { lines: 3, active: 1 });
    drawHoldingHand(ctx, handX, handY);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch5Ana;
