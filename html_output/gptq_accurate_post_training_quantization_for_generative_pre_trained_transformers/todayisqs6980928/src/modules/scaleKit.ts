// 共享 Canvas 绘图工具 —— 天平/砝码 隐喻
// 所有纸面专属 widget 复用这一套绘图原语，保持整篇教程的视觉连续性。
// 语义色（contract.md §5）：红=失败/旧方法，绿=成功/本文方法，蓝=引导/当前，橙=强调，紫=辅助。

export const C = {
  bg: '#f5f8f0',
  envLight: '#b8c9a7',
  envDark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 平静场景背景
export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}

// 底座/桌面
export function drawTable(ctx: CanvasRenderingContext2D, w: number, h: number, topY: number) {
  ctx.fillStyle = C.envLight;
  ctx.fillRect(0, topY, w, h - topY);
  ctx.fillStyle = C.envDark;
  ctx.fillRect(0, topY, w, 6);
}

// 天平：cx 支点横坐标，tilt 为倾斜角（弧度，正=右倾）
export function drawScale(
  ctx: CanvasRenderingContext2D,
  cx: number,
  fulcrumY: number,
  beamLen: number,
  tilt: number,
  beamColor: string
) {
  const leftX = cx - Math.cos(tilt) * beamLen;
  const leftY = fulcrumY + Math.sin(tilt) * beamLen;
  const rightX = cx + Math.cos(tilt) * beamLen;
  const rightY = fulcrumY - Math.sin(tilt) * beamLen;

  // 支架（支点柱）
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, fulcrumY);
  ctx.lineTo(cx, fulcrumY + 46);
  ctx.stroke();

  // 横梁
  ctx.strokeStyle = beamColor;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.stroke();

  // 支点三角
  ctx.fillStyle = C.support;
  ctx.beginPath();
  ctx.moveTo(cx - 8, fulcrumY);
  ctx.lineTo(cx + 8, fulcrumY);
  ctx.lineTo(cx, fulcrumY + 14);
  ctx.closePath();
  ctx.fill();

  // 两侧吊绳 + 秤盘
  drawPan(ctx, leftX, leftY);
  drawPan(ctx, rightX, rightY);

  return { leftX, leftY, rightX, rightY };
}

export function drawPan(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const panY = y + 26;
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x - 16, panY);
  ctx.moveTo(x + 12, y);
  ctx.lineTo(x + 16, panY);
  ctx.stroke();
  ctx.fillStyle = C.envDark;
  ctx.beginPath();
  ctx.ellipse(x, panY + 4, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

// 砝码块
export function drawWeight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  roundRect(ctx, x - w / 2, y - h, w, h, 3);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - w / 2, y - h, w, h, 3);
  ctx.stroke();
}

// 目标/平衡标记（水平基准线）
export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x + 20, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

// 短标签（Canvas 内最多 2 条、每条 ≤8 字）
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 20
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// 数值（裸数字，不带前缀）
export function drawNumber(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color: string,
  size = 30
) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}
