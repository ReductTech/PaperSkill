import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chapter 9 analogy — 一只手举放大镜检查修好的区域（交付前的最后检查）.
// One moving subject: the magnifier. It dips onto one repaired spot, the detail inside the
// lens enlarges cleanly and a small green check confirms it, then it lifts and moves to the
// second spot. Static props: the desk lamp and the photo itself.

const W = 560;
const H = 140;
const PERIOD = 3200;

const SPOT_A = { x: 262, y: 58 };
const SPOT_B = { x: 310, y: 82 };

// (t, magnifier centre x, magnifier centre y) — travel segments are eased.
const KEYFRAMES: Array<[number, number, number]> = [
  [0.0, 140, 44],
  [0.14, 168, 36],
  [0.3, SPOT_A.x, SPOT_A.y],
  [0.5, SPOT_A.x, SPOT_A.y],
  [0.62, SPOT_B.x, SPOT_B.y],
  [0.8, SPOT_B.x, SPOT_B.y],
  [0.92, 356, 38],
  [1.0, 140, 44],
];

/** Deterministic pseudo-random so damage speckles never flicker between frames. */
function hash(i: number): number {
  const v = Math.sin(i * 127.1 + 13.7) * 43758.5453;
  return v - Math.floor(v);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
): void {
  const border = stateColor ?? '#d7deea';
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const inset = 5;
  ctx.save();
  roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, 3);
  ctx.clip();

  const d = clamp(damage, 0, 1);
  const specks = Math.round(140 * d);
  for (let i = 0; i < specks; i++) {
    const px = x + inset + hash(i * 3 + 1) * (w - inset * 2);
    const py = y + inset + hash(i * 3 + 2) * (h - inset * 2);
    const size = 1 + hash(i * 3 + 3) * 2;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(px, py, size, size);
  }
  ctx.globalAlpha = 1;

  const cracks = d > 0.03 ? Math.max(1, Math.round(4 * d)) : 0;
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  for (let c = 0; c < cracks; c++) {
    const sx = x + inset + hash(c * 7 + 31) * (w - inset * 2);
    const sy = y + inset + hash(c * 7 + 32) * (h - inset * 2);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (hash(c * 7 + 33) - 0.5) * 40, sy + (hash(c * 7 + 34) - 0.5) * 22);
    ctx.lineTo(sx + (hash(c * 7 + 35) - 0.5) * 64, sy + (hash(c * 7 + 36) - 0.5) * 30);
    ctx.stroke();
  }
  ctx.restore();

  roundRectPath(ctx, x + 1.5, y + 1.5, w - 3, h - 3, 6);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.stroke();
}

/** The small restored detail the magnifier verifies (drawn again, magnified, inside the lens). */
function drawSpotDetail(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - 4 * scale, cy + 2 * scale, 9 * scale, Math.PI * 1.05, Math.PI * 1.85);
  ctx.stroke();
  ctx.fillStyle = '#228d5c';
  ctx.beginPath();
  ctx.arc(cx + 8 * scale, cy - 8 * scale, 2.4 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCheck(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x - 2, y + 7);
  ctx.lineTo(x + 9, y - 8);
  ctx.stroke();
  ctx.restore();
}

function drawMagnifier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.72, r * 0.72);
  ctx.lineTo(r * 0.72 + 30, r * 0.72 + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(39,68,110,0.08)';
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 32);
  ctx.lineTo(x, y - 6);
  ctx.stroke();
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 6);
  ctx.lineTo(x + 18, y - 6);
  ctx.lineTo(x + 11, y - 26);
  ctx.lineTo(x - 11, y - 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function positionAt(t: number): { x: number; y: number } {
  const time = clamp(t, 0, 1);
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (time >= a[0] && time <= b[0]) {
      const span = b[0] - a[0];
      const u = span <= 0 ? 1 : (time - a[0]) / span;
      const e = easeInOutQuad(clamp(u, 0, 1));
      return { x: lerp(a[1], b[1], e), y: lerp(a[2], b[2], e) };
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1];
  return { x: last[1], y: last[2] };
}

export const Ch9Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let elapsed = 0;
    let last = -1;
    let raf: number | null = null;

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);
      drawLamp(ctx, 62, 86);
      drawPhoto(ctx, 200, 20, 160, 88, 0.06, '#228d5c');
      drawSpotDetail(ctx, SPOT_A.x, SPOT_A.y, 1, 0.9);
      drawSpotDetail(ctx, SPOT_B.x, SPOT_B.y, 1, 0.9);

      const pos = positionAt(t);
      const dA = Math.hypot(pos.x - SPOT_A.x, pos.y - SPOT_A.y);
      const dB = Math.hypot(pos.x - SPOT_B.x, pos.y - SPOT_B.y);
      const seated = dA < 7 || dB < 7;
      const r = 24;

      if (seated) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(pos.x - r, pos.y - r, r * 2, r * 2);
        drawSpotDetail(ctx, pos.x, pos.y, 1.9, 1);
        ctx.restore();
      }

      drawMagnifier(ctx, pos.x, pos.y, r, 0.55);

      drawCheck(ctx, 300, 36, clamp((t - 0.33) / 0.06, 0, 1));
      drawCheck(ctx, 350, 64, clamp((t - 0.66) / 0.06, 0, 1));
    };

    const tick = (now: number) => {
      if (last < 0) last = now;
      const dt = Math.min(now - last, 64);
      last = now;
      elapsed = (elapsed + dt) % PERIOD;
      render(elapsed / PERIOD);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      last = -1;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ch9Ana;
