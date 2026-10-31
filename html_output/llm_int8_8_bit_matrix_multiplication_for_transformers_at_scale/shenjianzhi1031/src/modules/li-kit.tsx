import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// li-kit — shared Canvas drawing kit for the LLM.int8 tutorial.
// Laundry metaphor: floor, basins, clothes, oversized items, hand, detergent,
// size ruler, capacity gauge, bars and labels. Every widget imports from './li-kit'.
// ---------------------------------------------------------------------------

export const LI = {
  bg: '#f5f8f0',
  floor: '#b8c9a7',
  floorDark: '#76906a',
  cloth: '#e8efe0',
  clothEdge: '#b8c9a7',
  clothInk: '#9fb0a2',
  water: '#27446e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  card: '#ffffff',
};

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = LI.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = LI.floor;
  ctx.fillRect(0, h - 24, w, 24);
  ctx.strokeStyle = LI.floorDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 24);
  ctx.lineTo(w, h - 24);
  ctx.stroke();
}

export function drawBasin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: number; highlight?: boolean } = {}
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.quadraticCurveTo(x + w * 0.92, y + h, x + w * 0.5, y + h);
  ctx.quadraticCurveTo(x + w * 0.08, y + h, x, y);
  ctx.closePath();
  ctx.fillStyle = opts.highlight ? '#eef3fb' : LI.card;
  ctx.fill();
  ctx.strokeStyle = opts.highlight ? LI.purple : LI.floorDark;
  ctx.lineWidth = opts.highlight ? 3 : 2;
  ctx.stroke();
  const f = Math.max(0, Math.min(1, opts.fill ?? 0));
  if (f > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 6);
    ctx.lineTo(x + w - 4, y + 6);
    ctx.quadraticCurveTo(x + w * 0.9, y + h - 4, x + w * 0.5, y + h - 4);
    ctx.quadraticCurveTo(x + w * 0.1, y + h - 4, x + 4, y + 6);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(39,68,110,0.16)';
    ctx.fillRect(x, y + h * (1 - f), w, h * f);
    ctx.restore();
  }
  ctx.strokeStyle = LI.clothEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y, w / 2, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawGarment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { big?: boolean; folded?: boolean } = {}
): void {
  ctx.fillStyle = opts.big ? LI.red : LI.cloth;
  ctx.strokeStyle = opts.big ? LI.red : LI.clothEdge;
  ctx.lineWidth = opts.big ? 2.5 : 1.5;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();
  if (!opts.big) {
    ctx.strokeStyle = LI.clothInk;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + h * 0.35);
    ctx.lineTo(x + w - 5, y + h * 0.35);
    if (opts.folded) {
      ctx.moveTo(x + 5, y + h * 0.65);
      ctx.lineTo(x + w - 5, y + h * 0.65);
    }
    ctx.stroke();
  }
}

export function drawHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  angle: number = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = LI.orange;
  roundRect(ctx, 0, -s * 0.5, s * 1.4, s * 0.34, s * 0.16);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 1.35, 0, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBottle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = LI.water;
  roundRect(ctx, x, y, s * 0.7, s * 1.2, s * 0.18);
  ctx.fill();
  ctx.fillStyle = LI.card;
  ctx.fillRect(x + s * 0.2, y + s * 0.35, s * 0.3, s * 0.35);
  ctx.fillStyle = LI.water;
  ctx.fillRect(x + s * 0.25, y - s * 0.18, s * 0.2, s * 0.2);
}

export function drawRuler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  level: number,
  opts: { ok?: boolean } = {}
): void {
  ctx.strokeStyle = LI.orange;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
  for (let i = 0; i <= 6; i++) {
    const yy = y + (h * i) / 6;
    ctx.beginPath();
    ctx.moveTo(x - 6, yy);
    ctx.lineTo(x + 6, yy);
    ctx.stroke();
  }
  const ly = y + h * (1 - Math.max(0, Math.min(1, level)));
  ctx.fillStyle = opts.ok === false ? LI.red : LI.green;
  ctx.beginPath();
  ctx.arc(x, ly, 6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCapacity(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number
): void {
  ctx.fillStyle = LI.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = ratio >= 1 ? LI.red : LI.water;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
}

export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: string
): void {
  ctx.fillStyle = LI.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = LI.green;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y);
  ctx.lineTo(x - r * 0.1, y + r * 0.45);
  ctx.lineTo(x + r * 0.55, y - r * 0.4);
  ctx.stroke();
}

export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  size: number = 13,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = size + 'px "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { label: string; color: string }[]
): void {
  let cx = x;
  ctx.font = '12px "Segoe UI", sans-serif';
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.arc(cx + 5, y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = LI.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 20 + ctx.measureText(it.label).width;
  });
}

export function useLiCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  W: number,
  H: number
): React.RefObject<HTMLCanvasElement> {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const drawRef = React.useRef(draw);
  drawRef.current = draw;
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = () => {
      drawRef.current(ctx, W, H, performance.now() / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H]);
  return ref;
}

export const LiKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default LiKit;
