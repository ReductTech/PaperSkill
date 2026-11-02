// drivingKit.ts — 通用驾照隐喻的共享绘图工具包。纯 Canvas，无 React。
export const FIELD = '#f5f8f0';
export const ASPHALT = '#b8c9a7';
export const ASPHALT_DARK = '#76906a';
export const PAINT = '#92400e';
export const GUIDE = '#27446e';
export const OK = '#228d5c';
export const BAD = '#c43f52';
export const EMPH = '#f07e47';
export const AUX = '#7c3aed';
export const INK = '#21324a';
export const MUTED = '#68778f';
export const LINE = '#d7deea';

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, w, h);
}

/** 一段路面：灰绿地面 + 中线虚线 */
export function drawRoad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dashed?: boolean
): void {
  ctx.fillStyle = ASPHALT;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ASPHALT_DARK;
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y + h - 2, w, 2);
  if (dashed !== false) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 12]);
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** 车型：sedan / truck / van / bus / moto。scale 控制大小 */
export function drawVehicle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: string,
  scale: number,
  color?: string
): void {
  const s = scale;
  ctx.fillStyle = color || PAINT;
  if (kind === 'truck') {
    ctx.fillRect(x - 34 * s, y - 26 * s, 44 * s, 26 * s);
    ctx.fillRect(x + 10 * s, y - 18 * s, 22 * s, 18 * s);
  } else if (kind === 'bus') {
    ctx.fillRect(x - 44 * s, y - 30 * s, 88 * s, 30 * s);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 36 * s + i * 18 * s, y - 24 * s, 12 * s, 10 * s);
  } else if (kind === 'van') {
    ctx.fillRect(x - 28 * s, y - 24 * s, 56 * s, 24 * s);
    ctx.fillRect(x + 16 * s, y - 20 * s, 14 * s, 12 * s);
  } else if (kind === 'moto') {
    ctx.beginPath();
    ctx.arc(x - 12 * s, y - 6 * s, 6 * s, 0, Math.PI * 2);
    ctx.arc(x + 12 * s, y - 6 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 10 * s, y - 16 * s, 20 * s, 6 * s);
    return;
  } else {
    ctx.fillRect(x - 26 * s, y - 18 * s, 52 * s, 18 * s);
    ctx.beginPath();
    ctx.moveTo(x - 16 * s, y - 18 * s);
    ctx.lineTo(x - 8 * s, y - 28 * s);
    ctx.lineTo(x + 10 * s, y - 28 * s);
    ctx.lineTo(x + 18 * s, y - 18 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x - 18 * s, y - 2 * s, 5 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y - 2 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
}

/** 司机：简化的头 + 肩 */
export function drawDriver(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color?: string): void {
  const s = scale;
  ctx.fillStyle = color || GUIDE;
  ctx.beginPath();
  ctx.arc(x, y - 10 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 11 * s, y);
  ctx.lineTo(x + 11 * s, y);
  ctx.lineTo(x + 8 * s, y - 4 * s);
  ctx.lineTo(x - 8 * s, y - 4 * s);
  ctx.closePath();
  ctx.fill();
}

/** 驾照/格式印章：一个圆角矩形 + 两道横线，表示"统一标准" */
export function drawLicense(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color?: string): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color || GUIDE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = color || GUIDE;
  ctx.fillRect(x + 8, y + h * 0.28, w * 0.45, 3);
  ctx.fillRect(x + 8, y + h * 0.55, w * 0.65, 3);
}

/** 进度/容量条 */
export function drawGauge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string
): void {
  ctx.fillStyle = LINE;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
}

export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color?: string
): void {
  ctx.fillStyle = color || INK;
  ctx.font = '18px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

export interface LegendItem {
  color: string;
  text: string;
}

export function drawLegend(ctx: CanvasRenderingContext2D, items: LegendItem[], x: number, y: number): void {
  ctx.font = '15px ' + FONT;
  ctx.textAlign = 'left';
  let cx = x;
  for (const it of items.slice(0, 3)) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 9, 10, 10);
    ctx.fillStyle = MUTED;
    ctx.fillText(it.text, cx + 14, y);
    cx += 14 + ctx.measureText(it.text).width + 18;
  }
}

export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
