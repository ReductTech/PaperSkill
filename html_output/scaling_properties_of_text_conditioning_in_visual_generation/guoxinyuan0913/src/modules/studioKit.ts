// 画室委托（Atelier Commission）共享绘图套件 — 全教程唯一的场景绘制原语。
// 所有 analogy 动画、Hero 对比与生活隐喻模块都从这里取 helper，保证跨章节一致。

// 转发 canvasKit 的通用工具，统一从本模块导入。
import { observeCanvas } from '../lib/canvasKit';
export {
  setupCanvas,
  observeCanvas,
  lerp,
  lerpColor,
  clamp,
  easeOutCubic,
  easeInOutQuad,
  map,
} from '../lib/canvasKit';

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  sheet: '#f7f3e8',
  line: '#d9d2bd',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.78);
  ctx.lineTo(w, h * 0.78);
  ctx.stroke();
}

export function drawEasel(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 16 * s, y + 52 * s);
  ctx.moveTo(x, y);
  ctx.lineTo(x + 16 * s, y + 52 * s);
  ctx.moveTo(x, y + 40 * s);
  ctx.lineTo(x, y + 52 * s);
  ctx.stroke();
  ctx.fillStyle = '#e8e2d2';
  ctx.fillRect(x - 22 * s, y - 34 * s, 44 * s, 34 * s);
  ctx.strokeStyle = C.wood;
  ctx.strokeRect(x - 22 * s, y - 34 * s, 44 * s, 34 * s);
}

export function drawFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
  armAngle: number,
  withBrush = true
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 34 * s, 8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 26 * s);
  ctx.lineTo(x, y - 6 * s);
  ctx.moveTo(x, y - 22 * s);
  ctx.lineTo(x + Math.cos(armAngle) * 16 * s, y - 22 * s + Math.sin(armAngle) * 16 * s);
  ctx.moveTo(x, y - 6 * s);
  ctx.lineTo(x - 6 * s, y);
  ctx.moveTo(x, y - 6 * s);
  ctx.lineTo(x + 6 * s, y);
  ctx.stroke();
  if (withBrush) {
    const hx = x + Math.cos(armAngle) * 16 * s;
    const hy = y - 22 * s + Math.sin(armAngle) * 16 * s;
    ctx.strokeStyle = C.wood;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + 10 * s, hy - 10 * s);
    ctx.stroke();
  }
}

export function drawPainter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  armAngle: number
) {
  drawFigure(ctx, x, y, 1, C.blue, armAngle, true);
}

export function drawApprentice(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  armAngle: number
) {
  drawFigure(ctx, x, y, 0.8, C.purple, armAngle, true);
}

export function drawClerk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  magnifierX: number,
  magnifierY: number
) {
  drawFigure(ctx, x, y, 0.9, C.orange, -0.6, false);
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(magnifierX, magnifierY, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(magnifierX + 6, magnifierY + 6);
  ctx.lineTo(magnifierX + 13, magnifierY + 13);
  ctx.stroke();
}

export interface SheetRow {
  boxed: boolean; // 结构化字段行（方框）还是散文行（波纹线）
  filled: boolean; // 是否已恢复/点亮
  color?: string; // 点亮颜色（默认 green）
  mark?: 'check' | 'cross' | null;
}

export function drawOrderSheet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: SheetRow[]
) {
  ctx.fillStyle = C.sheet;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  const rh = h / Math.max(rows.length, 1);
  rows.forEach((r, i) => {
    const cy = y + rh * i + rh / 2;
    if (r.boxed) {
      ctx.strokeStyle = r.filled ? r.color || C.green : C.border;
      ctx.lineWidth = r.filled ? 2 : 1;
      ctx.strokeRect(x + 8, cy - rh * 0.3, w - 16, rh * 0.6);
      if (r.filled) {
        ctx.fillStyle = r.color || C.green;
        ctx.fillRect(x + 8, cy - rh * 0.3, w - 16, rh * 0.6);
      }
    } else {
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = x + 8; px < x + w - 8; px += 6) {
        ctx.lineTo(px, cy + Math.sin(px / 5 + i) * 2);
      }
      ctx.stroke();
    }
    if (r.mark) {
      ctx.strokeStyle = r.mark === 'check' ? C.green : C.red;
      ctx.lineWidth = 2;
      const mx = x + w - 14;
      if (r.mark === 'check') {
        ctx.beginPath();
        ctx.moveTo(mx - 5, cy);
        ctx.lineTo(mx - 1, cy + 4);
        ctx.lineTo(mx + 5, cy - 4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(mx - 4, cy - 4);
        ctx.lineTo(mx + 4, cy + 4);
        ctx.moveTo(mx + 4, cy - 4);
        ctx.lineTo(mx - 4, cy + 4);
        ctx.stroke();
      }
    }
  });
}

export function drawTargetMark(ctx: CanvasRenderingContext2D, x: number, y: number, ok: boolean) {
  ctx.strokeStyle = ok ? C.green : C.red;
  ctx.lineWidth = 3;
  if (ok) {
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x - 2, y + 7);
    ctx.lineTo(x + 9, y - 8);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 7);
    ctx.lineTo(x + 7, y + 7);
    ctx.moveTo(x + 7, y - 7);
    ctx.lineTo(x - 7, y + 7);
    ctx.stroke();
  }
}

export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted = false
) {
  ctx.fillStyle = muted ? C.muted : C.text;
  ctx.font = '13px "Microsoft YaHei", sans-serif';
  ctx.fillText(text, x, y);
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; text: string }[],
  x: number,
  y: number
) {
  items.forEach((it, i) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(x, y - 8 + i * 16, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillText(it.text, x + 15, y + i * 16);
  });
}

/** 大画板（Hero 对比用）：矩形板面 + 短支架，板面足够容纳嵌套构图细节。 */
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  ctx.fillStyle = '#e8e2d2';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bx + 12, by + bh);
  ctx.lineTo(bx + 2, by + bh + 16);
  ctx.moveTo(bx + bw - 12, by + bh);
  ctx.lineTo(bx + bw - 2, by + bh + 16);
  ctx.stroke();
}

// ===== 嵌套构图（原始图像：外圆 → 中方 → 内三角）共享绘制 =====

const hash1 = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export interface NestedStage {
  circle?: boolean;
  circleDetail?: boolean;
  square?: boolean;
  squareDetail?: boolean;
  triangle?: boolean;
  triangleDetail?: boolean;
  junk?: number; // 劣质重复笔触数量（旧方法：同一细节反复堆叠）
}

/** 嵌套构图。quality='good' 规整细节 / 'rough' 粗糙轮廓；junk 为劣质重复笔触数。 */
export function drawNested(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  stage: NestedStage
) {
  const muddy = '#8f8f72';
  ctx.strokeStyle = muddy;
  ctx.lineWidth = 1.3;
  const sq = 0.56 * R; // 方形半边
  // 三角形顶点（内接于方形）
  const tri = [
    [cx, cy - 0.22 * R],
    [cx - 0.26 * R, cy + 0.16 * R],
    [cx + 0.26 * R, cy + 0.16 * R],
  ];

  const poly = (pts: number[][], close = true, wobble = 0) => {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const jx = wobble ? (hash1(i * 7.3 + wobble) - 0.5) * wobble : 0;
      const jy = wobble ? (hash1(i * 3.1 + wobble + 5) - 0.5) * wobble : 0;
      if (i === 0) ctx.moveTo(p[0] + jx, p[1] + jy);
      else ctx.lineTo(p[0] + jx, p[1] + jy);
    });
    if (close) ctx.closePath();
    ctx.stroke();
  };

  if (stage.circle) {
    ctx.strokeStyle = muddy; ctx.lineWidth = 1.3;
    ctx.beginPath();
    const segs = 14;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const r = R + (Math.sin(i * 2.7) > 0.4 ? 1.6 : -1.2);
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  if (stage.circleDetail) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8);
      ctx.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92);
      ctx.stroke();
    }
  }
  if (stage.square) poly([[cx - sq, cy - sq], [cx + sq, cy - sq], [cx + sq, cy + sq], [cx - sq, cy + sq]]);
  if (stage.squareDetail) {
    const s2 = 0.38 * R;
    ctx.lineWidth = 1.6;
    poly([[cx - s2, cy - s2], [cx + s2, cy - s2], [cx + s2, cy + s2], [cx - s2, cy + s2]]);
  }
  if (stage.triangle) poly(tri);
  if (stage.triangleDetail) {
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) {
      const yy = cy + 0.02 * R + k * 0.06 * R;
      const half = 0.2 * R - k * 0.05 * R;
      ctx.beginPath();
      ctx.moveTo(cx - half, yy);
      ctx.lineTo(cx + half, yy);
      ctx.stroke();
    }
  }
  // 劣质重复笔触：同一种「圆周射线」细节随机反复堆叠
  const n = stage.junk || 0;
  if (n > 0) {
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = Math.min(0.85, 0.5 + n * 0.04);
    for (let i = 0; i < n; i++) {
      const a = hash1(i * 13.7) * Math.PI * 2;
      const r0 = R * (0.7 + hash1(i * 5.1) * 0.25);
      const len = R * (0.06 + hash1(i * 9.3) * 0.16);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

/** 规整版嵌套构图（目标图与新方法用）：线条干净、细节工整。 */
export function drawNestedGood(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  stage: NestedStage
) {
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.2;
  const sq = 0.56 * R;
  if (stage.circle) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (stage.circleDetail) {
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8);
      ctx.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92);
      ctx.stroke();
    }
    ctx.lineWidth = 2.2;
  }
  const rect = (h: number, lw: number) => {
    ctx.lineWidth = lw;
    ctx.strokeRect(cx - h, cy - h, h * 2, h * 2);
  };
  if (stage.square) rect(sq, 2.2);
  if (stage.squareDetail) rect(0.38 * R, 1.6);
  if (stage.triangle) {
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 0.22 * R);
    ctx.lineTo(cx - 0.26 * R, cy + 0.16 * R);
    ctx.lineTo(cx + 0.26 * R, cy + 0.16 * R);
    ctx.closePath();
    ctx.stroke();
  }
  if (stage.triangleDetail) {
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) {
      const yy = cy + 0.02 * R + k * 0.06 * R;
      const half = 0.2 * R - k * 0.05 * R;
      ctx.beginPath();
      ctx.moveTo(cx - half, yy);
      ctx.lineTo(cx + half, yy);
      ctx.stroke();
    }
  }
}

/** 通用动画循环：rAF + off-screen 暂停 + is-ready 标记。 */
export function runLoop(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  render: (t: number) => void
): () => void {
  let raf: number | null = null;
  const t0 = performance.now();
  const tick = () => {
    render((performance.now() - t0) / 1000);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (raf === null) raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
  };
  const disconnect = observeCanvas(canvas, start, stop);
  start();
  return () => {
    stop();
    disconnect();
  };
}
