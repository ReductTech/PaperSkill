// 共享 Canvas 技术绘图工具（SVDQuant 教程）
// 只画「论文技术图形」：量化桶、奇异值谱、误差曲线、指标条形、数据点。
// 语义色来自 contract.md §5：红=失败/旧方法，绿=成功/本文方法，蓝=引导/当前，橙=强调，紫=辅助。

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

// 论文关键数字（锚定 arXiv:2411.05007，已在卡片核对）
export const FACTS = {
  rank4bit: 32, // 4-bit 默认秩（8-bit 用 16）
  rank8bit: 16,
  int4Group: 64, // INT4 group size（源码硬编码）
  nvfp4Group: 16, // NVFP4 group size（源码硬编码）
  flopsRatio: '约 1.5%', // 低秩分支额外乘加占比（博客复算）
  overheadNaive: '约 50%', // 朴素低秩分支延迟开销（Section 4.3）
  overheadFused: '5–10%', // Nunchaku 融合后开销
  sizeReduction: '3.6×', // 模型体积压缩（Fig.8）
  memReduction: '3.5×', // 显存下降
  speedupInt4: '3.0×', // INT4 4090 vs NF4 W4A16
  speedupNvfp4: '3.1×', // NVFP4 5090
  speedupLaptop: '10.1×', // 笔记本 4090 含消除 CPU 卸载
} as const;

// 奇异值谱（解释性合成数据，非论文实测）：前几个大奇异值拿走大部分能量
export const SIGMAS = [160, 120, 80, 55, 40, 30, 24, 20, 17, 15, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4];

export function tailRatio(r: number): number {
  const tail = SIGMAS.slice(r).reduce((a, b) => a + b * b, 0);
  const total = SIGMAS.reduce((a, b) => a + b * b, 0);
  return tail / total;
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
  ctx.moveTo(16, h - 22);
  ctx.lineTo(w - 16, h - 22);
  ctx.stroke();
}

// 白色技术内嵌面板（放曲线/谱/条形，带边框）
export function inset(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
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
