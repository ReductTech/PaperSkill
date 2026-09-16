// 共享绘图套件（paper-specific）。
// 契约要求全站复用同一套 Canvas 视觉语言，因此所有类比动画与 Hero 都从这里取绘制函数，
// 避免各章各画一只"认不出的壶"。本文件只放绘图原语，不含任何动画状态。

export const SCENE = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  bean: '#6f4a2f',
  paper: '#efe7d8',
  ink: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
} as const;

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
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
}

/**
 * 手冲壶：椭圆壶身 + 壶盖 + 细长壶嘴 + 弧形把手。
 * tilt 为顺时针弧度；壶嘴朝旋转后的左上方向。返回壶嘴尖端坐标，便于接水流。
 */
export function drawKettle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  tilt: number,
  color: string = SCENE.blue
): { tipX: number; tipY: number } {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.66, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, -r * 0.62, r * 0.3, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.28);
  ctx.quadraticCurveTo(-r * 1.5, -r * 0.62, -r * 2.05, -r * 1.0);
  ctx.stroke();

  ctx.lineWidth = Math.max(2, r * 0.15);
  ctx.beginPath();
  ctx.arc(r * 0.88, -r * 0.04, r * 0.52, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();

  ctx.restore();

  const lx = -r * 2.05;
  const ly = -r * 1.0;
  return {
    tipX: cx + lx * Math.cos(tilt) - ly * Math.sin(tilt),
    tipY: cy + lx * Math.sin(tilt) + ly * Math.cos(tilt),
  };
}

/** 滤杯：外壁梯形 + 滤纸内衬。 */
export function drawDripper(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  botY: number,
  topW: number,
  botW: number
): void {
  ctx.fillStyle = SCENE.paper;
  ctx.beginPath();
  ctx.moveTo(cx - topW * 0.44, topY + 3);
  ctx.lineTo(cx + topW * 0.44, topY + 3);
  ctx.lineTo(cx + botW * 0.42, botY - 2);
  ctx.lineTo(cx - botW * 0.42, botY - 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = SCENE.support;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, topY);
  ctx.lineTo(cx + topW / 2, topY);
  ctx.lineTo(cx + botW / 2, botY);
  ctx.lineTo(cx - botW / 2, botY);
  ctx.closePath();
  ctx.stroke();
}

/**
 * 粉层：顶面高度由 topFn(u) 给出（u ∈ [0,1]，返回相对 baseY 的高度），
 * 并撒上颗粒纹理，让"粉"看起来是粉而不是一块色块。
 */
export function drawBed(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  halfW: number,
  topFn: (u: number) => number
): void {
  if (halfW < 3) return;
  ctx.fillStyle = SCENE.bean;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, baseY);
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    ctx.lineTo(cx - halfW + u * halfW * 2, baseY - topFn(u));
  }
  ctx.lineTo(cx + halfW, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  for (let i = 0; i < 22; i++) {
    const u = ((i * 37) % 100) / 100;
    const d = ((i * 61) % 9) / 9;
    ctx.fillRect(cx - halfW + u * halfW * 2, baseY - topFn(u) * (0.2 + d * 0.5), 1.5, 1.5);
  }
}

/** 分享壶（下方的杯）：空杯描边 + 可选液面。 */
export function drawSharePot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  halfW: number,
  height: number,
  liquid?: { ratio: number; color: string }
): void {
  const botHalf = halfW * 0.84;
  ctx.strokeStyle = SCENE.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, topY);
  ctx.lineTo(cx + halfW, topY);
  ctx.lineTo(cx + botHalf, topY + height);
  ctx.lineTo(cx - botHalf, topY + height);
  ctx.closePath();
  ctx.stroke();

  if (liquid && liquid.ratio > 0) {
    const lh = height * 0.82 * Math.max(0, Math.min(1, liquid.ratio));
    ctx.fillStyle = liquid.color;
    ctx.fillRect(cx - botHalf + 2, topY + height - lh, (botHalf - 2) * 2, lh);
  }
}

/** 台面：亮色台板 + 一条深色边线。 */
export function drawCounter(ctx: CanvasRenderingContext2D, w: number, y: number): void {
  ctx.fillStyle = SCENE.light;
  ctx.fillRect(0, y, w, 12);
  ctx.strokeStyle = SCENE.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
}

/** 水流：从壶嘴到目标点的曲线，lineWidth 表示水流粗细。 */
export function drawStream(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  width: number
): void {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo((fromX + toX) / 2, fromY + (toY - fromY) * 0.35, toX, toY);
  ctx.stroke();
}
