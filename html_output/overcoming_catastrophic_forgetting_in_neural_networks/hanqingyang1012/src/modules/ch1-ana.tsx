import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 analogy: the climber re-climbs the old route. As the loop advances, the
// green-ringed crux hold fades (0→60% opacity, red outline grows), the hand
// reaches, grabs air and the climber slides down. 3.2 s loop, paused off-screen,
// no labels inside.

const W = 560;
const H = 140;
const LOOP = 3.2;

const BG = '#f5f8f0';
const ROCK_LIGHT = '#b8c9a7';
const ROCK_DARK = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';

const CRUX = { x: 330, y: 100 };

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

function easeOut(k: number): number {
  return 1 - Math.pow(1 - k, 3);
}

function drawHold(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
  redW = 0
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  rr(ctx, x - r, y - r * 0.72, r * 2, r * 1.44, 4);
  ctx.fill();
  if (redW > 0) {
    ctx.strokeStyle = RED;
    ctx.lineWidth = redW;
    rr(ctx, x - r, y - r * 0.72, r * 2, r * 1.44, 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  lw: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
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

  drawHold(ctx, 80, 124, 12, BLUE, 1);
  drawHold(ctx, 160, 116, 11, BLUE, 1);
  drawHold(ctx, 240, 106, 12, BLUE, 1);
  drawHold(ctx, CRUX.x, CRUX.y, 14, BLUE, 1 - 0.6 * p, 1 + 2.5 * p);
  drawHold(ctx, 430, 92, 11, BLUE, 1);

  let cx: number;
  let cy: number;
  let hx: number;
  let hy: number;
  if (p < 0.55) {
    const k = easeOut(p / 0.55);
    cx = lerp(60, 352, k);
    cy = lerp(128, 126, k);
    hx = lerp(78, 322, k);
    hy = lerp(96, 88, k);
  } else if (p < 0.7) {
    cx = 352;
    cy = 126;
    hx = 322 + Math.sin(t * Math.PI * 2) * 2.5;
    hy = 88;
  } else {
    const k = (p - 0.7) / 0.3;
    cx = lerp(352, 90, k);
    cy = lerp(126, 136, k * k);
    hx = lerp(322, 110, k);
    hy = lerp(88, 118, k * k);
  }
  const color = p < 0.68 ? BLUE : RED;
  drawClimber(ctx, cx, cy, t, color, hx, hy);
  drawRing(ctx, CRUX.x, CRUX.y, 19, GREEN, 2.5);
}

export const Ch1Ana: React.FC<WidgetProps> = () => {
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

  return <canvas id="cv-ch1-ana" ref={canvasRef} width={W} height={H} />;
};

export default Ch1Ana;
