// Shared editorial-proofreading drawing kit for the ResNet tutorial (packet p1).
// Export const kitP1 so assemble-chapter-packets.js can copy this file into
// src/modules/kit-p1.ts; widget files import these helpers from './kit-p1'.

export const C = {
  scene: '#f5f8f0',
  paper: '#faf6ef',
  paperLine: '#e8dfc8',
  white: '#fffdf7',
  ink: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  pencil: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.scene;
  ctx.fillRect(0, 0, w, h);
  // faint ruled lines on the lower half
  ctx.strokeStyle = C.paperLine;
  ctx.lineWidth = 1;
  const y0 = Math.round(h * 0.45);
  for (let y = y0; y < h; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

export function drawPage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pw: number,
  ph: number,
  tilt = 0
) {
  ctx.save();
  ctx.translate(x + pw / 2, y + ph / 2);
  ctx.rotate(tilt);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
  ctx.strokeStyle = C.paperLine;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-pw / 2 + 8, -ph / 2 + i * (ph / 4));
    ctx.lineTo(pw / 2 - 8, -ph / 2 + i * (ph / 4));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color = C.pencil,
  len = 26
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.fillRect(0, -2.5, len - 5, 5);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(len - 5, -2.5);
  ctx.lineTo(len + 3, 0);
  ctx.lineTo(len - 5, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw n "text lines" whose legibility shrinks with clarity (1 clean .. 0 garbled). */
export function drawTextLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lineW: number,
  nLines: number,
  clarity: number,
  color = C.ink
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const jitter = (1 - clarity) * 3;
  for (let i = 0; i < nLines; i++) {
    const ly = y + i * 11;
    const dx = (Math.sin(i * 2.7 + clarity * 20) * jitter) % 1;
    ctx.beginPath();
    ctx.moveTo(x + dx, ly);
    ctx.lineTo(x + lineW + dx, ly);
    ctx.stroke();
    if (clarity < 0.6) {
      ctx.beginPath();
      ctx.moveTo(x + 4, ly + 4);
      ctx.lineTo(x + lineW * 0.6 + 4, ly + 4);
      ctx.stroke();
    }
  }
}

export type MarkKind = 'under' | 'circle' | 'caret' | 'note';

export function drawMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: MarkKind,
  color = C.red,
  size = 16
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (kind === 'under') {
    ctx.beginPath();
    ctx.moveTo(x - size / 2, y);
    ctx.lineTo(x + size / 2, y);
    ctx.stroke();
  } else if (kind === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, size / 2.4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'caret') {
    ctx.beginPath();
    ctx.moveTo(x - size / 2, y);
    ctx.lineTo(x, y - size / 2);
    ctx.lineTo(x + size / 2, y);
    ctx.stroke();
  } else {
    ctx.fillRect(x - size / 2, y - size / 2, size, size * 0.7);
  }
}

export function drawTargetStamp(ctx: CanvasRenderingContext2D, x: number, y: number, r = 11) {
  ctx.save();
  ctx.strokeStyle = C.green;
  ctx.fillStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', x, y + 0.5);
  ctx.restore();
}

export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.ink,
  align: CanvasTextAlign = 'left'
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; label: string }[],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  let cx = x;
  for (const it of items) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 4, 10, 8);
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText(it.label, cx + 14, y);
    cx += 14 + ctx.measureText(it.label).width + 14;
  }
  ctx.restore();
}

export const kitP1 = {
  C,
  clearScene,
  drawPage,
  drawPen,
  drawTextLines,
  drawMark,
  drawTargetStamp,
  drawSceneLabel,
  drawLegend,
};
