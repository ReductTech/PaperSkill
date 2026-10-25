import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 analogy: one wall, two route lines (blue route A from the left, orange
// route B from the right) crossing exactly one shared hold in the middle; one
// climber grips that hold and is pulled slightly left then right (2.8 s loop);
// the hold glows purple at the moment both routes pull it. No labels inside.

const W = 560;
const H = 140;
const LOOP = 2.8;

const BG = '#f5f8f0';
const ROCK_LIGHT = '#b8c9a7';
const ROCK_DARK = '#76906a';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';

const SHARED = { x: 280, y: 100 };

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawHold(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.fillStyle = color;
  rr(ctx, x - r, y - r * 0.72, r * 2, r * 1.44, 4);
  ctx.fill();
}

function drawClimber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  color: string,
  hx: number,
  hy: number
) {
  const bob = Math.sin(t * Math.PI * 2) * 1.5;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y - 36 + bob, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 29 + bob);
  ctx.lineTo(x, y - 10 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 10 + bob);
  ctx.lineTo(x - 9, y + 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 10 + bob);
  ctx.lineTo(x + 9, y + 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 25 + bob);
  ctx.lineTo(x + 13, y - 12 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 24 + bob);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function render(ctx: CanvasRenderingContext2D, p: number, t: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ROCK_LIGHT;
  ctx.fillRect(0, 90, W, H - 90);
  ctx.strokeStyle = ROCK_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 90);
  ctx.lineTo(W, 90);
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 114);
  ctx.lineTo(W, 114);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // route lines: A from the left, B from the right, both into the shared hold
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(40, 132);
  ctx.quadraticCurveTo(150, 120, SHARED.x, SHARED.y);
  ctx.stroke();
  ctx.strokeStyle = ORANGE;
  ctx.beginPath();
  ctx.moveTo(520, 132);
  ctx.quadraticCurveTo(410, 120, SHARED.x, SHARED.y);
  ctx.stroke();

  // holds along each route
  drawHold(ctx, 95, 126, 8, BLUE);
  drawHold(ctx, 190, 116, 8, BLUE);
  drawHold(ctx, 465, 126, 8, ORANGE);
  drawHold(ctx, 370, 116, 8, ORANGE);

  // purple glow when both routes pull the shared hold
  const pull = Math.sin(p * Math.PI * 2);
  const glow = 0.22 + 0.5 * Math.abs(pull);
  ctx.fillStyle = PURPLE;
  ctx.globalAlpha = glow;
  ctx.beginPath();
  ctx.arc(SHARED.x, SHARED.y, 20 + 5 * Math.abs(pull), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // climber gripping the shared hold, pulled slightly left then right
  drawClimber(ctx, 296 + pull * 7, 122, t, BLUE, 278 + pull * 1.5, 92);

  // shared hold drawn last so the hand sits behind it
  drawHold(ctx, SHARED.x, SHARED.y, 15, PURPLE);
}

export const Ch2Ana: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = (now: number) => {
      const p = ((now / 1000) % LOOP) / LOOP;
      const t = (now / 1000) % 1;
      render(ctx, p, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-ch2-ana" ref={canvasRef} width={W} height={H} />;
};

export default Ch2Ana;
