// 教室场景共享绘图套件（班主任主题）
// 语义色沿用 contract §5：红=失败/旧方法，绿=成功/本文方法，蓝=当前路径，橙=用户强调，紫=辅助机制。
// 场景中性色偏暖（纸张、木桌、墙面），语义色只用于表达状态。
import { useEffect, useRef } from 'react';
import { observeCanvas } from '../lib/canvasKit';

export const C = {
  bg: '#f8f5ef', // 安静的纸色背景
  wall: '#f2ebdf',
  floor: '#e7ddcc',
  floorLine: '#cdbfa8',
  board: '#3f5449', // 黑板（中性深绿灰，不与语义绿混淆）
  boardFrame: '#9a7c54',
  desk: '#d3bb98',
  deskTop: '#c3a67f',
  wood: '#a98f6b',
  woodDark: '#7a6142',
  support: '#92400e',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  // 身份色（刻意低饱和，避免抢语义色的含义）
  old: '#4a6484',
  oldChip: '#dfe6f0',
  novice: '#c8792f',
  noviceChip: '#f7e5d0',
  skin: '#eccfae',
  hair: '#4a3728',
  // 语义色
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
};

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

// ---------------------------------------------------------------- 画布生命周期

/** 挂载画布：DPR 适配 + 响应式宽度（保持宽高比，避免被容器拉伸）。 */
export function mountCanvas(
  canvas: HTMLCanvasElement,
  w: number,
  h: number
): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${w} / ${h}`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export type RenderFn = (ctx: CanvasRenderingContext2D, t: number) => void;

/**
 * 每帧重绘的渲染循环：离开视口自动暂停，尊重 prefers-reduced-motion。
 * 状态都放在调用方的 ref 里，渲染函数每帧读取，因此交互立即生效。
 */
export function useScene(w: number, h: number, render: RenderFn) {
  const ref = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef(render);
  renderRef.current = render;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = mountCanvas(canvas, w, h);
    } catch {
      return;
    }
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let running = false;
    const t0 = performance.now();

    const frame = () => {
      const t = reduce ? 1.8 : (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      renderRef.current(ctx, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (reduce) return;
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      frame();
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [w, h]);

  return ref;
}

// ---------------------------------------------------------------- 基础图元

export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

export function txt(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size = 13,
  color: string = C.ink,
  align: CanvasTextAlign = 'left',
  weight = 600
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

export function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = C.line,
  width = 1.5,
  dash: number[] = []
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = C.blue,
  width = 2
) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = 7;
  line(ctx, x1, y1, x2, y2, color, width);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42));
  ctx.lineTo(x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** 状态高亮环（呼吸感很弱，仅表示"当前选中"）。 */
export function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  t = 0
) {
  const k = 1 + 0.07 * Math.sin(t * 2.2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(x, y, r * k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** 方框高亮：给选中组件描一圈橙色，比圆环更贴合矩形节点。 */
export function hl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = C.orange,
  r = 10
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.globalAlpha = 0.9;
  rr(ctx, x - 3, y - 3, w + 6, h + 6, r);
  ctx.stroke();
  ctx.restore();
}

/** 圆角提示牌，用于 canvas 内最多两个短标签。 */
export function tag(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  bg: string,
  size = 12
) {
  ctx.font = `600 ${size}px ${FONT}`;
  const w = ctx.measureText(s).width + 14;
  rr(ctx, x - w / 2, y - size, w, size + 10, 9);
  ctx.fillStyle = bg;
  ctx.fill();
  txt(ctx, s, x, y + 1, size, color, 'center');
}

// ---------------------------------------------------------------- 教室场景

/** 安静的场景底：墙面 + 地面线。 */
export function drawRoom(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const floorY = h - 22;
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, floorY, w, 22);
  line(ctx, 0, floorY, w, floorY, C.floorLine, 1.5);
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  rr(ctx, x - 4, y - 4, w + 8, h + 8, 6);
  ctx.fillStyle = C.boardFrame;
  ctx.fill();
  rr(ctx, x, y, w, h, 3);
  ctx.fillStyle = C.board;
  ctx.fill();
  // 粉笔痕迹
  ctx.save();
  ctx.globalAlpha = 0.18;
  line(ctx, x + 12, y + h * 0.35, x + w * 0.45, y + h * 0.35, '#ffffff', 2);
  line(ctx, x + 12, y + h * 0.6, x + w * 0.3, y + h * 0.6, '#ffffff', 2);
  ctx.restore();
}

export function drawDesk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string = C.deskTop
) {
  rr(ctx, x, y, w, h * 0.34, 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = C.woodDark;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + h * 0.34);
  ctx.lineTo(x + 3, y + h);
  ctx.moveTo(x + w - 3, y + h * 0.34);
  ctx.lineTo(x + w - 3, y + h);
  ctx.stroke();
}

/** 空座位：一把没人坐的椅子（新座位区 / 待填的坑位）。 */
export function drawChair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string = C.wood
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  rr(ctx, x - s * 0.45, y - s * 0.95, s * 0.9, s * 0.5, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.45, y - s * 0.42);
  ctx.lineTo(x + s * 0.45, y - s * 0.42);
  ctx.moveTo(x - s * 0.38, y - s * 0.42);
  ctx.lineTo(x - s * 0.38, y);
  ctx.moveTo(x + s * 0.38, y - s * 0.42);
  ctx.lineTo(x + s * 0.38, y);
  ctx.stroke();
  ctx.restore();
}

export function drawDoor(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number) {
  rr(ctx, x, baseY - h, 34, h, 3);
  ctx.fillStyle = '#e2d5c0';
  ctx.fill();
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 2;
  ctx.stroke();
  dot(ctx, x + 26, baseY - h / 2, 2.2, C.woodDark);
}

type FigureOpt = {
  hair?: string;
  mood?: -1 | 0 | 1;
  dim?: boolean;
  bag?: boolean;
  scaleY?: number;
};

/** 学生：脚底在 (x, baseY)，s 是半身尺度（整体高约 2s）。 */
export function drawStudent(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  s: number,
  color: string,
  opt: FigureOpt = {}
) {
  const mood = opt.mood ?? 1;
  const hair = opt.hair ?? C.hair;
  const headR = s * 0.34;
  const headY = baseY - s * 1.62;
  ctx.save();
  if (opt.dim) ctx.globalAlpha = 0.45;

  // 书包
  if (opt.bag) {
    rr(ctx, x + s * 0.34, baseY - s * 1.18, s * 0.3, s * 0.44, 4);
    ctx.fillStyle = C.woodDark;
    ctx.fill();
  }
  // 腿
  line(ctx, x - s * 0.16, baseY - s * 0.6, x - s * 0.2, baseY, C.ink, s * 0.14);
  line(ctx, x + s * 0.16, baseY - s * 0.6, x + s * 0.2, baseY, C.ink, s * 0.14);
  // 身体
  rr(ctx, x - s * 0.4, baseY - s * 1.26, s * 0.8, s * 0.72, s * 0.22);
  ctx.fillStyle = color;
  ctx.fill();
  // 手臂
  line(ctx, x - s * 0.36, baseY - s * 1.12, x - s * 0.52, baseY - s * 0.78, color, s * 0.14);
  line(ctx, x + s * 0.36, baseY - s * 1.12, x + s * 0.52, baseY - s * 0.78, color, s * 0.14);
  // 头
  dot(ctx, x, headY, headR, C.skin);
  // 头发
  ctx.beginPath();
  ctx.arc(x, headY, headR * 1.03, Math.PI * 1.04, Math.PI * 1.96);
  ctx.lineTo(x + headR, headY);
  ctx.fillStyle = hair;
  ctx.fill();
  // 眼睛与表情
  dot(ctx, x - headR * 0.34, headY + headR * 0.08, headR * 0.12, C.ink);
  dot(ctx, x + headR * 0.34, headY + headR * 0.08, headR * 0.12, C.ink);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath();
  if (mood >= 0) {
    ctx.arc(x, headY + headR * 0.3, headR * 0.36, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.arc(x, headY + headR * 0.72, headR * 0.36, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
}

type TeacherOpt = {
  arm?: number; // 手臂抬起角度（弧度，0 自然下垂）
  hold?: 'pointer' | 'none' | 'card';
  facing?: 1 | -1;
};

/** 老师：比学生高一点，穿深色外套，手里常拿教鞭。 */
export function drawTeacher(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  s: number,
  opt: TeacherOpt = {}
) {
  const arm = opt.arm ?? 0;
  const f = opt.facing ?? 1;
  const headR = s * 0.33;
  const headY = baseY - s * 1.95;
  const coat = '#5d6b63';

  // 腿
  line(ctx, x - s * 0.15, baseY - s * 0.72, x - s * 0.19, baseY, C.ink, s * 0.13);
  line(ctx, x + s * 0.15, baseY - s * 0.72, x + s * 0.19, baseY, C.ink, s * 0.13);
  // 外套（梯形）
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, baseY - s * 1.55);
  ctx.lineTo(x + s * 0.3, baseY - s * 1.55);
  ctx.lineTo(x + s * 0.42, baseY - s * 0.68);
  ctx.lineTo(x - s * 0.42, baseY - s * 0.68);
  ctx.closePath();
  ctx.fillStyle = coat;
  ctx.fill();
  // 衣领
  line(ctx, x - s * 0.12, baseY - s * 1.55, x, baseY - s * 1.32, '#f4efe6', s * 0.09);
  line(ctx, x + s * 0.12, baseY - s * 1.55, x, baseY - s * 1.32, '#f4efe6', s * 0.09);
  // 左臂（自然下垂）
  line(ctx, x - s * 0.3 * f, baseY - s * 1.45, x - s * 0.45 * f, baseY - s * 1.0, coat, s * 0.13);
  // 右臂 + 教鞭
  const sx = x + s * 0.3 * f;
  const sy = baseY - s * 1.45;
  const ex = sx + Math.cos(-arm) * s * 0.55 * f;
  const ey = sy + Math.sin(-arm) * s * 0.55;
  line(ctx, sx, sy, ex, ey, coat, s * 0.13);
  if (opt.hold === 'pointer' || opt.hold === undefined) {
    line(ctx, ex, ey, ex + Math.cos(-arm - 0.35) * s * 1.05 * f, ey + Math.sin(-arm - 0.35) * s * 1.05, C.support, 2.2);
  }
  if (opt.hold === 'card') {
    rr(ctx, ex - 4, ey - 14, 20, 14, 3);
    ctx.fillStyle = C.noviceChip;
    ctx.fill();
    ctx.strokeStyle = C.novice;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  // 头
  dot(ctx, x, headY, headR, C.skin);
  // 头发（偏低马尾）
  ctx.beginPath();
  ctx.arc(x, headY, headR * 1.02, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fillStyle = '#3a2f26';
  ctx.fill();
  dot(ctx, x - headR * 1.0 * f, headY + headR * 0.3, headR * 0.28, '#3a2f26');
  // 眼镜
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x - headR * 0.38, headY + headR * 0.1, headR * 0.26, 0, Math.PI * 2);
  ctx.arc(x + headR * 0.38, headY + headR * 0.1, headR * 0.26, 0, Math.PI * 2);
  ctx.moveTo(x - headR * 0.12, headY + headR * 0.1);
  ctx.lineTo(x + headR * 0.12, headY + headR * 0.1);
  ctx.stroke();
  // 嘴
  ctx.beginPath();
  ctx.arc(x, headY + headR * 0.42, headR * 0.3, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();
}

// ---------------------------------------------------------------- 技术图元

export function polyline(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  width = 2,
  dash: number[] = []
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
}

export function axis(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = C.line
) {
  line(ctx, x, y + h, x + w, y + h, color, 1.2);
  line(ctx, x, y, x, y + h, color, 1.2);
}

export function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  r = 4
) {
  if (h <= 0.5) return;
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** 顶部细进度条 / 比例条（用在模块顶部的场景提示）。 */
export function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  p: number,
  color: string
) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = C.line;
  ctx.fill();
  rr(ctx, x, y, Math.max(3, w * Math.min(1, Math.max(0, p))), h, h / 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export { lerp, clamp, easeOutCubic, easeInOutQuad, easeSpring, map } from '../lib/canvasKit';

/** 循环进度 0→1。 */
export function loopT(t: number, dur = 3.4) {
  const p = (t % dur) / dur;
  return p;
}

/** 0→1→0 的平滑往返，常用于"呼吸"与"搬运"动作。 */
export function pingPong(p: number) {
  return p < 0.5 ? p * 2 : 2 - p * 2;
}

export function smooth(p: number) {
  const x = Math.min(1, Math.max(0, p));
  return x * x * (3 - 2 * x);
}
