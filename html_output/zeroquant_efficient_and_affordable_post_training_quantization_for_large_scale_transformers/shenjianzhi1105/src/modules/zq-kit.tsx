import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// zq-kit — shared Canvas drawing kit for the ZeroQuant tutorial.
// Tailor-shop metaphor: workshop floor, racks, garments, customers, tape,
// grouped patterns, master tailor, arrows and bars. Every widget imports
// helpers from './zq-kit'.
// ---------------------------------------------------------------------------

export const ZQ = {
  bg: '#f7f4ec',
  floor: '#cbb79a',
  floorDark: '#8a7458',
  fabric: '#efe6d4',
  fabricEdge: '#b9a684',
  thread: '#8a5a44',
  blue: '#2f5d8a',
  green: '#2f7d4f',
  red: '#c0453f',
  orange: '#e07a3f',
  purple: '#7b4bb7',
  ink: '#2b2620',
  muted: '#7c7264',
  border: '#e0d8c8',
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
  ctx.fillStyle = ZQ.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ZQ.floor;
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = ZQ.floorDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 26);
  ctx.lineTo(w, h - 26);
  ctx.stroke();
}

export function drawRack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.strokeStyle = ZQ.floorDark;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + w, y + 10);
  ctx.moveTo(x + 6, y + 10);
  ctx.lineTo(x + 6, y + h);
  ctx.moveTo(x + w - 6, y + 10);
  ctx.lineTo(x + w - 6, y + h);
  ctx.stroke();
}

export function drawGarment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fit?: 'good' | 'bad' | 'neutral' } = {}
): void {
  const fit = opts.fit ?? 'neutral';
  const edge = fit === 'good' ? ZQ.green : fit === 'bad' ? ZQ.red : ZQ.fabricEdge;
  const bodyW = w * 0.62;
  const bodyX = x + (w - bodyW) / 2;
  ctx.fillStyle = fit === 'bad' ? 'rgba(192,69,63,0.10)' : ZQ.fabric;
  ctx.strokeStyle = edge;
  ctx.lineWidth = fit === 'neutral' ? 1.5 : 2.5;
  // body
  ctx.beginPath();
  ctx.moveTo(bodyX, y + h * 0.22);
  ctx.lineTo(bodyX + bodyW, y + h * 0.22);
  ctx.lineTo(bodyX + bodyW, y + h);
  ctx.lineTo(bodyX, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // sleeves
  const sleeveY = y + h * 0.24;
  ctx.beginPath();
  ctx.moveTo(bodyX, sleeveY);
  ctx.lineTo(x, fit === 'bad' ? y + h * 0.62 : y + h * 0.52);
  ctx.lineTo(x + w * 0.14, y + h * 0.78);
  ctx.lineTo(bodyX, y + h * 0.46);
  ctx.closePath();
  ctx.moveTo(bodyX + bodyW, sleeveY);
  ctx.lineTo(x + w, fit === 'bad' ? y + h * 0.36 : y + h * 0.52);
  ctx.lineTo(x + w * 0.86, y + h * 0.78);
  ctx.lineTo(bodyX + bodyW, y + h * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // collar
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.22, w * 0.10, 0, Math.PI);
  ctx.stroke();
  if (fit === 'good') {
    ctx.strokeStyle = ZQ.thread;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bodyX + 4, y + h * 0.55);
    ctx.lineTo(bodyX + bodyW - 4, y + h * 0.55);
    ctx.stroke();
  }
}

export function drawCustomer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  opts: { range?: number; highlight?: boolean } = {}
): void {
  const color = opts.highlight ? ZQ.blue : ZQ.ink;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.85, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.26, y - s * 0.62);
  ctx.lineTo(x + s * 0.26, y - s * 0.62);
  ctx.lineTo(x + s * 0.18, y);
  ctx.lineTo(x - s * 0.18, y);
  ctx.closePath();
  ctx.fill();
  if (opts.range !== undefined) {
    const barH = Math.max(4, opts.range * s * 0.045);
    ctx.fillStyle = opts.highlight ? ZQ.orange : ZQ.muted;
    ctx.fillRect(x + s * 0.34, y - barH, 5, barH);
  }
}

export function drawTape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  level: number,
  opts: { ok?: boolean } = {}
): void {
  ctx.strokeStyle = ZQ.orange;
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
  ctx.fillStyle = opts.ok === false ? ZQ.red : ZQ.green;
  ctx.beginPath();
  ctx.arc(x, ly, 6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  groups: number
): void {
  const n = Math.max(1, Math.min(8, groups));
  const cellW = w / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(47,93,138,0.08)' : 'rgba(123,75,183,0.08)';
    ctx.fillRect(x + i * cellW, y, cellW - 2, h);
    ctx.strokeStyle = ZQ.fabricEdge;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + i * cellW, y, cellW - 2, h);
    ctx.strokeStyle = ZQ.thread;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + i * cellW + 4, y + h * 0.3);
    ctx.lineTo(x + i * cellW + cellW - 8, y + h * 0.7);
    ctx.stroke();
  }
}

export function drawMaster(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = ZQ.purple;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.9, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y - s * 0.62);
  ctx.lineTo(x + s * 0.3, y - s * 0.62);
  ctx.lineTo(x + s * 0.2, y);
  ctx.lineTo(x - s * 0.2, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ZQ.purple;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.26, y - s * 0.5);
  ctx.lineTo(x + s * 0.8, y - s * 0.2);
  ctx.stroke();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4));
  ctx.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4));
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
  ctx.fillStyle = ZQ.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = ZQ.green;
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
    ctx.fillStyle = ZQ.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 20 + ctx.measureText(it.label).width;
  });
}

export function useZqCanvas(
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

export const ZqKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default ZqKit;
