import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 类比卡：拆掉刚织好的一段（560×140，3.0 秒循环）
// 一只手捏住织片边缘向外抽线；线圈逐个脱散，线段缩短并回到右下角的线球。
// 织物与线球尺寸固定，只有线的长度和线圈数量在变。

const W = 560;
const H = 140;
const CYCLE = 3000;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const YARN_DEEP = '#76906a';
const WOOD = '#92400e';
const RED = '#c43f52';
const INK = '#21324a';

const COLS = 6;
const ROWS = 4;
const CELL_W = 30;
const CELL_H = 22;
const ORIGIN_X = 44;
const ORIGIN_Y = 34;
const TOTAL = COLS * ROWS;
const BALL_X = 486;
const BALL_Y = 106;
const BALL_R = 24;

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
  ctx.fillRect(0, H * 0.66, W, H * 0.34);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.66);
  ctx.lineTo(W, H * 0.66);
  ctx.stroke();
}

/** 一个针织线圈：V 字形。 */
function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  dashed: boolean,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [4, 4] : []);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.18, cy + s * 0.34, cx, cy + s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.34, cx + s * 0.5, cy - s * 0.46);
  ctx.stroke();
  ctx.restore();
}

function cellCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: ORIGIN_X + col * CELL_W + CELL_W / 2,
    y: ORIGIN_Y + row * CELL_H + CELL_H / 2,
  };
}

/** 第 order 个线圈（0 = 先织）所在行列：自下而上、每行自左向右。 */
function cellOfOrder(order: number): { col: number; row: number } {
  return { col: order % COLS, row: ROWS - 1 - Math.floor(order / COLS) };
}

function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = YARN;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * r * 0.52, cy - r * 1.05, r * 1.12, 0.34 * Math.PI, 0.66 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.12);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#c08f6a';
  ctx.fillStyle = '#f2cdab';
  roundRectPath(ctx, -6 * s, -12 * s, 26 * s, 26 * s, 9 * s);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    roundRectPath(ctx, -27 * s, (-11 + i * 8) * s, 23 * s, 6.5 * s, 3.2 * s);
    ctx.fill();
    ctx.stroke();
  }
  roundRectPath(ctx, 2 * s, 12 * s, 16 * s, 7 * s, 3.5 * s);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** 从织片边缘垂到线球的一段线，波幅随收回变紧而变小。 */
function drawStrand(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  amp: number
): void {
  const segs = 18;
  ctx.save();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 26 + Math.sin(t * Math.PI * 4) * amp;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const removed = clamp(Math.floor(p * TOTAL), 0, TOTAL);
  const pulling = removed < TOTAL ? p * TOTAL - removed : 0;

  // 已抽掉的线圈：散乱、下垂
  for (let order = TOTAL - 1; order >= TOTAL - removed; order--) {
    const k = TOTAL - 1 - order; // 已抽掉的序号（0 = 最先被抽）
    const droop = clamp((removed - 1 - k) * 1.6, 0, 22);
    const c = cellCenter(cellOfOrder(order).col, cellOfOrder(order).row);
    ctx.save();
    ctx.globalAlpha = 0.75;
    drawKnit(ctx, c.x, c.y + droop, 20, LINE, true, 2);
    ctx.restore();
  }

  // 仍织在片上的线圈：蓝色实心
  for (let order = 0; order < TOTAL - removed; order++) {
    const cell = cellOfOrder(order);
    const c = cellCenter(cell.col, cell.row);
    drawKnit(ctx, c.x, c.y, 20, '#27446e', false, 3.5);
  }

  // 正在被抽出的那一针：红色松脱、向外下垂
  let edge = cellCenter(0, ROWS - 1);
  if (removed < TOTAL) {
    const cell = cellOfOrder(TOTAL - 1 - removed);
    const c = cellCenter(cell.col, cell.row);
    ctx.save();
    ctx.globalAlpha = 1 - pulling * 0.5;
    drawKnit(ctx, c.x + pulling * 22, c.y + pulling * 10, 20, RED, true, 3);
    ctx.restore();
    edge = c;
  } else {
    const cell = cellOfOrder(TOTAL - 1);
    edge = cellCenter(cell.col, cell.row);
  }

  drawStrand(ctx, edge.x, edge.y, BALL_X, BALL_Y, 12 * (1 - p) + 2);
  drawBall(ctx, BALL_X, BALL_Y, BALL_R);

  // 一只手捏住织片边缘向外抽线
  drawHand(ctx, edge.x + 34 + pulling * 20, edge.y + 6 + Math.sin(p * 26) * 3, 1);

  // 棒针：固定在织片下方，针尖朝向被抽的那一段
  ctx.save();
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(34, H * 0.66 + 8);
  ctx.lineTo(240, H * 0.66 + 2);
  ctx.stroke();
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.arc(34, H * 0.66 + 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 最多两个短标签
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('拆掉这一段', 40, 20);
  ctx.fillStyle = '#68778f';
  ctx.fillText('退回线球', 420, 52);
}

export const Ch1Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

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
      render(ctx, performance.now());
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

export default Ch1Analogy;
