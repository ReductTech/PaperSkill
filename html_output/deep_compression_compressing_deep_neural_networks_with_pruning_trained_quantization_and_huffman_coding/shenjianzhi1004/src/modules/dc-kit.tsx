import React from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// ---------------------------------------------------------------------------
// dc-kit — the single shared Canvas drawing kit for the whole tutorial.
// The photo-album metaphor lives here: desk, album frame, photo tiles, hand,
// storage card, recycle bin, group tray, label tags, bars, target and labels.
// Every other widget imports these helpers from './dc-kit' and never redefines
// the palette or the primitives.
// ---------------------------------------------------------------------------

export const DC = {
  bg: '#f5f8f0',
  desk: '#b8c9a7',
  deskDark: '#76906a',
  photo: '#e8efe0',
  photoEdge: '#b8c9a7',
  photoInk: '#9fb0a2',
  route: '#92400e',
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
  ctx.fillStyle = DC.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = DC.desk;
  ctx.fillRect(0, h - 22, w, 22);
  ctx.strokeStyle = DC.deskDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 22);
  ctx.lineTo(w, h - 22);
  ctx.stroke();
}

export function drawAlbumFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  open: boolean = false
): void {
  ctx.fillStyle = DC.card;
  ctx.strokeStyle = open ? DC.red : DC.deskDark;
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = DC.desk;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 4);
  ctx.lineTo(x + 6, y + h - 4);
  ctx.stroke();
}

export function drawPhotoTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { blur?: boolean; emphasis?: boolean; tag?: string; color?: string; fold?: boolean } = {}
): void {
  const color = opts.color || (opts.blur ? DC.red : opts.emphasis ? DC.blue : DC.photo);
  ctx.fillStyle = color;
  ctx.strokeStyle = opts.emphasis ? DC.blue : DC.photoEdge;
  ctx.lineWidth = opts.emphasis ? 2.5 : 1.5;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.stroke();
  if (opts.blur) {
    ctx.strokeStyle = DC.red;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 5 + i * (h / 3));
      ctx.lineTo(x + w - 3, y + 8 + i * (h / 3));
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = DC.photoInk;
    ctx.beginPath();
    ctx.arc(x + w * 0.35, y + h * 0.4, Math.min(w, h) * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + w * 0.2, y + h * 0.62, w * 0.6, h * 0.16);
  }
  if (opts.fold) {
    ctx.fillStyle = DC.border;
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w - 10, y);
    ctx.lineTo(x + w, y + 10);
    ctx.closePath();
    ctx.fill();
  }
  if (opts.tag) {
    drawTag(ctx, x + w / 2 - 14, y - 9, opts.tag, DC.purple);
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
  ctx.fillStyle = DC.route;
  roundRect(ctx, 0, -s * 0.5, s * 1.4, s * 0.34, s * 0.16);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 1.35, 0, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number,
  label?: string
): void {
  ctx.fillStyle = DC.card;
  ctx.strokeStyle = DC.deskDark;
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  const m = 6;
  const f = Math.max(0, Math.min(1, fill));
  ctx.fillStyle = f >= 1 ? DC.red : DC.blue;
  ctx.fillRect(x + m, y + h - m - (h - 2 * m) * Math.min(f, 1), w - 2 * m, (h - 2 * m) * Math.min(f, 1));
  if (label) drawSceneLabel(ctx, x + w / 2, y + h / 2 + 4, label, DC.ink, 13, 'center');
}

export function drawTrash(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = DC.card;
  ctx.strokeStyle = DC.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x + s * 0.82, y + s);
  ctx.lineTo(x + s * 0.18, y + s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.12, y);
  ctx.lineTo(x + s * 1.12, y);
  ctx.stroke();
}

export function drawGroupTray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  n: number,
  active: number
): void {
  const gap = 6;
  const cw = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i === active ? DC.blue : DC.photo;
    ctx.strokeStyle = i === active ? DC.blue : DC.photoEdge;
    ctx.lineWidth = i === active ? 2.5 : 1.2;
    roundRect(ctx, x + i * (cw + gap), y, cw, h, 4);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string
): void {
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  const w = Math.max(26, ctx.measureText(text).width + 12);
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, 20, 5);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 11);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
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
  ctx.fillStyle = DC.border;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  const bw = Math.max(0, Math.min(1, ratio)) * w;
  roundRect(ctx, x, y, bw, h, h / 2);
  ctx.fill();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = DC.green;
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
    ctx.fillStyle = DC.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 20 + ctx.measureText(it.label).width;
  });
}

// Shared animation hook: one rAF loop per Canvas, paused off-screen, fed by an
// absolute clock so several Canvases (e.g. the Hero pair) stay in sync.
export function useDcCanvas(
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

// A trivial registered widget so the kit is assembler-valid; it is never rendered.
export const DcKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;
export default DcKit;
