import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// kv-kit — shared Canvas drawing kit for the KIVI tutorial.
// Archive-room metaphor: shelves, folders, index cards, body pages, recent
// desk stack, magnifier, ruler, bars and labels. Every widget imports from
// './kv-kit'.
// ---------------------------------------------------------------------------

export const KV = {
  bg: '#f6f3ea',
  floor: '#c9b89c',
  floorDark: '#8a7658',
  paper: '#fbf7ec',
  paperEdge: '#cdbfa6',
  ink: '#2c2a24',
  muted: '#7d7466',
  border: '#e2dacb',
  blue: '#2f5d8a',
  green: '#2f7d4f',
  red: '#c0453f',
  orange: '#e07a3f',
  purple: '#7b4bb7',
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
  ctx.fillStyle = KV.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = KV.floor;
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = KV.floorDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 26);
  ctx.lineTo(w, h - 26);
  ctx.stroke();
}

export function drawShelf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: number
): void {
  ctx.strokeStyle = KV.floorDark;
  ctx.lineWidth = 2.5;
  const rh = h / Math.max(1, rows);
  for (let i = 0; i <= rows; i++) {
    const yy = y + i * rh;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
}

export function drawFolder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { tone?: 'normal' | 'old' | 'hot' } = {}
): void {
  const tone = opts.tone ?? 'normal';
  ctx.fillStyle = tone === 'hot' ? 'rgba(192,69,63,0.12)' : KV.paper;
  ctx.strokeStyle = tone === 'hot' ? KV.red : tone === 'old' ? KV.muted : KV.paperEdge;
  ctx.lineWidth = tone === 'hot' ? 2.5 : 1.5;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tone === 'hot' ? KV.red : KV.paperEdge;
  ctx.fillRect(x + w * 0.14, y + h * 0.16, w * 0.5, Math.max(2, h * 0.09));
  if (tone === 'old') {
    ctx.strokeStyle = KV.muted;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h * (0.4 + i * 0.16));
      ctx.lineTo(x + w - 4, y + h * (0.4 + i * 0.16));
      ctx.stroke();
    }
  }
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number
): void {
  ctx.fillStyle = KV.paper;
  ctx.strokeStyle = KV.paperEdge;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  const cw = w / cols;
  ctx.strokeStyle = KV.border;
  ctx.lineWidth = 1;
  for (let i = 1; i < cols; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * cw, y + 4);
    ctx.lineTo(x + i * cw, y + h - 4);
    ctx.stroke();
  }
}

export function drawPage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = KV.paper;
  ctx.strokeStyle = KV.paperEdge;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = KV.border;
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 8 + i * (h - 16) / 4);
    ctx.lineTo(x + w - 5, y + 8 + i * (h - 16) / 4);
    ctx.stroke();
  }
}

export function drawStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  n: number
): void {
  const layers = Math.max(1, Math.min(6, n));
  for (let i = 0; i < layers; i++) {
    const yy = y + h - (i + 1) * (h / 7);
    ctx.fillStyle = i === layers - 1 ? 'rgba(123,75,183,0.14)' : KV.paper;
    ctx.strokeStyle = i === layers - 1 ? KV.purple : KV.paperEdge;
    ctx.lineWidth = i === layers - 1 ? 2 : 1.2;
    roundRect(ctx, x + (i % 2) * 2, yy, w - (i % 2) * 3, h / 8, 2);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = KV.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + r * 0.7, y + r * 0.7);
  ctx.lineTo(x + r * 1.5, y + r * 1.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(47,93,138,0.08)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRuler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  level: number,
  opts: { ok?: boolean } = {}
): void {
  ctx.strokeStyle = KV.orange;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
  for (let i = 0; i <= 6; i++) {
    const yy = y + (h * i) / 6;
    ctx.beginPath();
    ctx.moveTo(x - 7, yy);
    ctx.lineTo(x + 7, yy);
    ctx.stroke();
  }
  const ly = y + h * (1 - Math.max(0, Math.min(1, level)));
  ctx.fillStyle = opts.ok === false ? KV.red : KV.green;
  ctx.beginPath();
  ctx.arc(x, ly, 6, 0, Math.PI * 2);
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
  ctx.fillStyle = KV.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = KV.green;
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
    ctx.fillStyle = KV.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 20 + ctx.measureText(it.label).width;
  });
}

export function useKvCanvas(
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

export const KvKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default KvKit;
