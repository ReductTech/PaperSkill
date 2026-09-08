import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

/* ============================================================================
   ClawGUI 教程 —— 共享 Canvas 绘图工具包
   全站所有 Canvas 复用这里的调色板与图元，
   保证跨章节的视觉语法与颜色语义完全一致（contract.md §5）。
   ============================================================================ */

/** 语义调色板 —— 全站唯一来源，跨章节稳定不变（暖纸基调） */
export const C = {
  field: '#faf7ef', // 安静场景底（暖纸）
  envLight: '#c3c4a4', // 草地 / 被动质量（暖橄榄）
  envDark: '#7d8163', // 阴影 / 轮廓
  road: '#57534a', // 沥青路面（暖灰）
  routeEdge: '#92400e', // 路缘 / 物理支撑
  lane: '#f3efe4', // 车道虚线
  guide: '#27446e', // 蓝：引导 / 当前状态 / 模型
  pass: '#1f6f43', // 绿：论文方法 / 成功
  fail: '#b3372f', // 红：旧方法 / 失效
  emph: '#d97706', // 橙：用户可控强调
  aux: '#7c3aed', // 紫：辅助机制
  ink: '#2b2724', // 主文字（暖黑）
  muted: '#7a7267', // 次级文字
  axis: '#ddd6c8', // 轴线 / 内嵌边框
  white: '#fffcf7',
} as const;

export const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
export const MONO = '"Cascadia Code", "SFMono-Regular", Consolas, monospace';

/** 模块主 Canvas 标准尺寸 */
export const MW = 560;
export const MH = 260;
/** 类比动画标准尺寸（contract.md §4） */
export const AW = 244;
export const AH = 130;

/* ------------------------------------------------------------------ */
/* 渲染循环 hook：draw 存在 ref 里，因此始终读到最新的 React state       */
/* ------------------------------------------------------------------ */

export function useCanvasScene(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, t: number) => void
): React.RefObject<HTMLCanvasElement> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, w, h);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.field;
      ctx.fillRect(0, 0, w, h);
      try {
        drawRef.current(ctx, performance.now() - t0);
      } catch {
        /* 单帧绘制异常不应中断整页 */
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [w, h]);

  return canvasRef;
}

/** 把 CSS 缩放后的指针坐标换算回 Canvas 逻辑坐标（P5/P6 命中测试用） */
export function pointerPos(
  e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>,
  w: number,
  h: number
): { x: number; y: number } {
  const el = e.currentTarget as HTMLCanvasElement;
  const r = el.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * w,
    y: ((e.clientY - r.top) / r.height) * h,
  };
}

/* ------------------------------------------------------------------ */
/* 基础图元                                                             */
/* ------------------------------------------------------------------ */

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 6
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
  lw = 1
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  opts: {
    size?: number;
    color?: string;
    weight?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    mono?: boolean;
  } = {}
) {
  const {
    size = 13,
    color = C.ink,
    weight = '400',
    align = 'left',
    baseline = 'alphabetic',
    mono = false,
  } = opts;
  ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = C.axis,
  lw = 1,
  dash: number[] = []
) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
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
  color: string = C.guide,
  lw = 2,
  head = 6
) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * head, y2 - Math.sin(a) * head);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.4) * head, y2 - Math.sin(a - 0.4) * head);
  ctx.lineTo(x2 - Math.cos(a + 0.4) * head, y2 - Math.sin(a + 0.4) * head);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 水平进度条：技术证据用，保持从属视觉重量 */
export function hBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string,
  bg: string = C.axis
) {
  fillRound(ctx, x, y, w, h, h / 2, bg);
  const fw = Math.max(0, Math.min(1, frac)) * w;
  if (fw > 0.5) fillRound(ctx, x, y, fw, h, h / 2, color);
}

/* ------------------------------------------------------------------ */
/* 场景图元（道路 / 车 / 手机等，供各章类比与模块复用）              */
/* ------------------------------------------------------------------ */

/** 俯视小车。angle 为弧度，0 = 车头朝右 */
export function car(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
  angle = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  // 车身
  fillRound(ctx, -14, -8, 28, 16, 4, color);
  // 车窗
  fillRound(ctx, -2, -6, 9, 12, 2, 'rgba(255,255,255,0.75)');
  // 车轮
  ctx.fillStyle = 'rgba(43,39,36,0.55)';
  ctx.fillRect(-10, -10, 6, 3);
  ctx.fillRect(-10, 7, 6, 3);
  ctx.fillRect(5, -10, 6, 3);
  ctx.fillRect(5, 7, 6, 3);
  ctx.restore();
}

/** 水平沥青路带（含中央虚线） */
export function road(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dashOffset = 0
) {
  ctx.fillStyle = C.road;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.lineDashOffset = -dashOffset;
  ctx.strokeStyle = C.lane;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  ctx.restore();
}

/** 锥桶：用户可控的强调标记 */
export function cone(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = C.emph;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(6, 5);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(-4, -3, 8, 2.5);
  ctx.fillStyle = 'rgba(43,39,36,0.35)';
  ctx.fillRect(-7, 5, 14, 2.5);
  ctx.restore();
}

/** 手机外框；返回屏幕内容区，供各模块自行绘制 */
export function phone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  screenFill: string = C.white,
  border: string = C.ink
): { sx: number; sy: number; sw: number; sh: number } {
  fillRound(ctx, x, y, w, h, 8, border);
  const pad = 3;
  const sx = x + pad;
  const sy = y + pad + 5;
  const sw = w - pad * 2;
  const sh = h - pad * 2 - 9;
  fillRound(ctx, sx, sy, sw, sh, 4, screenFill);
  // 听筒
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(x + w / 2 - 5, y + 2.5, 10, 1.6);
  return { sx, sy, sw, sh };
}

/** 屏幕内的界面元素占位条 */
export function uiRows(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  rows: number,
  highlight = -1,
  hlColor: string = C.emph
) {
  for (let i = 0; i < rows; i++) {
    const ry = sy + 7 + i * 11;
    const rw = sw - 12 - (i % 3) * 8;
    fillRound(ctx, sx + 6, ry, rw, 7, 2, i === highlight ? hlColor : C.axis);
  }
}

/** 半透明遮罩 + 居中说明，用于「不可用 / 已禁用」状态 */
export function veil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label?: string
) {
  ctx.fillStyle = 'rgba(250,247,239,0.72)';
  ctx.fillRect(x, y, w, h);
  if (label) {
    text(ctx, label, x + w / 2, y + h / 2, {
      size: 13,
      color: C.muted,
      weight: '700',
      align: 'center',
      baseline: 'middle',
    });
  }
}

/** 章节图例：一行小色块 + 文字 */
export function legend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; label: string }[]
) {
  let cx = x;
  items.forEach((it) => {
    fillRound(ctx, cx, y - 6, 9, 9, 2, it.color);
    text(ctx, it.label, cx + 13, y + 1.5, { size: 12, color: C.muted });
    cx += 13 + ctx.measureText(it.label).width + 16;
  });
}
