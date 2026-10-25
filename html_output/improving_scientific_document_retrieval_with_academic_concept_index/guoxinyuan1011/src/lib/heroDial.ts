// 封面「调台」双盘 —— Hero 左右两栏共用的绘制函数与色板。
//
// 左盘（broken）：无索引方法。六个查询指针依次弹出，全部挤在同一段刻度上；
//   三圈概念环被切成不等长碎片，另加散落短弧与孤立散点，读起来是「散架」。
// 右盘（完整）：本文方法。同一组指针铺满全盘；三环完整连续，内→外
//   依次为主题 / 短语 / 上下文，是索引的层次。
//
// 色板刻意避开红 #c43f52 与绿 #228d5c —— 这两个已被既有的「旧方法 / 本文方法」
// 语义占用，指针再用会读成「某根指针属于本文方法」。

import { easeOutCubic } from './canvasKit';

export const PIN_COLORS = [
  '#27446e',
  '#0e7490',
  '#7c3aed',
  '#f07e47',
  '#92400e',
  '#a16207',
];

export const RING_TOPIC = '#27446e';
export const RING_PHRASE = '#f07e47';
export const RING_CONTEXT = '#228d5c';
export const OLD_ACCENT = '#c43f52';

const PAPER = '#f5f8f0';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

/** 画布宽高比，两个 Hero 组件共用，保证两盘等高。 */
export const DIAL_ASPECT = 370 / 470;

export interface DialOpts {
  /** true = 左盘（破碎、低饱和）；false = 右盘（完整分层）。 */
  broken: boolean;
  /** 高亮扇区半宽（度）；0 表示不画扇区。 */
  sweep: number;
  /** 六根指针的角度，0 = 正上方，顺时针为正。 */
  angles: number[];
  legend: 'old' | 'new';
}

const D2R = Math.PI / 180;
const FRAG_ANGLES = [-70, -10, 48, 112, 176, 242];
const FRAG_ALPHA = [0.18, 0.14, 0.2, 0.13, 0.18, 0.15];
const DOTS: Array<[number, number]> = [
  [-40, 0.52],
  [-118, 0.75],
  [150, 0.8],
  [78, 0.62],
  [200, 0.68],
  [-8, 0.45],
  [-165, 0.55],
  [120, 0.72],
];

/** 把「0 = 正上、顺时针」的角度换算成 canvas 弧度。 */
function ang(deg: number): number {
  return (deg - 90) * D2R;
}

function ring(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  w: number,
  color: string,
  fade: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.globalAlpha = 0.92 * fade;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function brokenRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  w: number,
  dash: number[],
  offset: number,
  alpha: number,
  fade: number
): void {
  ctx.strokeStyle = `rgba(196,63,82,${alpha * fade})`;
  ctx.lineWidth = w;
  ctx.setLineDash(dash);
  ctx.lineDashOffset = offset;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}

function text(
  ctx: CanvasRenderingContext2D,
  content: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(content, x, y);
}

/**
 * 画一只表盘。`progress` 0→1 驱动六根指针依次弹出。
 * `fade` 只作用于盘面内容（扇区 / 刻度 / 环 / 指针 / 轴心），盘底与图例常驻，
 * 这样循环重播时不会露出底色方块。所有几何量都由 W/H 推导，窄视口下等比缩放。
 */
export function drawHeroDial(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: DialOpts,
  progress: number,
  fade: number = 1
): void {
  const r = Math.min(H * 0.42, W * 0.36);
  const cx = W / 2;
  const cy = r + H * 0.032;
  const tickR = r * 0.967;
  const outerR = r * 0.787;
  const midR = r * 0.613;
  const innerR = r * 0.44;
  const needleR = r * 0.84;
  const sectorR = r * 0.92;
  const ringW = Math.max(6, r * 0.073);
  const fs = Math.max(11, W * 0.026);

  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  if (opts.sweep > 0) {
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(196,63,82,0.10)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, sectorR, ang(-opts.sweep), ang(opts.sweep));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.globalAlpha = fade;
  ctx.setLineDash([3, 9]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = opts.broken ? 'rgba(196,63,82,0.22)' : AXIS;
  ctx.beginPath();
  ctx.arc(cx, cy, tickR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  if (opts.broken) {
    brokenRing(ctx, cx, cy, outerR, ringW, [r * 0.22, r * 0.116], 0, 0.3, fade);
    brokenRing(ctx, cx, cy, midR, ringW, [r * 0.142, r * 0.168], r * 0.09, 0.26, fade);
    brokenRing(ctx, cx, cy, innerR, ringW, [r * 0.258, r * 0.103], r * 0.052, 0.22, fade);
    FRAG_ANGLES.forEach((deg, i) => {
      ctx.strokeStyle = `rgba(196,63,82,${FRAG_ALPHA[i] * fade})`;
      ctx.lineWidth = Math.max(3, r * 0.032);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.83, ang(deg), ang(deg + 22));
      ctx.stroke();
    });
    DOTS.forEach(([deg, s]) => {
      const a = ang(deg);
      ctx.fillStyle = `rgba(196,63,82,${0.3 * fade})`;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r * s, cy + Math.sin(a) * r * s, Math.max(1.6, r * 0.016), 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ring(ctx, cx, cy, outerR, Math.max(7, r * 0.075), RING_TOPIC, fade);
    ring(ctx, cx, cy, midR, Math.max(7, r * 0.075), RING_PHRASE, fade);
    ring(ctx, cx, cy, innerR, Math.max(7, r * 0.075), RING_CONTEXT, fade);
  }

  const n = opts.angles.length;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * 0.86;
    const local = (progress - t0) / 0.14;
    if (local <= 0) continue;
    const e = easeOutCubic(local > 1 ? 1 : local);
    const a = ang(opts.angles[i]);
    const len = needleR * e;
    const x = cx + Math.cos(a) * len;
    const y = cy + Math.sin(a) * len;
    const color = PIN_COLORS[i % PIN_COLORS.length];
    ctx.globalAlpha = e * (opts.broken ? 0.88 : 0.95) * fade;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.8, r * 0.016);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(3, r * 0.029), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';

  ctx.globalAlpha = fade;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(5, r * 0.052), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const ly = H - Math.max(12, H * 0.038);
  if (opts.legend === 'old') {
    text(ctx, '六个查询全部落在同一段刻度', cx, ly, MUTED, fs, 'center');
  } else {
    const items: Array<[string, string]> = [
      ['主题', RING_TOPIC],
      ['短语', RING_PHRASE],
      ['上下文', RING_CONTEXT],
    ];
    const box = fs * 0.8;
    const widths = items.map(([t]) => box + 5 + t.length * fs);
    const total = widths.reduce((s, v) => s + v, 0) + (items.length - 1) * fs * 1.4;
    let x = cx - total / 2;
    items.forEach(([t, c], i) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, ly - box, box, box);
      text(ctx, t, x + box + 5, ly, INK, fs, 'left');
      x += widths[i] + fs * 1.4;
    });
  }
}
