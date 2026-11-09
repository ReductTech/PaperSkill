// CaSSLe 教程共享 Canvas 绘图套件：乐队换琴 · 移调合奏。
// 所有类比动画、Hero 与交互模块复用这里的颜色与图元，保证视觉与语义一致。

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

export type NodeState = 'idle' | 'active' | 'frozen' | 'success' | 'error';

export function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 8
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: string,
  stroke?: string,
  r = 8
): void {
  rounded(ctx, x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function inset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  drawBox(ctx, x, y, w, h, C.white, C.border, 10);
}

export function label(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size = 14,
  color = C.ink,
  align: CanvasTextAlign = 'left'
): void {
  ctx.save();
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.light;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, h - 8, w, 8);
  ctx.globalAlpha = 1;
}

export function drawStaff(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color = C.light
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * 8);
    ctx.lineTo(x + w, y + i * 8);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = C.wood,
  width = 2,
  head = 8
): void {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
  ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawNeck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  drawBox(ctx, x, y, w, h, '#e7d6b8', C.wood, 6);
  ctx.save();
  ctx.strokeStyle = C.wood;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  for (let i = 1; i < 8; i++) {
    const gx = x + (w * i) / 8;
    ctx.beginPath();
    ctx.moveTo(gx, y + 3);
    ctx.lineTo(gx, y + h - 3);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGuitar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { color?: string; active?: boolean } = {}
): void {
  const bodyColor = opts.color || '#d9b483';
  const cx = x + h * 0.62;
  const cy = y + h / 2;
  const r = h * 0.44;
  ctx.save();
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.05, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.85, cy, r * 0.68, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.bg;
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.2, cy, r * 0.26, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  const neckX = cx + r * 1.2;
  const neckW = Math.max(60, x + w - neckX);
  drawNeck(ctx, neckX, cy - h * 0.16, neckW, h * 0.32);
  ctx.save();
  ctx.strokeStyle = opts.active ? C.blue : C.muted;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.3, cy - 6 + i * 6);
    ctx.lineTo(neckX + neckW, cy - 6 + i * 6);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTuningFork(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  ring = 0
): void {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 6 * s, y - 22 * s);
  ctx.lineTo(x - 6 * s, y + 4 * s);
  ctx.quadraticCurveTo(x - 6 * s, y + 12 * s, x, y + 12 * s);
  ctx.quadraticCurveTo(x + 6 * s, y + 12 * s, x + 6 * s, y + 4 * s);
  ctx.lineTo(x + 6 * s, y - 22 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + 12 * s);
  ctx.lineTo(x, y + 26 * s);
  ctx.stroke();
  if (ring > 0) {
    ctx.strokeStyle = C.green;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(x, y - 10 * s, (10 + i * 9 + ring * 5) * s, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 10 * s, (10 + i * 9 + ring * 5) * s, Math.PI - 0.9, Math.PI + 0.9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  amp: number,
  phase: number,
  color: string,
  width = 2
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let i = 0; i <= w; i += 3) {
    const yy = y + Math.sin(i / 22 + phase) * amp * Math.sin((i / w) * Math.PI);
    if (i === 0) ctx.moveTo(x + i, yy);
    else ctx.lineTo(x + i, yy);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawCapo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color = C.orange
): void {
  drawBox(ctx, x, y - 10, w, 20, color, C.wood, 5);
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x + 5, y, 3, 0, Math.PI * 2);
  ctx.arc(x + w - 5, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawTape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  active: boolean
): void {
  drawBox(ctx, x, y, w, h, active ? '#eef2ea' : '#eceff2', active ? C.dark : C.border, 8);
  ctx.save();
  for (const rx of [x + 16, x + w - 16]) {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = active ? C.dark : C.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rx, y + h / 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  drawWave(ctx, x + 32, y + h / 2, w - 64, active ? 7 : 3, 0, active ? C.dark : C.muted, 2);
}

export function drawPitchMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + 9);
  ctx.lineTo(x - 8, y - 7);
  ctx.lineTo(x + 8, y - 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  state: NodeState = 'idle'
): void {
  const stroke =
    state === 'active' ? C.blue : state === 'success' ? C.green : state === 'error' ? C.red : state === 'frozen' ? C.muted : C.border;
  const fill = state === 'frozen' ? '#eceff2' : state === 'success' ? '#edf7f1' : C.white;
  drawBox(ctx, x, y, w, h, fill, stroke, 9);
  ctx.save();
  if (state === 'active' || state === 'success') {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = stroke;
    rounded(ctx, x, y, w, h, 9);
    ctx.stroke();
  }
  ctx.restore();
  label(ctx, text, x + w / 2, y + h / 2, 14, state === 'frozen' ? C.muted : C.ink, 'center');
}

export function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  v: number,
  max: number,
  color: string,
  valueText?: string
): void {
  const ratio = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
  drawBox(ctx, x, y, w, h, '#e9eeea', C.border, 5);
  drawBox(ctx, x, y, Math.max(2, w * ratio), h, color, undefined, 5);
  if (valueText !== undefined) label(ctx, valueText, x + w + 10, y + h / 2, 14, C.ink);
}

export function vbar(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  w: number,
  maxH: number,
  v: number,
  max: number,
  color: string,
  valueText?: string
): void {
  const ratio = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
  const hh = Math.max(2, maxH * ratio);
  drawBox(ctx, x, baseY - hh, w, hh, color, undefined, 5);
  if (valueText !== undefined) label(ctx, valueText, x + w / 2, baseY - hh - 14, 14, C.ink, 'center');
}

export function legend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { text: string; color: string }[]
): void {
  let cx = x;
  for (const it of items.slice(0, 3)) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 6, 12, 12);
    label(ctx, it.text, cx + 18, y, 13, C.muted);
    cx += 26 + it.text.length * 14;
  }
}

/* ---------- 直接操纵类图元：旋钮、裁剪框、播放头、卡片、琴弦 ---------- */

/** 旋钮：圆盘 + 档位刻度 + 指针，active 为当前吸附档位。 */
export function drawKnob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  tickCount = 4,
  active = 0
): void {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const start = -Math.PI * 0.75;
  const span = Math.PI * 1.5;
  for (let i = 0; i < tickCount; i++) {
    const a = start + (span * i) / Math.max(1, tickCount - 1);
    ctx.strokeStyle = i === active ? C.orange : C.light;
    ctx.lineWidth = i === active ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r + 8));
    ctx.lineTo(cx + Math.cos(a) * (r + 16), cy + Math.sin(a) * (r + 16));
    ctx.stroke();
  }
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * (r - 8), cy + Math.sin(angle) * (r - 8));
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 裁剪框：虚线框 + 四角手柄 + 中心十字。 */
export function drawCropBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color = C.orange,
  active = true
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = active ? 2.5 : 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  const s = 7;
  ctx.fillStyle = color;
  [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ].forEach(([hx, hy]) => {
    ctx.fillRect(hx - s / 2, hy - s / 2, s, s);
  });
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 8, y + h / 2);
  ctx.lineTo(x + w / 2 + 8, y + h / 2);
  ctx.moveTo(x + w / 2, y + h / 2 - 8);
  ctx.lineTo(x + w / 2, y + h / 2 + 8);
  ctx.stroke();
  ctx.restore();
}

/** 时间轴播放头：竖线 + 顶部圆点。 */
export function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y1: number,
  y2: number,
  color = C.orange
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y1, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 可拖动卡片：圆角矩形 + 居中短标题。state 决定描边色。 */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  state: 'idle' | 'drag' | 'ok' | 'bad' = 'idle'
): void {
  const stroke =
    state === 'drag' ? C.orange : state === 'ok' ? C.green : state === 'bad' ? C.red : C.border;
  const fill = state === 'ok' ? '#edf7f1' : state === 'bad' ? '#fdeef0' : C.white;
  ctx.save();
  ctx.shadowColor = 'rgba(25,42,70,0.16)';
  ctx.shadowBlur = state === 'drag' ? 14 : 4;
  drawBox(ctx, x, y, w, h, fill, stroke, 10);
  ctx.restore();
  label(ctx, text, x + w / 2, y + h / 2, 14, C.ink, 'center');
}

/** 被拉弯的琴弦：两端固定，中间按 pull 偏移画二次曲线。 */
export function drawString(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  pullX: number,
  pullY: number,
  color: string,
  width = 2
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo(pullX, pullY, x2, y);
  ctx.stroke();
  ctx.restore();
}

/** 拖拽手柄：实心小圆 + 外圈。 */
export function drawGrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color = C.orange,
  r = 7
): void {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

