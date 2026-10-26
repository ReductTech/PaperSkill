// billiardsKit.ts — 台球隐喻的共享绘图工具包。纯 Canvas，无 React。
export const FIELD = '#f5f8f0';
export const CLOTH = '#b8c9a7';
export const CLOTH_DARK = '#76906a';
export const WOOD = '#92400e';
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
  const y = Math.round(h * 0.80);
  ctx.fillStyle = WOOD;
  ctx.fillRect(0, y, w, 4);
}

/** 台面：绿呢 + 木边 */
export function drawTable(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = WOOD;
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = CLOTH;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = CLOTH_DARK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  ring?: boolean
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (ring) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** 球杆：从 (x,y) 指向角度 angle，长度 len */
export function drawCue(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  len: number,
  color?: string
): void {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  ctx.strokeStyle = color || WOOD;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - dx * 8, y - dy * 8);
  ctx.lineTo(x - dx * len, y - dy * len);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(x - dx * 8, y - dy * 8);
  ctx.lineTo(x - dx * 14, y - dy * 14);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

/** 一条预测轨迹，pts 为 [x,y] 数组 */
export function drawShot(
  ctx: CanvasRenderingContext2D,
  pts: number[][],
  color: string,
  width: number,
  dash?: number[]
): void {
  if (pts.length < 2) return;
  ctx.save();
  if (dash) ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

/** 袋口 */
export function drawPocket(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** 档位条：n 格里填了 k 格 */
export function drawGauge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  n: number,
  k: number,
  color: string
): void {
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i < k ? color : LINE;
    ctx.fillRect(x + i * bw + 1, y, bw - 3, h);
  }
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
