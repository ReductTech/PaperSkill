import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero contrast pair: one climber on the same wall, both sides loop on the same
// 3.2 s time basis. moduleId 'old' = plain SGD: the crux hold fades, the climber
// grabs air and slides off (red semantics). moduleId 'new' = EWC: a piton anchors
// the crux hold, the rope stays taut, the climber passes the crux and tops out
// (green/blue semantics). No labels inside the canvas.

const W = 460;
const H = 220;
const LOOP = 3.2;

const BG = '#f5f8f0';
const ROCK_LIGHT = '#b8c9a7';
const ROCK_DARK = '#76906a';
const ROPE = '#92400e';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const INK = '#21324a';

const CRUX = { x: 295, y: 150 };
const TOP = { x: 352, y: 130 };

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

function drawAnchor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.45);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(4.5, 4);
  ctx.lineTo(-4.5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawRing(ctx, x, y, 13, GREEN, 2.5);
}

function drawRope(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sag: number
) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  ctx.strokeStyle = ROPE;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
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
  ctx.arc(x, y - 36 + bob, 6.5, 0, Math.PI * 2);
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
  ctx.arc(hx, hy, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawWallScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ROCK_LIGHT;
  ctx.fillRect(0, 150, W, H - 150);
  ctx.strokeStyle = ROCK_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.lineTo(W, 150);
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = ROCK_DARK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 176);
  ctx.lineTo(W, 176);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function renderOld(ctx: CanvasRenderingContext2D, p: number, t: number) {
  drawWallScene(ctx);
  drawHold(ctx, 70, 195, 13, BLUE, 1);
  drawHold(ctx, 150, 178, 12, BLUE, 1);
  drawHold(ctx, 225, 160, 13, BLUE, 1);
  drawHold(ctx, CRUX.x, CRUX.y, 16, BLUE, 1 - 0.6 * p, 1 + 2.5 * p);
  drawHold(ctx, TOP.x, TOP.y, 14, BLUE, 1);

  let cx: number;
  let cy: number;
  let hx: number;
  let hy: number;
  if (p < 0.5) {
    const k = easeOut(p / 0.5);
    cx = lerp(70, 300, k);
    cy = lerp(198, 178, k);
    hx = lerp(88, 289, k);
    hy = lerp(164, 136, k);
  } else if (p < 0.68) {
    cx = 300;
    cy = 178;
    hx = 289 + Math.sin(t * Math.PI * 2) * 3;
    hy = 136;
  } else {
    const k = (p - 0.68) / 0.32;
    cx = lerp(300, 84, k);
    cy = lerp(178, 206, k * k);
    hx = lerp(289, 98, k);
    hy = lerp(136, 182, k * k);
  }
  const color = p < 0.66 ? BLUE : RED;
  drawClimber(ctx, cx, cy, t, color, hx, hy);
  drawRing(ctx, CRUX.x, CRUX.y, 21, GREEN, 2.5);
}

function renderNew(ctx: CanvasRenderingContext2D, p: number, t: number) {
  drawWallScene(ctx);
  drawHold(ctx, 70, 195, 13, BLUE, 1);
  drawHold(ctx, 150, 178, 12, BLUE, 1);
  drawHold(ctx, 225, 160, 13, BLUE, 1);
  drawHold(ctx, CRUX.x, CRUX.y, 16, BLUE, 1);
  drawHold(ctx, TOP.x, TOP.y, 14, BLUE, 1);

  drawAnchor(ctx, CRUX.x, CRUX.y - 26, INK);

  let cx: number;
  let cy: number;
  if (p < 0.78) {
    const k = easeOut(p / 0.78);
    cx = lerp(70, 352, k);
    cy = lerp(198, 156, k);
  } else {
    const s = Math.sin(((p - 0.78) / 0.22) * Math.PI);
    cx = 352;
    cy = 156 - s * 3;
  }
  let hx: number;
  let hy: number;
  if (p < 0.5) {
    hx = 289;
    hy = 136;
  } else {
    hx = 348;
    hy = 118;
  }
  hx += Math.sin(t * Math.PI * 2) * 2;

  drawRope(ctx, CRUX.x, CRUX.y - 26, cx, cy, 6 + Math.sin(t * Math.PI * 2) * 2);
  drawClimber(ctx, cx, cy, t, BLUE, hx, hy);
  drawRing(ctx, TOP.x, TOP.y, 19, GREEN, 2.5);
}

export const HeroForgetting: React.FC<WidgetProps> = ({ moduleId }) => {
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
      if (moduleId === 'new') {
        renderNew(ctx, p, t);
      } else {
        renderOld(ctx, p, t);
      }
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
  }, [moduleId]);

  return <canvas id={`cv-hero-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroForgetting;
