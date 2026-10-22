import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// sq-kit — the single shared Canvas drawing kit for the whole tutorial.
// Shoulder-pole metaphor: mountain path, two baskets, rocks, pole, carrier,
// balance indicator, compartments, bars and labels. Every other widget imports
// these helpers from './sq-kit' and never redefines the palette.
// ---------------------------------------------------------------------------

export const SQ = {
  bg: '#f5f8f0',
  path: '#b8c9a7',
  pathDark: '#76906a',
  stone: '#e8efe0',
  stoneEdge: '#b8c9a7',
  rock: '#9fb0a2',
  rope: '#92400e',
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
  ctx.fillStyle = SQ.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = SQ.path;
  ctx.fillRect(0, h - 24, w, 24);
  ctx.strokeStyle = SQ.pathDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 24);
  ctx.lineTo(w, h - 24);
  ctx.stroke();
}

export function drawBasket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: number; highlight?: boolean } = {}
): void {
  const bw = w;
  const bh = h;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + bw, y);
  ctx.lineTo(x + bw * 0.82, y + bh);
  ctx.lineTo(x + bw * 0.18, y + bh);
  ctx.closePath();
  ctx.fillStyle = SQ.card;
  ctx.fill();
  ctx.strokeStyle = opts.highlight ? SQ.orange : SQ.rope;
  ctx.lineWidth = opts.highlight ? 3 : 2.2;
  ctx.stroke();
  // weave lines
  ctx.strokeStyle = SQ.stoneEdge;
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + bw * (0.08 * i), y + (bh * i) / 3);
    ctx.lineTo(x + bw * (1 - 0.06 * i), y + (bh * i) / 3);
    ctx.stroke();
  }
  void opts.fill;
}

export function drawRock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts: { outlier?: boolean } = {}
): void {
  ctx.fillStyle = opts.outlier ? SQ.red : SQ.rock;
  ctx.strokeStyle = opts.outlier ? SQ.red : SQ.stoneEdge;
  ctx.lineWidth = opts.outlier ? 2 : 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (opts.outlier) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y);
    ctx.lineTo(x + r * 0.4, y);
    ctx.stroke();
  }
}

export function drawPole(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  tilt: number,
  opts: { leftRocks?: number; rightRocks?: number; leftOutlier?: boolean; leftHighlight?: boolean; rightHighlight?: boolean } = {}
): void {
  ctx.save();
  ctx.translate(x + w / 2, y);
  ctx.rotate(tilt);
  ctx.strokeStyle = SQ.rope;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.stroke();
  const bw = Math.min(84, w * 0.22);
  const bh = 34;
  // left basket
  ctx.strokeStyle = SQ.rope;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + bw * 0.5, 0);
  ctx.lineTo(-w / 2 + bw * 0.5, 10);
  ctx.stroke();
  drawBasket(ctx, -w / 2, 10, bw, bh, { highlight: opts.leftHighlight });
  const ln = opts.leftRocks ?? 3;
  for (let i = 0; i < ln; i++) {
    drawRock(ctx, -w / 2 + bw * (0.25 + (i % 2) * 0.4), 20 + Math.floor(i / 2) * 9, 5 + (i % 3), {});
  }
  if (opts.leftOutlier) drawRock(ctx, -w / 2 + bw * 0.5, 14, 14, { outlier: true });
  // right basket
  ctx.beginPath();
  ctx.moveTo(w / 2 - bw * 0.5, 0);
  ctx.lineTo(w / 2 - bw * 0.5, 10);
  ctx.stroke();
  drawBasket(ctx, w / 2 - bw, 10, bw, bh, { highlight: opts.rightHighlight });
  const rn = opts.rightRocks ?? 4;
  for (let i = 0; i < rn; i++) {
    drawRock(ctx, w / 2 - bw + bw * (0.25 + (i % 2) * 0.4), 20 + Math.floor(i / 2) * 9, 4 + (i % 2), {});
  }
  ctx.restore();
}

export function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  tilt: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt * 0.5);
  ctx.strokeStyle = SQ.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, s * 0.55);
  ctx.stroke();
  ctx.fillStyle = SQ.ink;
  ctx.beginPath();
  ctx.arc(0, -s * 0.12, s * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, s * 0.55);
  ctx.lineTo(-s * 0.18, s * 0.85);
  ctx.moveTo(0, s * 0.55);
  ctx.lineTo(s * 0.18, s * 0.85);
  ctx.stroke();
  ctx.restore();
}

export function drawBalance(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  tilt: number,
  ok: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.strokeStyle = ok ? SQ.green : SQ.red;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.stroke();
  ctx.fillStyle = ok ? SQ.green : SQ.red;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: number,
  cols: number
): void {
  ctx.strokeStyle = SQ.border;
  ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    const xx = x + (w * i) / cols;
    ctx.beginPath();
    ctx.moveTo(xx, y);
    ctx.lineTo(xx, y + h);
    ctx.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    const yy = y + (h * j) / rows;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
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
  ctx.fillStyle = SQ.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = SQ.green;
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
    ctx.fillStyle = SQ.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 20 + ctx.measureText(it.label).width;
  });
}

export function useSqCanvas(
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

export const SqKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default SqKit;
