import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// gptq-kit — the single shared Canvas drawing kit for the whole tutorial.
// Paving metaphor: yard field, tile positions, standard tiles, trowel/hand,
// spirit level, sample template, end flag, bars and labels. Every other widget
// imports these helpers from './gptq-kit' and never redefines the palette.
// ---------------------------------------------------------------------------

export const GQ = {
  bg: '#f5f8f0',
  yard: '#b8c9a7',
  yardDark: '#76906a',
  stone: '#e8efe0',
  stoneEdge: '#b8c9a7',
  mortar: '#92400e',
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
  ctx.fillStyle = GQ.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GQ.yard;
  ctx.fillRect(0, h - 22, w, 22);
  ctx.strokeStyle = GQ.yardDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 22);
  ctx.lineTo(w, h - 22);
  ctx.stroke();
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  opts: { filled?: boolean; snap?: boolean; cracked?: boolean; highlight?: boolean } = {}
): void {
  ctx.fillStyle = opts.cracked ? GQ.red : opts.filled ? GQ.stone : GQ.card;
  ctx.strokeStyle = opts.highlight ? GQ.orange : opts.snap ? GQ.blue : GQ.stoneEdge;
  ctx.lineWidth = opts.highlight || opts.snap ? 2.5 : 1.5;
  roundRect(ctx, x, y, s, s, 4);
  ctx.fill();
  ctx.stroke();
  if (!opts.filled && !opts.cracked) {
    ctx.strokeStyle = GQ.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + s - 3);
    ctx.lineTo(x + s - 3, y + 3);
    ctx.stroke();
  }
  if (opts.cracked) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y + 3);
    ctx.lineTo(x + s * 0.5, y + s * 0.6);
    ctx.lineTo(x + s * 0.7, y + s - 3);
    ctx.stroke();
  }
}

export function drawPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: number,
  s: number,
  gap: number,
  opts: (i: number) => { filled?: boolean; snap?: boolean; cracked?: boolean; highlight?: boolean } = () => ({})
): void {
  for (let i = 0; i < n; i++) {
    drawTile(ctx, x + i * (s + gap), y, s, opts(i));
  }
}

export function drawTrowel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  angle: number = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = GQ.mortar;
  roundRect(ctx, 0, -s * 0.3, s * 1.1, s * 0.6, s * 0.2);
  ctx.fill();
  ctx.fillRect(s * 1.05, -s * 0.1, s * 0.6, s * 0.2);
  ctx.restore();
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
  ctx.fillStyle = GQ.mortar;
  roundRect(ctx, 0, -s * 0.5, s * 1.4, s * 0.34, s * 0.16);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 1.35, 0, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawLevel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  angle: number,
  ok: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = GQ.card;
  ctx.strokeStyle = ok ? GQ.green : GQ.red;
  ctx.lineWidth = 2.5;
  roundRect(ctx, -w / 2, -8, w, 16, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ok ? GQ.green : GQ.red;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawSample(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.fillStyle = GQ.card;
  ctx.strokeStyle = GQ.purple;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = GQ.border;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 4, y + (h * i) / 4);
    ctx.lineTo(x + w - 4, y + (h * i) / 4);
    ctx.stroke();
  }
}

export function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.strokeStyle = GQ.yardDark;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - s);
  ctx.stroke();
  ctx.fillStyle = GQ.orange;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.7, y - s * 0.75);
  ctx.lineTo(x, y - s * 0.5);
  ctx.closePath();
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
  ctx.fillStyle = GQ.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = GQ.green;
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
    ctx.fillStyle = GQ.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 20 + ctx.measureText(it.label).width;
  });
}

export function useGptqCanvas(
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

export const GptqKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default GptqKit;
