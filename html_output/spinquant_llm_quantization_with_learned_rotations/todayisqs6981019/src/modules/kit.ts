// 共享 Canvas 技术绘图工具（SpinQuant 教程）
// 只画「论文技术图形」：尖峰直方图、旋转坐标框架、流形圆弧、网络管线、赛道条形。
// 语义色：红=失败/旧方法，绿=成功/本文方法，蓝=主路径/当前，橙=可拖拽/强调，紫=辅助机制。

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  white: '#ffffff',
} as const;

// 论文关键数字（锚定 arXiv:2405.16406v4：Table 1/3/4/5、§2.2 Figure 4、§4.2、附录 A.3；
// 标注 README 口径的数字来自官方 README，使用处必须带角标）
export const FACTS = {
  fp7b: 66.9,
  rtn7b: 37.1,
  gptq7b: 36.8,
  spin7b: 64.0,
  spinR7b: 56.0,
  spread13: 13,
  hadSpread: 6,
  kurtosisTarget: 3,
  gapW4A8: '12.1→1.6',
  improveRange: '2.0~28.6',
  quaroDrop70b: 33.2,
  cayleyIters: 100,
  calibMin: 128,
  fp70b: 72.9,
  gptq70b: 35.6,
  spin70b: 71.2,
  fp3: 69.6,
  gptq3: 40.5,
  spin3: 65.5,
} as const;

// 解释性合成数据（示意分布，非论文实测）：40 根柱，双端尖峰
export const SPIKES: number[] = [
  0.96, 0.78, 0.55, 0.36, 0.24, 0.16, 0.13, 0.17, 0.12, 0.1,
  0.15, 0.11, 0.09, 0.14, 0.1, 0.08, 0.12, 0.09, 0.11, 0.09,
  0.1, 0.08, 0.13, 0.1, 0.12, 0.09, 0.14, 0.11, 0.17, 0.12,
  0.1, 0.16, 0.13, 0.2, 0.3, 0.48, 0.72, 0.9, 0.82, 0.98,
];

// 摊平后的示意分布（旋转后的目标形态）
const FLAT_NOISE = [
  0.05, -0.04, 0.03, 0.06, -0.02, 0.01, -0.05, 0.04, 0.02, -0.03,
  0.05, -0.01, 0.03, -0.04, 0.02, 0.06, -0.03, 0.01, -0.05, 0.04,
  0.02, -0.02, 0.05, -0.03, 0.01, 0.04, -0.06, 0.03, -0.01, 0.02,
  0.05, -0.04, 0.02, 0.03, -0.02, 0.06, -0.03, 0.01, -0.04, 0.02,
];
export const FLAT: number[] = SPIKES.map((_, i) => 0.34 + FLAT_NOISE[i]);

export function kurtosisOf(bins: number[]): number {
  const n = bins.length;
  if (!n) return 0;
  const mean = bins.reduce((a, b) => a + b, 0) / n;
  const m2 = bins.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const m4 = bins.reduce((a, b) => a + (b - mean) ** 4, 0) / n;
  return m2 > 0 ? m4 / (m2 * m2) : 0;
}

// 固定种子伪随机（用于确定性散点）
export function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// 安静背景 + 地面线
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, h - 14);
  ctx.lineTo(w - 16, h - 14);
  ctx.stroke();
}

// 工程视图细网格背景
export function grid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  step = 28
): void {
  ctx.strokeStyle = 'rgba(118,144,106,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = x + step; gx < x + w; gx += step) {
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
  }
  for (let gy = y + step; gy < y + h; gy += step) {
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
  }
  ctx.stroke();
}

// 白色技术内嵌面板（放读数/小图，带边框）
export function inset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string = C.ink,
  size = 14,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// 圆角矩形
export function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string = C.axis,
  line = 1,
  r = 6
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = line;
  ctx.stroke();
}

// 带箭头连线（dash 传 [6,6] 画虚线）
export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  dash: number[] = []
): void {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = 6 + width * 1.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(ang) * head * 0.7, y2 - Math.sin(ang) * head * 0.7);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(ang - 0.45) * head, y2 - Math.sin(ang - 0.45) * head);
  ctx.lineTo(x2 - Math.cos(ang + 0.45) * head, y2 - Math.sin(ang + 0.45) * head);
  ctx.closePath();
  ctx.fill();
}

// 图内图例（≤3 项）
export function legend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number,
  size = 13
): void {
  let cx = x;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.textBaseline = 'middle';
  for (const it of items) {
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.arc(cx, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText(it.label, cx + 9, y);
    cx += 9 + ctx.measureText(it.label).width + 20;
  }
}

// 柱列直方图：bins 高度 0..1，间距 1px，圆角顶
export function hist(
  ctx: CanvasRenderingContext2D,
  bins: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  colorFor?: (i: number, v: number) => string | null
): void {
  const n = bins.length;
  const bw = Math.max(2, (w - (n - 1)) / n);
  bins.forEach((v, i) => {
    const bh = clamp(v, 0, 1) * h;
    if (bh <= 0.5) return;
    const bx = x + i * (bw + 1);
    const c = colorFor ? colorFor(i, v) : null;
    ctx.fillStyle = c || color;
    ctx.beginPath();
    ctx.roundRect(bx, y + h - bh, bw, bh, Math.min(3, bw / 2));
    ctx.fill();
  });
}

// 旋转坐标框架：方框 + 两条轴 + 角度弧
export function frame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  theta: number,
  color: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(theta);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(-r, -r, 2 * r, 2 * r);
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.4, 0, theta, false);
  ctx.stroke();
}
