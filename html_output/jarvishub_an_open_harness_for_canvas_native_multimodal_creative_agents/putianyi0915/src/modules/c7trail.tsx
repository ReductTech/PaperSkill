import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, dist } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 模块 7.1「回看某一轮到底发生了什么」（1080×280，点击时间轴上的某一轮）
// 命名区域：timeline（x 40–1040, y 30–110，六个轮次节点与连线）、
// detail（x 40–1040, y 130–260，固定九要素面板）。
// 绘制顺序：clearScene → 桌面带 → 时间轴基线 → 六个轮次节点 → 选中轮次节点（蓝）
// → C_t → C_{t+1} 差异标记 → 九要素面板 → drawLabel（2 个）→ drawLegend（3 项）。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const INK = '#21324a';
const SUB = '#68778f';

const NODES = 6;
const NODE_X0 = 120;
const NODE_DX = 172;
const NODE_Y = 84;
const NODE_R = 22;
const GROUND_Y = 264;

const PANEL_X = 40;
const PANEL_Y = 132;
const PANEL_W = 1000;
const PANEL_H = 126;

const CELL_W = 324;
const CELL_H = 34;
const CELL_GAP_X = 6;
const CELL_GAP_Y = 5;
const CELL_X0 = 46;
const CELL_Y0 = 140;

type RoundKind = 'plain' | 'repair' | 'global';

interface RoundDef {
  name: string;
  /** 九要素：q_t, C_t, Γ_t, Ω_t, a_t, o_t, f_t, r_t, C_{t+1} */
  nine: [string, string, string, string, string, string, string, string, string];
  diff: string;
  kind: RoundKind;
}

const SYMBOLS = [
  'q\u209c',
  'C\u209c',
  '\u0393\u209c',
  '\u03a9\u209c',
  'a\u209c',
  'o\u209c',
  'f\u209c',
  'r\u209c',
  'C\u209c\u208a\u2081',
];

const ROUNDS: RoundDef[] = [
  {
    name: '参考图',
    nine: [
      '画出毛衣的整体样子',
      '画布：1 个节点',
      '图像生成、画布写入',
      '允许生成与写入',
      '生成参考图节点',
      '返回 1 张参考图',
      '—',
      '—',
      '节点 2 个：新增参考图',
    ],
    diff: '新增 1 个参考节点',
    kind: 'plain',
  },
  {
    name: '花样补充',
    nine: [
      '把袖口花样补进参考',
      '画布：2 个节点',
      '画布工具、生成工具',
      '允许改写参考节点',
      '给参考图补上花样字段',
      '花样字段写回成功',
      '—',
      '—',
      '节点 2 个：参考被改写',
    ],
    diff: '改写 1 个字段',
    kind: 'plain',
  },
  {
    name: '草稿',
    nine: [
      '按参考生成第一版织片',
      '画布：3 个节点',
      '生成工具、画布写入',
      '允许生成并连边',
      '生成草稿节点并连到参考',
      '返回 1 张草稿图',
      '—',
      '—',
      '节点 4 个：草稿接上参考',
    ],
    diff: '新增 1 节点 + 1 依赖',
    kind: 'plain',
  },
  {
    name: '候选 A',
    nine: [
      '再出一版配色更深的候选',
      '画布：4 个节点',
      '生成工具、版本谱系',
      '允许新增版本分支',
      '生成候选 A 并连版本边',
      '返回 1 张候选图',
      '—',
      '—',
      '节点 5 个：多一条版本边',
    ],
    diff: '新增 1 条版本边',
    kind: 'plain',
  },
  {
    name: '局部修复',
    nine: [
      '第 7 行有一处错针',
      '画布：6 个节点',
      '恢复工具、画布写入',
      '只允许退回检查点重织',
      '退回检查点并重织第 7 行',
      '该行重织成功，其余未动',
      '用户指出第 7 行错针',
      '决定局部修复：只重做一行',
      '节点 6 个：仅第 7 行被替换',
    ],
    diff: '只重织 1 行',
    kind: 'repair',
  },
  {
    name: '全局重生成',
    nine: [
      '第 7 行还是不对',
      '画布：6 个节点',
      '生成工具、恢复工具',
      '允许整片重新生成',
      '整片重生成并替换原节点',
      '返回 1 张全新织片图',
      '用户再次指出同一处缺陷',
      '决定全局重生成：整片重做',
      '节点 7 个：原节点被覆盖',
    ],
    diff: '整片重做 12 行',
    kind: 'global',
  },
];

function roundColor(kind: RoundKind): string {
  if (kind === 'repair') return GREEN;
  if (kind === 'global') return RED;
  return BLUE;
}

function feedbackFor(index: number | null): { text: string; cls: string } {
  if (index === null) {
    return {
      text: '点击任意一轮，查看那一轮用到的上下文、选中的动作和写回的结果。',
      cls: '',
    };
  }
  const kind = ROUNDS[index - 1].kind;
  if (kind === 'repair') {
    return {
      text: '这一轮只重做了受影响的一小段：反馈被用来决定局部修复。',
      cls: 'good',
    };
  }
  if (kind === 'global') {
    return {
      text: '这一轮把整片都重做了：真正需要的可能只是局部修复。',
      cls: 'bad',
    };
  }
  return { text: '这一轮只调用了工具，画布新增了一个产物节点。', cls: '' };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(W, GROUND_Y);
  ctx.stroke();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const items = [
    { color: BLUE, text: '普通轮' },
    { color: ORANGE, text: '含反馈' },
    { color: GREEN, text: '局部修复' },
  ];
  let cx = x;
  ctx.save();
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 11, 16, 12);
    ctx.fillStyle = SUB;
    ctx.fillText(it.text, cx + 22, y);
    cx += 22 + it.text.length * 16 + 20;
  });
  ctx.restore();
}

function nodeX(i: number): number {
  return NODE_X0 + i * NODE_DX;
}

function roundAt(x: number, y: number): number | null {
  for (let i = 0; i < NODES; i++) {
    if (dist(x, y, nodeX(i), NODE_Y) <= NODE_R + 12) return i + 1;
  }
  return null;
}

/** 一条带方向箭头的短连线，用于标记 C_t → C_{t+1} 的差异。 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 11 * Math.cos(ang - 0.4), y2 - 11 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 11 * Math.cos(ang + 0.4), y2 - 11 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, index: number | null, time: number): void {
  clearScene(ctx);

  // 时间轴基线
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(nodeX(0), NODE_Y);
  ctx.lineTo(nodeX(NODES - 1), NODE_Y);
  ctx.stroke();
  ctx.restore();

  // 第 6 轮选中：整片重做的红色标记
  if (index === 6) {
    ctx.save();
    ctx.strokeStyle = RED;
    ctx.lineWidth = 6;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.moveTo(40, 112);
    ctx.lineTo(1040, 112);
    ctx.stroke();
    ctx.restore();
  }

  // 第 5 轮选中：只重织一小段的绿色区段
  if (index === 5) {
    ctx.save();
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nodeX(4) - 34, 112);
    ctx.lineTo(nodeX(4) + 34, 112);
    ctx.stroke();
    ctx.restore();
  }

  // 六个轮次节点
  for (let i = 0; i < NODES; i++) {
    const r = ROUNDS[i];
    const cx = nodeX(i);
    const selected = index === i + 1;
    const color = roundColor(r.kind);
    const pulse = selected ? 0.5 + 0.5 * Math.sin(time / 260) : 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, NODE_Y, NODE_R, 0, Math.PI * 2);
    ctx.fillStyle = selected ? color : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = selected ? color : r.kind === 'plain' ? LINE : ORANGE;
    ctx.lineWidth = selected ? 4 : r.kind === 'plain' ? 2 : 3;
    ctx.stroke();
    if (selected) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35 * pulse;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, NODE_Y, NODE_R + 7 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = selected ? '#ffffff' : INK;
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), cx, NODE_Y + 7);
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = selected ? color : SUB;
    ctx.fillText('第 ' + (i + 1) + ' 轮', cx, 48);
    ctx.fillStyle = selected ? INK : SUB;
    ctx.fillText(r.name, cx, 126);
    ctx.restore();
  }

  // C_t → C_{t+1} 差异标记：从选中轮次指向下一轮
  if (index !== null) {
    const color = roundColor(ROUNDS[index - 1].kind);
    const i = index - 1;
    if (i < NODES - 1) {
      drawArrow(ctx, nodeX(i) + NODE_R + 6, NODE_Y, nodeX(i + 1) - NODE_R - 6, NODE_Y, color, 4);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(nodeX(i + 1), NODE_Y, NODE_R + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('这一轮的差异：' + ROUNDS[index - 1].diff, 150, 26);
    ctx.restore();
  }

  // 固定九要素面板
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  roundRectPath(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 8);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  if (index === null) {
    ctx.save();
    ctx.fillStyle = SUB;
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选中一轮后，这里显示它的九项记录', PANEL_X + PANEL_W / 2, PANEL_Y + 72);
    ctx.restore();
  } else {
    const round = ROUNDS[index - 1];
    const color = roundColor(round.kind);
    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = CELL_X0 + col * (CELL_W + CELL_GAP_X);
      const y = CELL_Y0 + row * (CELL_H + CELL_GAP_Y);
      const value = round.nine[i];
      const empty = value === '—';
      const diffCell = i === 1 || i === 8;
      const feedbackCell = (i === 6 || i === 7) && !empty;

      ctx.save();
      ctx.fillStyle = diffCell
        ? 'rgba(39,68,110,0.10)'
        : feedbackCell
        ? 'rgba(240,126,71,0.12)'
        : 'rgba(245,248,240,0.85)';
      roundRectPath(ctx, x, y, CELL_W, CELL_H, 5);
      ctx.fill();
      ctx.strokeStyle = diffCell ? color : feedbackCell ? ORANGE : LINE;
      ctx.lineWidth = diffCell || feedbackCell ? 2 : 1;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = diffCell ? color : BLUE;
      ctx.fillText(SYMBOLS[i], x + 12, y + 22);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = empty ? '#b6c0cf' : INK;
      ctx.fillText(value, x + 62, y + 22);
      ctx.restore();
    }
  }

  drawLabel(ctx, '六轮轨迹', 40, 26, INK);
  drawLabel(ctx, '九要素记录', 940, 26, INK);
  drawLegend(ctx, 700, 276);
}

export const Ch7Trail: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ index: number | null }>({ index: null });
  const rafRef = useRef<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(feedbackFor(null));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      render(ctx, stateRef.current.index, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (next: number | null) => {
    stateRef.current.index = next;
    setIndex(next);
    setFeedback(feedbackFor(next));
  };

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1, y: -1 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const hit = roundAt(p.x, p.y);
    if (hit !== null) select(hit);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const current = stateRef.current.index;
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = current === null ? 1 : current + step;
    select(clamp(next, 1, NODES));
  };

  const round = index === null ? null : ROUNDS[index - 1];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        aria-label="轨迹时间轴，六轮可点击，也可用左右方向键切换"
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      />
      <div className="metrics">
        <div className="metric">
          <div className="l">选中轮次</div>
          <div className="v">{index === null ? '未选中' : '第 ' + index + ' 轮'}</div>
        </div>
        <div className="metric">
          <div className="l">该轮动作</div>
          <div className="v">{round ? round.nine[4] : '—'}</div>
        </div>
        <div className="metric">
          <div className="l">画布差异</div>
          <div className="v">{round ? round.diff : '—'}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Trail;
