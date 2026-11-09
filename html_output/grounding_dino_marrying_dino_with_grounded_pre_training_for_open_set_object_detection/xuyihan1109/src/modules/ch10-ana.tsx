import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clamp, lerp, clearScene, useCanvas } from '../lib/pitchKit';

const W = 560;
const H = 140;
const LOOP = 3000;

// One hand presses the stopwatch; two light points race from the same line, green first.
function drawPressHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.fillStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 30, y + 22);
  ctx.lineTo(x + 7, y + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 2);
  ctx.lineTo(x - 10, y - 7);
  ctx.stroke();
  ctx.restore();
}

export const Ch10Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const t = (time % LOOP) / LOOP;
    const startX = 90;
    const endX = 500;
    const yGreen = 56;
    const yGray = 86;

    clearScene(ctx, W, H);

    // lanes and the finish line
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    [yGreen, yGray].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(startX, 40);
    ctx.lineTo(startX, 102);
    ctx.stroke();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COLORS.muted;
    ctx.beginPath();
    ctx.moveTo(endX, 40);
    ctx.lineTo(endX, 102);
    ctx.stroke();
    ctx.restore();

    // stopwatch at the start line
    ctx.save();
    ctx.beginPath();
    ctx.arc(70, 108, 10, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.card;
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(70, 98);
    ctx.lineTo(70, 94);
    ctx.moveTo(66, 94);
    ctx.lineTo(74, 94);
    ctx.stroke();
    // a short needle so the disc reads as a stopwatch
    ctx.beginPath();
    ctx.moveTo(70, 108);
    ctx.lineTo(70, 104);
    ctx.moveTo(70, 108);
    ctx.lineTo(73, 109);
    ctx.stroke();
    ctx.restore();

    const press = clamp(t / 0.18, 0, 1);
    const inK = Math.min(1, press / 0.6);
    const outK = clamp((press - 0.6) / 0.4, 0, 1);
    const k = inK - outK;
    drawPressHand(ctx, lerp(118, 86, k), lerp(128, 104, k));

    const gp = clamp((t - 0.18) / 0.62, 0, 1);
    const rp = clamp((t - 0.18) / 0.66, 0, 0.95);
    const gx = startX + (endX - startX) * gp;
    const rx = startX + (endX - startX) * rp;

    const lane = (x: number, y: number, color: string) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    lane(rx, yGray, COLORS.muted);
    lane(gx, yGreen, COLORS.good);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch10Ana;
