/** Shared agent-workbench drawing kit used by Hero, analogies, and modules. */
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const C = {
  bg: '#f3f6f8',
  light: '#bcc9d4',
  dark: '#526779',
  support: '#475569',
  blue: '#2563a6',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  page: '#f8fafc',
  page2: '#e8eef4',
  leather: '#334155',
  leather2: '#1e293b',
  desk: '#d8e0e7',
  desk2: '#c2ccd6',
  ink: '#334155',
};

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRR(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

export function strokeRR(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  width = 1.5
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f8fafc');
  g.addColorStop(1, C.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function drawDesk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const dh = Math.max(22, h * 0.18);
  const y = h - dh;
  const g = ctx.createLinearGradient(0, y, 0, h);
  g.addColorStop(0, C.desk);
  g.addColorStop(1, C.desk2);
  ctx.fillStyle = g;
  ctx.fillRect(0, y, w, dh);
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, y + 6 + i * (dh / 5));
    ctx.lineTo(w, y + 4 + i * (dh / 5));
    ctx.stroke();
  }
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.text,
  size = 12
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { c: string; t: string }[],
  x: number,
  y: number
) {
  items.forEach((it, i) => {
    ctx.fillStyle = it.c;
    ctx.beginPath();
    ctx.arc(x + 5, y + i * 16, 4, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(ctx, it.t, x + 14, y + i * 16 + 4, C.muted, 11);
  });
}

export function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  color: string
) {
  fillRR(ctx, x, y, w, h, 4, C.axis);
  const ww = Math.max(0, Math.min(1, t)) * w;
  if (ww > 1) fillRR(ctx, x, y, ww, h, 4, color);
}

export function drawInset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  fillRR(ctx, x, y, w, h, 8, '#ffffff');
  strokeRR(ctx, x, y, w, h, 8, C.axis, 1);
}

/** Active-context task board with optional low-value log fragments. */
export function drawJournal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  clutter = 0,
  planOpacity = 1
) {
  ctx.save();
  fillRR(ctx, x - 4, y - 4, w + 8, h + 8, 9, C.leather2);
  fillRR(ctx, x, y, w, h, 6, C.page);
  fillRR(ctx, x, y, w, 22, 6, C.leather);
  ctx.fillStyle = '#94a3b8';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + 11 + i * 12, y + 11, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 9px "Segoe UI", sans-serif';
  ctx.fillText('ACTIVE CONTEXT', x + 48, y + 14);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
  ctx.lineWidth = 1;
  const rows = Math.max(3, Math.floor((h - 24) / 20));
  for (let i = 1; i <= rows; i++) {
    const ly = y + 22 + i * ((h - 28) / (rows + 1));
    ctx.beginPath();
    ctx.moveTo(x + 12, ly);
    ctx.lineTo(x + w - 10, ly);
    ctx.stroke();
  }

  ctx.globalAlpha = Math.max(0, Math.min(1, planOpacity));
  ctx.fillStyle = C.ink;
  ctx.font = `bold ${Math.max(11, Math.min(14, h * 0.12))}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.fillText('当前目标', x + 16, y + 44);
  ctx.font = `${Math.max(10, Math.min(13, h * 0.1))}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.fillStyle = C.blue;
  ctx.fillText('约束  ·  状态  ·  下一步', x + 16, y + 64);
  ctx.globalAlpha = 1;

  const n = Math.round(Math.max(0, clutter) * 9);
  for (let i = 0; i < n; i++) {
    const rx = x + 20 + (i % 4) * (w * 0.18);
    const ry = y + 22 + Math.floor(i / 4) * 28 + (i % 3) * 3;
    drawReceipt(ctx, rx, ry, -0.22 + (i % 4) * 0.14, i);
  }
  ctx.restore();
}

/** Raw log / tool-output fragment that competes with active task state. */
export function drawReceipt(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, seed = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  fillRR(ctx, 0, 0, 58, 30, 3, seed % 2 ? '#eef2f7' : '#e2e8f0');
  ctx.fillStyle = C.red;
  ctx.globalAlpha = 0.72;
  ctx.fillRect(0, 0, 58, 6);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
  ctx.strokeRect(0, 0, 58, 30);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, 13);
  ctx.lineTo(46, 13);
  ctx.moveTo(6, 19);
  ctx.lineTo(42, 19);
  ctx.moveTo(6, 25);
  ctx.lineTo(30, 25);
  ctx.stroke();
  ctx.restore();
}

export type Pt = { x: number; y: number };

export function dist(a: Pt, b: Pt) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function pathLength(pts: Pt[]) {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += dist(pts[i - 1], pts[i]);
  return n;
}

export function pointAlong(pts: Pt[], t: number): Pt {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1 || t <= 0) return pts[0];
  const total = pathLength(pts);
  if (total <= 0) return pts[pts.length - 1];
  const target = total * Math.max(0, Math.min(1, t));
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (acc + d >= target || i === pts.length - 1) {
      const r = d === 0 ? 1 : Math.max(0, Math.min(1, (target - acc) / d));
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * r,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * r,
      };
    }
    acc += d;
  }
  return pts[pts.length - 1];
}

/** Draw a stroke that grows from the start of `pts` up to `progress` (0–1). Returns the pen tip. */
export function drawInkPath(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  progress: number,
  color = C.blue,
  width = 2.6
): Pt {
  const tip = pointAlong(pts, progress);
  if (pts.length < 2 || progress <= 0.002) return pts[0] ?? tip;
  const total = pathLength(pts);
  const target = total * Math.max(0, Math.min(1, progress));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (acc + d <= target + 0.02) {
      ctx.lineTo(pts[i].x, pts[i].y);
      acc += d;
    } else {
      const r = d === 0 ? 0 : (target - acc) / d;
      ctx.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * r, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * r);
      break;
    }
  }
  ctx.stroke();
  ctx.restore();
  return tip;
}

/** Wavy handwriting-like polyline, so a growing stroke reads as writing rather than a ruler. */
export function handwritingRow(x: number, y: number, w: number, seed = 0): Pt[] {
  const pts: Pt[] = [];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({
      x: x + t * w,
      y:
        y +
        Math.sin(t * Math.PI * 4 + seed) * 3.1 +
        Math.sin(t * Math.PI * 9 + seed * 1.7) * 1.15,
    });
  }
  return pts;
}

export function drawInkRows(
  ctx: CanvasRenderingContext2D,
  rows: { x: number; y: number; w: number }[],
  progress: number,
  color = C.blue,
  width = 2.5
): Pt {
  const all = rows.map((r, i) => handwritingRow(r.x, r.y, r.w, i * 1.8));
  const lens = all.map(pathLength);
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let remain = total * Math.max(0, Math.min(1, progress));
  let tip: Pt = all[0]?.[0] ?? { x: 0, y: 0 };
  for (let i = 0; i < all.length; i++) {
    if (remain <= 0) break;
    const local = Math.min(1, remain / Math.max(1, lens[i]));
    tip = drawInkPath(ctx, all[i], local, color, width);
    remain -= lens[i];
  }
  return tip;
}

export function checkPts(cx: number, cy: number): Pt[] {
  return [
    { x: cx - 5, y: cy },
    { x: cx - 1, y: cy + 5 },
    { x: cx + 8, y: cy - 6 },
  ];
}

/** Marching-ants connector so architecture / memory diagrams have a visible moving line. */
export function drawFlow(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  now: number,
  color = C.blue,
  width = 2.4,
  lift = 16
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash([10, 7]);
  ctx.lineDashOffset = -(now / 16);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo((from.x + to.x) / 2, (from.y + to.y) / 2 - lift, to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawPen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color = C.blue
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  fillRR(ctx, -28, -4, 42, 8, 3, color);
  fillRR(ctx, -34, -3, 8, 6, 2, C.support);
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(26, -4);
  ctx.lineTo(26, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.text;
  ctx.fillRect(24, -1, 4, 2);
  ctx.fillStyle = color;
  ctx.fillRect(-10, -6, 3, 4);
  ctx.restore();
}

export function drawRibbon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  active: boolean
) {
  ctx.fillStyle = active ? C.blue : '#8fa3b8';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 8, y);
  ctx.lineTo(x + 8, y + h);
  ctx.lineTo(x + 4, y + h + 8);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
}

export function drawStamp(ctx: CanvasRenderingContext2D, x: number, y: number, ok: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = ok ? C.green : C.muted;
  ctx.lineWidth = 2.2;
  roundRect(ctx, -22, -12, 44, 24, 6);
  ctx.stroke();
  ctx.fillStyle = ok ? C.green : C.muted;
  ctx.font = 'bold 9px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ok ? '已验证' : '待处理', 0, 0);
  ctx.restore();
}

export function drawPouch(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRR(ctx, x, y, 50, 34, 5, C.leather2);
  fillRR(ctx, x + 4, y + 5, 42, 24, 3, C.page2);
  ctx.strokeStyle = C.muted;
  ctx.strokeRect(x + 16, y + 12, 18, 7);
  drawLabel(ctx, 'ARCHIVE', x + 7, y - 5, C.muted, 8);
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  title: string,
  sub?: string
) {
  fillRR(ctx, x, y, w, h, 6, '#fffef8');
  strokeRR(ctx, x, y, w, h, 6, color, 2);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 6, h);
  drawLabel(ctx, title, x + 14, y + 18, color, 12);
  if (sub) drawLabel(ctx, sub, x + 14, y + 36, C.muted, 11);
}

/** rAF + off-screen pause helper so every widget shares the same loop contract. */
export function startLoop(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, now: number) => void
): () => void {
  let ctx: CanvasRenderingContext2D;
  try {
    ctx = setupCanvas(canvas, w, h);
  } catch {
    return () => undefined;
  }
  let raf = 0;
  const tick = (now: number) => {
    draw(ctx, now);
    canvas.classList.add('is-ready');
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const disconnect = observeCanvas(canvas, start, stop);
  return () => {
    stop();
    disconnect();
  };
}
