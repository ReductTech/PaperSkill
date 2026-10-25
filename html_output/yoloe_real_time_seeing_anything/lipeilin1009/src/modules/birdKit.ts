// birdKit.ts — YOLOE 教程共享绘制库（观鸟主题）
// 由协调者统一维护；所有 widget 从这里取色与绘制基元，保证全教程视觉一致。

export const PALETTE = {
  bg: '#f5f8f0',
  treeLight: '#b8c9a7',
  treeDark: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
} as const;

/** 安静场景底：底色 + 地平线 + 右上角带叶树枝 */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = PALETTE.treeLight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h - 28);
  ctx.lineTo(w, h - 28);
  ctx.stroke();
  // 右上角一段带叶子的树枝
  ctx.save();
  ctx.strokeStyle = PALETTE.treeDark;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w - 4, 26);
  ctx.quadraticCurveTo(w - 50, 36, w - 96, 30);
  ctx.stroke();
  // 小分叉
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w - 52, 33);
  ctx.quadraticCurveTo(w - 62, 24, w - 74, 20);
  ctx.stroke();
  // 三片叶子
  const leaf = (lx: number, ly: number, rot: number) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = PALETTE.treeLight;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  leaf(w - 30, 20, -0.5);
  leaf(w - 66, 40, 0.6);
  leaf(w - 92, 23, -0.2);
  ctx.restore();
}

/** 观鸟者剪影（蹲姿，面向右） */
export function drawBirder(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = PALETTE.ink) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  // 头
  ctx.beginPath();
  ctx.arc(x, y - 34, 7, 0, Math.PI * 2);
  ctx.fill();
  // 身体
  ctx.beginPath();
  ctx.moveTo(x, y - 27);
  ctx.lineTo(x - 2, y - 12);
  ctx.stroke();
  // 腿（蹲）
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 12);
  ctx.lineTo(x - 12, y);
  ctx.moveTo(x - 2, y - 12);
  ctx.lineTo(x + 8, y);
  ctx.stroke();
  // 手臂前伸（持物姿势）
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 22);
  ctx.lineTo(x + 12, y - 18);
  ctx.stroke();
  ctx.restore();
}

export type BirdState = 'plain' | 'unknown' | 'known' | 'named';

/** 小鸟：圆身 + 三角喙 + 摆尾；state 控制头顶标记 */
export function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  opts: { state?: BirdState; body?: string; label?: string } = {}
) {
  const { state = 'plain', body = PALETTE.treeDark, label } = opts;
  const flap = Math.sin(t * 6) * 2;
  ctx.save();
  // 身体
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, y, 9, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // 头
  ctx.beginPath();
  ctx.arc(x + 8, y - 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // 喙
  ctx.fillStyle = PALETTE.orange;
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 6);
  ctx.lineTo(x + 17, y - 4);
  ctx.lineTo(x + 12, y - 3);
  ctx.closePath();
  ctx.fill();
  // 尾羽（摆动）
  ctx.strokeStyle = body;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x - 15, y - 3 + flap);
  ctx.moveTo(x - 8, y + 1);
  ctx.lineTo(x - 15, y + 4 + flap);
  ctx.stroke();
  // 头顶标记
  if (state === 'unknown') {
    ctx.fillStyle = PALETTE.red;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('?', x - 3, y - 16);
  } else if (state === 'known') {
    ctx.strokeStyle = PALETTE.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 16);
    ctx.lineTo(x - 1, y - 11);
    ctx.lineTo(x + 7, y - 20);
    ctx.stroke();
  } else if (state === 'named' && label) {
    ctx.fillStyle = PALETTE.green;
    ctx.font = '11px sans-serif';
    const w = ctx.measureText(label).width + 8;
    ctx.fillRect(x - w / 2, y - 28, w, 14);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x - w / 2 + 4, y - 17);
  }
  ctx.restore();
}

/** 图鉴：厚度与开合可变，页角可翻动 */
export function drawBook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  opts: { open?: boolean; thick?: number; flip?: boolean; glow?: string } = {}
) {
  const { open = true, thick = 1, flip = false, glow } = opts;
  const w = 34;
  const h = 24;
  ctx.save();
  if (glow) {
    ctx.strokeStyle = glow;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - w / 2 - 2, y - h - 2, w + 4, h + 6);
  }
  // 封面
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(x - w / 2, y - h, w, h + 4 * thick);
  // 内页
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - w / 2 + 3, y - h + 3, w - 6, h + 4 * thick - 6);
  if (open) {
    ctx.strokeStyle = PALETTE.muted;
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 6, y - h + 5 + i * 5);
      ctx.lineTo(x + w / 2 - 6, y - h + 5 + i * 5);
      ctx.stroke();
    }
    if (flip) {
      const a = (Math.sin(t * 4) + 1) / 2;
      ctx.strokeStyle = PALETTE.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 8, y - h + 4);
      ctx.quadraticCurveTo(x + w / 2 - 8 - 14 * a, y - h - 6 * a, x + w / 2 - 22 * a - 2, y - h + 6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** 观察卡片：白底 + 若干行"字迹" */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: { lines?: number; w?: number; h?: number; glow?: string } = {}
) {
  const { lines = 3, w = 30, h = 22, glow } = opts;
  ctx.save();
  if (glow) {
    ctx.strokeStyle = glow;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - w / 2 - 2, y - 2, w + 4, h + 4);
  }
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = PALETTE.border;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.strokeRect(x - w / 2, y, w, h);
  ctx.strokeStyle = PALETTE.blue;
  ctx.lineWidth = 2;
  for (let i = 0; i < lines; i++) {
    const lw = w - 10 - (i === lines - 1 ? 8 : 0);
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 5, y + 6 + i * 5.5);
    ctx.lineTo(x - w / 2 + 5 + lw, y + 6 + i * 5.5);
    ctx.stroke();
  }
  ctx.restore();
}

/** 小旗标记 */
export function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = PALETTE.orange) {
  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x + 10, y - 12);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 望远镜（可旋转 angle 弧度） */
export function drawScope(ctx: CanvasRenderingContext2D, x: number, y: number, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(-4, -6, 26, 12);
  ctx.fillStyle = PALETTE.blue;
  ctx.fillRect(18, -7, 6, 14);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(-8, -5, 5, 10);
  ctx.restore();
}

/** 场景标签（画布内短标签，≤8 字） */
export function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string = PALETTE.ink) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '12px sans-serif';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** 图例（≤3 项） */
export function drawLegend(ctx: CanvasRenderingContext2D, items: { color: string; text: string }[], x: number, y: number) {
  ctx.save();
  ctx.font = '11px sans-serif';
  items.forEach((it, i) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(x, y + i * 16 - 8, 10, 10);
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(it.text, x + 14, y + i * 16 + 1);
  });
  ctx.restore();
}

/** 白色 inset 面板（#d7deea 边框） */
export function insetBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = PALETTE.border;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/** 水平条形（裸数值可选） */
export function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string,
  valueLabel?: string
) {
  ctx.save();
  ctx.fillStyle = '#eef2f7';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  if (valueLabel) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '13px sans-serif';
    ctx.fillText(valueLabel, x + w + 8, y + h - 2);
  }
  ctx.restore();
}
