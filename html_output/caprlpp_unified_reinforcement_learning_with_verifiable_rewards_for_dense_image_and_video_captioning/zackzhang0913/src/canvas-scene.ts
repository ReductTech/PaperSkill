// 你说我猜 —— 教程统一 Canvas 绘制工具（各 widget 共用，只读不改框架文件）。
// 语义配色固定：红=失败/旧方法，绿=成功/本文方法，蓝=引导/当前，橙=学员强调，紫=辅助项。
export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  frame: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

export function gameField(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, h - 18, w, 18);
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h - 18);
  ctx.lineTo(w, h - 18);
  ctx.stroke();
}

/** 图片卡：mode = 'clean' | 'blurry' | 'tiny' */
export function drawPictureCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  mode: 'clean' | 'blurry' | 'tiny' = 'clean'
) {
  const w = s;
  const h = s * 0.72;
  ctx.save();
  ctx.globalAlpha = mode === 'blurry' ? 0.35 : 1;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.frame;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  // 画面示意：天空块 + 地面块 + 主体块
  ctx.fillStyle = C.light;
  ctx.fillRect(x + 4, y + 4, w - 8, h * 0.42);
  ctx.fillStyle = C.dark;
  ctx.fillRect(x + 4, y + h * 0.54, w - 8, h * 0.4);
  ctx.fillStyle = mode === 'tiny' ? C.muted : C.blue;
  const bw = mode === 'tiny' ? w * 0.16 : w * 0.3;
  ctx.fillRect(x + w * 0.34, y + h * 0.34, bw, h * 0.34);
  ctx.restore();
}

export function drawDescriber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.72, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y);
  ctx.lineTo(x + s * 0.3, y);
  ctx.lineTo(x + s * 0.22, y - s * 0.42);
  ctx.lineTo(x - s * 0.22, y - s * 0.42);
  ctx.closePath();
  ctx.fill();
  // 粉笔
  ctx.strokeStyle = C.frame;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, y - s * 0.3);
  ctx.lineTo(x + s * 0.5, y - s * 0.62);
  ctx.stroke();
  ctx.restore();
}

export function drawGuesser(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.72, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y);
  ctx.lineTo(x + s * 0.3, y);
  ctx.lineTo(x + s * 0.22, y - s * 0.42);
  ctx.lineTo(x - s * 0.22, y - s * 0.42);
  ctx.closePath();
  ctx.fill();
  // 眼罩
  ctx.fillStyle = C.red;
  ctx.fillRect(x - s * 0.24, y - s * 0.82, s * 0.48, s * 0.16);
  // 手里的题卡
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x + s * 0.3, y - s * 0.56, s * 0.24, s * 0.3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** 题板卡：state = 'idle' | 'right' | 'wrong' */
export function drawQuestionCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  state: 'idle' | 'right' | 'wrong' = 'idle'
) {
  const w = s;
  const h = s * 0.62;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = state === 'right' ? C.green : state === 'wrong' ? C.red : C.axis;
  ctx.lineWidth = state === 'idle' ? 2 : 3;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  // 四个选项条
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = state === 'idle' ? C.axis : C.muted;
    ctx.fillRect(x + s * 0.12, y + h * (0.2 + i * 0.19), s * (i === 0 ? 0.5 : i === 1 ? 0.4 : 0.32), 3);
  }
  if (state === 'right') {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.72, y + h * 0.5);
    ctx.lineTo(x + w * 0.8, y + h * 0.64);
    ctx.lineTo(x + w * 0.94, y + h * 0.34);
    ctx.stroke();
  } else if (state === 'wrong') {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.74, y + h * 0.36);
    ctx.lineTo(x + w * 0.92, y + h * 0.58);
    ctx.moveTo(x + w * 0.92, y + h * 0.36);
    ctx.lineTo(x + w * 0.74, y + h * 0.58);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cells: number
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.frame;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  const gap = 8;
  const cw = (w - gap * (cells + 1)) / cells;
  const ch = h - gap * 2;
  for (let i = 0; i < cells; i++) {
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x + gap + i * (cw + gap), y + gap, cw, ch);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawScoreCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  filled: boolean,
  color = C.green
) {
  ctx.save();
  ctx.fillStyle = filled ? color : 'transparent';
  ctx.strokeStyle = filled ? color : C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x, y, s, s);
  if (filled) ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** 沙漏：f = 1 表示上半部满是沙（预算充足），f = 0 表示漏空。
 *  只画玻璃轮廓 + 上半部沙面线，避免出现失真的三角形状。 */
export function drawHourglass(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, fill: number) {
  const f = Math.max(0, Math.min(1, fill));
  const cx = x + s * 0.5;
  const halfAt = (yy: number) => Math.max(0, (s * 0.5) * (1 - Math.abs(yy - (y + s * 0.5)) / (s * 0.5)));
  ctx.save();
  // 玻璃轮廓
  ctx.strokeStyle = C.frame;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s, y);
  ctx.lineTo(cx, y + s * 0.5);
  ctx.lineTo(x + s, y + s);
  ctx.lineTo(x, y + s);
  ctx.lineTo(cx, y + s * 0.5);
  ctx.closePath();
  ctx.stroke();
  // 上半部沙面：f 从 1 到 0，沙面从上方移到腰口
  const col = f > 0.5 ? C.green : f > 0 ? C.orange : C.red;
  const sandY = y + s * 0.06 + s * 0.4 * (1 - f);
  const hw = halfAt(sandY) - 2;
  if (f > 0 && hw > 1) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - hw, sandY);
    ctx.lineTo(cx + hw, sandY);
    ctx.stroke();
  }
  // 下半部的堆积沙堆：与 f 相反，越空堆得越高
  const pileH = s * 0.22 + s * 0.2 * (1 - f);
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, y + s * 0.94);
  ctx.lineTo(cx + s * 0.3, y + s * 0.94);
  ctx.lineTo(cx, y + s * 0.94 - pileH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawTimeBadge(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, label: string) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, s, s * 0.5, 6) : ctx.rect(x, y, s, s * 0.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.purple;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + s / 2, y + s * 0.25);
  ctx.restore();
}

/** 「总选 A」的位置偏好硬币 */
export function drawBiasCoin(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, face: string) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.red;
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(face, x, y + 1);
  ctx.restore();
}

export function drawCurveAxis(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  for (let i = 0; i <= 4; i++) {
    const gy = y + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCurve(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  color: string,
  width = 3,
  dashed = false
) {
  if (pts.length === 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

export function drawBars(
  ctx: CanvasRenderingContext2D,
  items: { y: number; w: number; h: number; value: number; max: number; color: string }[]
) {
  for (const it of items) {
    ctx.save();
    ctx.fillStyle = it.color;
    const bw = it.max === 0 ? 0 : Math.max(2, (it.value / it.max) * it.w);
    ctx.fillRect(it.w - bw, it.y, bw, it.h);
    ctx.restore();
  }
}

/** 从左端向右生长的对比条（用于结果赛跑与对比条） */
export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = C.axis;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
  ctx.restore();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 16
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = size + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '15px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  for (const it of items.slice(0, 3)) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 5, 14, 10);
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 20, y);
    cx += 26 + ctx.measureText(it.label).width;
  }
  ctx.restore();
}
