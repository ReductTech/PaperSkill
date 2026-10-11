import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// awq-kit — the single shared Canvas drawing kit for the whole tutorial.
// Recording-studio metaphor: console surface, faders, level meters, tape reels,
// knobs, hands, bars and labels. Every other widget imports these helpers from
// './awq-kit' and never redefines the palette or primitives.
// ---------------------------------------------------------------------------

export const AQ = {
  bg: '#f5f8f0',
  desk: '#b8c9a7',
  deskDark: '#76906a',
  track: '#e8efe0',
  trackEdge: '#b8c9a7',
  trackInk: '#9fb0a2',
  tape: '#92400e',
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
  ctx.fillStyle = AQ.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = AQ.desk;
  ctx.fillRect(0, h - 20, w, 20);
  ctx.strokeStyle = AQ.deskDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 20);
  ctx.lineTo(w, h - 20);
  ctx.stroke();
}

export function drawFader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  level: number,
  opts: { salient?: boolean; clipped?: boolean } = {}
): void {
  const lv = Math.max(0, Math.min(1, level));
  ctx.fillStyle = AQ.track;
  ctx.strokeStyle = AQ.trackEdge;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - 5, y, 10, h, 5);
  ctx.fill();
  ctx.stroke();
  const capY = y + h - lv * (h - 10) - 5;
  const color = opts.clipped ? AQ.red : opts.salient ? AQ.orange : AQ.blue;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 9, capY - 6, 18, 12, 4);
  ctx.fill();
}

export function drawMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  level: number,
  opts: { clip?: boolean } = {}
): void {
  const lv = Math.max(0, Math.min(1, level));
  ctx.fillStyle = AQ.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const color = opts.clip ? AQ.red : lv > 0.8 ? AQ.orange : AQ.green;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(0, lv) * w, h, h / 2);
  ctx.fill();
}

export function drawTape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { levels?: number; fill?: number; color?: string } = {}
): void {
  ctx.fillStyle = AQ.card;
  ctx.strokeStyle = opts.color || AQ.tape;
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  const r = Math.min(w, h) * 0.18;
  ctx.strokeStyle = AQ.deskDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + w * 0.3, y + h * 0.45, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w * 0.7, y + h * 0.45, r, 0, Math.PI * 2);
  ctx.stroke();
  const n = Math.max(2, Math.min(32, opts.levels || 8));
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i < (opts.fill || 0) * n ? AQ.orange : AQ.border;
    ctx.fillRect(x + 8 + i * ((w - 16) / n), y + h - 10, Math.max(1, (w - 16) / n - 2), 5);
  }
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rows: number,
  cols: number
): void {
  ctx.strokeStyle = AQ.border;
  ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    const x = x0 + ((x1 - x0) * i) / cols;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    const y = y0 + ((y1 - y0) * j) / rows;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }
}

export function drawKnob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number
): void {
  ctx.fillStyle = AQ.card;
  ctx.strokeStyle = AQ.deskDark;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = AQ.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(angle) * r * 0.8, y - Math.cos(angle) * r * 0.8);
  ctx.stroke();
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
  ctx.fillStyle = AQ.tape;
  roundRect(ctx, 0, -s * 0.5, s * 1.4, s * 0.34, s * 0.16);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 1.35, 0, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  ctx.fillStyle = AQ.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(0, Math.min(1, ratio)) * w, h, h / 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = AQ.green;
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
    ctx.fillStyle = AQ.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 20 + ctx.measureText(it.label).width;
  });
}

// Shared animation hook: one rAF loop per Canvas, paused off-screen, absolute clock.
export function useAwqCanvas(
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

export const AwqKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default AwqKit;
