// Lighthouse drawing kit — shared visual vocabulary for the whole tutorial.
// Every module and the analogy widget imports from here so the scene, palette and
// line weights stay identical across chapters. Pure Canvas 2D, no dependencies
// beyond ../lib/canvasKit.

import { clamp, lerp } from '../lib/canvasKit';

export const C = {
  bg: '#f5f8f0',
  seaShallow: '#b8c9a7',
  seaDeep: '#76906a',
  tower: '#92400e',
  beam: '#27446e',
  hit: '#228d5c',
  miss: '#c43f52',
  mark: '#f07e47',
  aux: '#7c3aed',
  ink: '#21324a',
  inkMuted: '#68778f',
  line: '#d7deea',
} as const;

export type ShipState = 'dark' | 'lit' | 'safe';

/** Quiet background field. */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}

/** Sea: shallow band on top, deep band below, hairline at the boundary. */
export function drawSea(ctx: CanvasRenderingContext2D, w: number, h: number, levelY: number): void {
  ctx.fillStyle = C.seaShallow;
  ctx.fillRect(0, levelY, w, h - levelY);
  ctx.fillStyle = C.seaDeep;
  ctx.fillRect(0, levelY + (h - levelY) * 0.45, w, h - levelY);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, levelY);
  ctx.lineTo(w, levelY);
  ctx.stroke();
}

/** Lighthouse body: tapered tower with a small lamp room on top. */
export function drawTower(ctx: CanvasRenderingContext2D, x: number, baseY: number, height: number): void {
  const topW = height * 0.16;
  const botW = height * 0.30;
  ctx.fillStyle = C.tower;
  ctx.beginPath();
  ctx.moveTo(x - botW / 2, baseY);
  ctx.lineTo(x + botW / 2, baseY);
  ctx.lineTo(x + topW / 2, baseY - height * 0.82);
  ctx.lineTo(x - topW / 2, baseY - height * 0.82);
  ctx.closePath();
  ctx.fill();
  // gallery + lamp room
  ctx.fillRect(x - topW * 0.75, baseY - height * 0.86, topW * 1.5, height * 0.04);
  ctx.fillStyle = '#5c3a08';
  ctx.fillRect(x - topW * 0.45, baseY - height, topW * 0.9, height * 0.14);
}

/** Lamp glow. `intensity` changes brightness only — never the beam spread. */
export function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number): void {
  const k = clamp(intensity, 0, 1);
  const r = lerp(5, 13, k);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
  g.addColorStop(0, `rgba(240,126,71,${0.55 + 0.4 * k})`);
  g.addColorStop(1, 'rgba(240,126,71,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f6b17a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Light beam as a wedge from the lamp. `spread` is the full angle in radians. */
export function drawBeam(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  angle: number,
  spread: number,
  reach: number,
  color: string = C.beam
): void {
  const a0 = angle - spread / 2;
  const a1 = angle + spread / 2;
  const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(angle) * reach, oy + Math.sin(angle) * reach);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, reach, a0, a1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + Math.cos(a0) * reach, oy + Math.sin(a0) * reach);
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + Math.cos(a1) * reach, oy + Math.sin(a1) * reach);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Small boat with a mast. `state` drives the outline colour. */
export function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, state: ShipState): void {
  const stroke = state === 'safe' ? C.hit : state === 'lit' ? C.beam : C.inkMuted;
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.fillStyle = state === 'dark' ? 'rgba(120,135,155,0.25)' : 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 15, y);
  ctx.lineTo(x + 15, y);
  ctx.lineTo(x + 10, y + 8);
  ctx.lineTo(x - 10, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x + 11, y - 8);
  ctx.lineTo(x, y - 2);
  ctx.closePath();
  ctx.fillStyle = stroke;
  ctx.globalAlpha = state === 'dark' ? 0.35 : 0.9;
  ctx.fill();
  ctx.restore();
}

/** Paper logbook with ruled rows. `badRowIndex` (0-based) is struck through in red. */
export function drawLogbook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: number,
  badRowIndex = -1
): void {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  const gap = h / (rows + 1);
  for (let i = 0; i < rows; i++) {
    const ry = y + gap * (i + 1);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, ry);
    ctx.lineTo(x + w - 8, ry);
    ctx.stroke();
    // text placeholder ticks
    ctx.fillStyle = C.inkMuted;
    const tw = i === badRowIndex ? w * 0.62 : w * (0.42 + 0.12 * ((i * 7) % 3));
    ctx.fillRect(x + 14, ry - 9, tw, 4);
    if (i === badRowIndex) {
      ctx.strokeStyle = C.miss;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x + 12, ry - 6);
      ctx.lineTo(x + 12 + tw, ry - 6);
      ctx.stroke();
    }
  }
}

/** Target marker: small green flag on a pole. */
export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = C.hit;
  ctx.fillStyle = C.hit;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 14, y - 15);
  ctx.lineTo(x, y - 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Short in-Canvas label (<= 6 Chinese chars). */
export function drawSceneLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.fillStyle = C.ink;
  ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.slice(0, 6), x, y);
}

/** Compact legend, at most 3 entries. */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; label: string }[]
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  items.slice(0, 3).forEach((it, i) => {
    const iy = y + i * 20;
    ctx.fillStyle = it.color;
    ctx.fillRect(x, iy - 5, 12, 10);
    ctx.fillStyle = C.inkMuted;
    ctx.fillText(it.label, x + 18, iy);
  });
}

export interface BarItem {
  label: string;
  value: number; // 0..1
  color: string;
  /** Render as "未测量" instead of a bar. */
  unknown?: boolean;
}

/** Compact technical evidence bars — the life scene's link to paper quantities. */
export function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  items: BarItem[]
): void {
  const rowH = 26;
  const labelW = 150;
  const barW = w - labelW - 56;
  ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  items.forEach((it, i) => {
    const ry = y + i * rowH;
    ctx.fillStyle = C.ink;
    ctx.fillText(it.label, x, ry);
    if (it.unknown) {
      ctx.fillStyle = C.inkMuted;
      ctx.fillText('未测量', x + labelW, ry);
      return;
    }
    ctx.fillStyle = C.line;
    ctx.fillRect(x + labelW, ry - 7, barW, 14);
    ctx.fillStyle = it.color;
    ctx.fillRect(x + labelW, ry - 7, barW * clamp(it.value, 0, 1), 14);
    ctx.fillStyle = C.ink;
    ctx.fillText(clamp(it.value, 0, 1).toFixed(2), x + labelW + barW + 10, ry);
  });
}

/** Rounded panel used for the synchronized before/after comparison and step nodes. */
export function panelStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  const r = 8;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.stroke();
}

/** Small step/node chip used by step-through modules. */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  state: 'done' | 'active' | 'todo' | 'skipped'
): void {
  const fill =
    state === 'done' ? 'rgba(34,141,92,0.14)' : state === 'active' ? 'rgba(39,68,110,0.16)' : 'rgba(215,222,234,0.35)';
  const stroke = state === 'skipped' ? C.miss : state === 'done' ? C.hit : state === 'active' ? C.beam : C.line;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = state === 'active' ? 2.6 : 1.6;
  ctx.beginPath();
  const r = 7;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = state === 'skipped' ? C.miss : C.ink;
  ctx.font = '15px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.textAlign = 'left';
}

/** Right-arrow between flow nodes. */
export function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string = C.inkMuted): void {
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
  ctx.lineTo(x2 - 8 * Math.cos(a - 0.4), y2 - 8 * Math.sin(a - 0.4));
  ctx.lineTo(x2 - 8 * Math.cos(a + 0.4), y2 - 8 * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
}
