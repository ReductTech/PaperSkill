import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 新方法侧（520×280）：画布原生。
// 画布上散布多个蓝色节点与有向边，绿色实心块是最终产物，橙色记号扣是检查点；蓝色描边表示论文方法。
// 时间基准：自本 Canvas 首次进入视口起算，3 秒一个周期——节点依次点亮并连边，周期末停在完整图上。
// 与 c0old 使用同一周期，两侧同步。

const W = 520;
const H = 280;
const CYCLE = 3000;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const INK = '#21324a';
const SUB = '#68778f';

const CARD_X = 24;
const CARD_Y = 18;
const CARD_W = 472;
const CARD_H = 176;

interface NodeDef {
  x: number;
  y: number;
  r: number;
  square?: boolean;
}

const NODES: NodeDef[] = [
  { x: 86, y: 62, r: 11 },
  { x: 186, y: 38, r: 11 },
  { x: 182, y: 98, r: 11 },
  { x: 284, y: 62, r: 11 },
  { x: 282, y: 138, r: 11 },
  { x: 398, y: 92, r: 15, square: true },
  { x: 104, y: 148, r: 11 },
];

const EDGES: Array<{ from: number; to: number }> = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 6, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 5 },
];

const CHECKPOINTS: number[] = [1, 3];

const NODE_STEP = 0.1;
const BUILD_END = 0.8;

function nodeTime(i: number): number {
  return (i + 1) * NODE_STEP;
}

function edgeTime(k: number): number {
  const e = EDGES[k];
  return Math.max(nodeTime(e.from), nodeTime(e.to)) + 0.05;
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
  ctx.fillRect(0, 214, W, H - 214);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 214);
  ctx.lineTo(W, 214);
  ctx.stroke();
}

/** 有向边：从源节点边缘画到目标节点边缘，末端带箭头。 */
function drawEdge(
  ctx: CanvasRenderingContext2D,
  a: NodeDef,
  b: NodeDef,
  grow: number,
  alpha: number
): void {
  if (alpha <= 0.01 || grow <= 0.01) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const sx = a.x + ux * (a.r + 4);
  const sy = a.y + uy * (a.r + 4);
  const ex = b.x - ux * (b.r + 8);
  const ey = b.y - uy * (b.r + 8);
  const tx = sx + (ex - sx) * grow;
  const ty = sy + (ey - sy) * grow;

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  if (grow > 0.98) {
    const size = 8;
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ux * size - uy * size * 0.55, ey - uy * size + ux * size * 0.55);
    ctx.lineTo(ex - ux * size + uy * size * 0.55, ey - uy * size - ux * size * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawNode(ctx: CanvasRenderingContext2D, n: NodeDef, appear: number): void {
  if (appear <= 0.01) return;
  const grow = easeOutCubic(clamp(appear, 0, 1));
  ctx.save();
  ctx.globalAlpha = clamp(grow, 0, 1);
  ctx.translate(n.x, n.y);
  ctx.scale(0.6 + 0.4 * grow, 0.6 + 0.4 * grow);
  if (n.square) {
    roundRectPath(ctx, -n.r, -n.r, n.r * 2, n.r * 2, 4);
    ctx.fillStyle = GREEN;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, n.r, 0, Math.PI * 2);
    ctx.fillStyle = BLUE;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = clamp(grow, 0, 1) * 0.7;
    ctx.stroke();
  }
  ctx.restore();
}

/** 检查点：别在节点上的橙色小环。 */
function drawCheckpoint(
  ctx: CanvasRenderingContext2D,
  n: NodeDef,
  appear: number,
  time: number
): void {
  if (appear <= 0.01) return;
  const pulse = 0.5 + 0.5 * Math.sin(time / 380);
  ctx.save();
  ctx.globalAlpha = clamp(appear, 0, 1) * (0.7 + 0.3 * pulse);
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(n.x, n.y, n.r + 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
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

function drawLegend(ctx: CanvasRenderingContext2D, y: number): void {
  const items: Array<{ color: string; text: string; kind: 'node' | 'square' | 'ring' }> = [
    { color: BLUE, text: '节点', kind: 'node' },
    { color: GREEN, text: '最终产物', kind: 'square' },
    { color: ORANGE, text: '检查点', kind: 'ring' },
  ];
  let x = 36;
  ctx.save();
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.save();
    if (it.kind === 'ring') {
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + 6, y - 4, 7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (it.kind === 'square') {
      ctx.fillStyle = it.color;
      roundRectPath(ctx, x, y - 11, 13, 13, 3);
      ctx.fill();
    } else {
      ctx.fillStyle = it.color;
      ctx.beginPath();
      ctx.arc(x + 7, y - 5, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = SUB;
    ctx.fillText(it.text, x + 22, y);
    x += 22 + it.text.length * 15 + 26;
  });
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, elapsed: number): void {
  clearScene(ctx);

  const p = (elapsed % CYCLE) / CYCLE;
  const q = clamp(p / BUILD_END, 0, 1);

  // 有向边先画在节点下面
  EDGES.forEach((e, k) => {
    const t = edgeTime(k);
    const grow = clamp((q - t) / 0.08, 0, 1);
    drawEdge(ctx, NODES[e.from], NODES[e.to], grow, grow);
  });

  NODES.forEach((n, i) => {
    drawNode(ctx, n, clamp((q - nodeTime(i)) / 0.1, 0, 1));
  });

  // 橙色记号扣标在检查点节点上
  CHECKPOINTS.forEach((idx) => {
    drawCheckpoint(ctx, NODES[idx], clamp((q - nodeTime(idx)) / 0.1, 0, 1), elapsed);
  });

  // 画布边框：蓝色描边表示论文方法
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 3;
  roundRectPath(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 10);
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, '中间产物都留在画布上', 36, 244, INK);
  drawLegend(ctx, 272);
}

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef<number | null>(null);

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
      const now = performance.now();
      if (t0Ref.current === null) t0Ref.current = now;
      render(ctx, now - t0Ref.current);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroNew;
