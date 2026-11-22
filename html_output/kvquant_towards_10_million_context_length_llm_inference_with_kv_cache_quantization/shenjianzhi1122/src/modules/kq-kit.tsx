import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// kq-kit — shared Canvas drawing kit for the KVQuant tutorial.
// Long-trip packing metaphor: suitcase, vacuum bags, hard case, passport
// pouch, clothing items, luggage scale, bars and labels.
// ---------------------------------------------------------------------------

export const KQ = {
  bg: '#f4f1e8',
  floor: '#c8b9a0',
  floorDark: '#8a7a60',
  case: '#e8dfcf',
  caseEdge: '#b9a98c',
  ink: '#2c2a24',
  muted: '#7d7466',
  border: '#e0d8c8',
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
  ctx.fillStyle = KQ.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = KQ.floor;
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = KQ.floorDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 26);
  ctx.lineTo(w, h - 26);
  ctx.stroke();
}

export function drawCase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number
): void {
  ctx.fillStyle = KQ.case;
  ctx.strokeStyle = KQ.floorDark;
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  const f = Math.max(0, Math.min(1, fill));
  if (f > 0) {
    ctx.fillStyle = 'rgba(47,93,138,0.16)';
    const innerH = (h - 10) * f;
    ctx.fillRect(x + 5, y + h - 5 - innerH, w - 10, innerH);
  }
  ctx.strokeStyle = KQ.caseEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.32, y);
  ctx.lineTo(x + w * 0.32, y - 10);
  ctx.lineTo(x + w * 0.68, y - 10);
  ctx.lineTo(x + w * 0.68, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 8);
  ctx.lineTo(x + w / 2, y + h - 8);
  ctx.stroke();
}

export function drawCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { tone?: 'normal' | 'old' } = {}
): void {
  const old = opts.tone === 'old';
  ctx.fillStyle = old ? 'rgba(125,116,102,0.10)' : 'rgba(232,223,207,0.85)';
  ctx.strokeStyle = old ? KQ.muted : KQ.caseEdge;
  ctx.lineWidth = old ? 1.2 : 1.8;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = old ? KQ.muted : KQ.caseEdge;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 5, y + h * 0.18);
  ctx.lineTo(x + w - 5, y + h * 0.18);
  ctx.stroke();
  ctx.fillStyle = old ? KQ.muted : KQ.blue;
  ctx.fillRect(x + w / 2 - 6, y + h * 0.18 - 3, 12, 6);
}

export function drawHardBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(192,69,63,0.10)';
  ctx.strokeStyle = KQ.red;
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = KQ.red;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h / 2);
  ctx.lineTo(x + w * 0.8, y + h / 2);
  ctx.stroke();
  ctx.fillStyle = KQ.red;
  ctx.fillRect(x + w / 2 - 4, y + h / 2 - 4, 8, 8);
}

export function drawPouch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(123,75,183,0.14)';
  ctx.strokeStyle = KQ.purple;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = KQ.purple;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.25, y + h * 0.15);
  ctx.lineTo(x + w * 0.75, y + h * 0.15);
  ctx.stroke();
}

export function drawItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { big?: boolean } = {}
): void {
  ctx.fillStyle = opts.big ? 'rgba(192,69,63,0.18)' : 'rgba(232,223,207,0.9)';
  ctx.strokeStyle = opts.big ? KQ.red : KQ.caseEdge;
  ctx.lineWidth = opts.big ? 2.5 : 1.5;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  if (!opts.big) {
    ctx.strokeStyle = KQ.caseEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + h * 0.38);
    ctx.lineTo(x + w - 5, y + h * 0.38);
    ctx.stroke();
  }
}

export function drawScale(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number
): void {
  ctx.fillStyle = KQ.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = ratio >= 1 ? KQ.red : KQ.green;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
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
  ctx.fillStyle = KQ.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = KQ.green;
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
    ctx.fillStyle = KQ.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 20 + ctx.measureText(it.label).width;
  });
}

export function useKqCanvas(
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

export const KqKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default KqKit;
