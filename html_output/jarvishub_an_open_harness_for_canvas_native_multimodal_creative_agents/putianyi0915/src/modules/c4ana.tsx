import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 类比卡：把这一行固定下来（560×140，2.6 秒循环）
// 一只手把尺子沿刚织好的一行压平，另一只手在该行末端做一次轻按标记；
// 尺子缓慢平移一次后停住，之后循环重来。

const W = 560;
const H = 140;
const CYCLE = 2600;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const INK = '#21324a';
const SEC = '#68778f';
const WOOD = '#92400e';
const ORANGE = '#f07e47';

const COLS = 6;
const ROWS = 5;
const CELL_W = 27;
const CELL_H = 17;
const OX = 46;
const OY = 12;

const GROUND_Y = H * 0.66;
const RULER_W = 174;
const RULER_H = 15;
const RULER_X = 32;
const RULER_SLIDE = 18;

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

/** 一个针织线圈：V 字形。 */
function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.44);
  ctx.quadraticCurveTo(cx - s * 0.2, cy + s * 0.3, cx, cy + s * 0.46);
  ctx.quadraticCurveTo(cx + s * 0.2, cy + s * 0.3, cx + s * 0.5, cy - s * 0.44);
  ctx.stroke();
  ctx.restore();
}

function rowY(row: number): number {
  return OY + row * CELL_H + CELL_H / 2;
}

/** 尺子：浅底 + 蓝色描边 + 刻度，左端接一个木色握柄。 */
function drawRuler(ctx: CanvasRenderingContext2D, x: number, cy: number): void {
  const y = cy - RULER_H / 2;
  ctx.save();
  roundRectPath(ctx, x, y, RULER_W, RULER_H, 4);
  ctx.fillStyle = LINE;
  ctx.fill();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.stroke();
  // 刻度
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 12; i++) {
    const tx = x + (RULER_W / 12) * i;
    const long = i % 3 === 0;
    ctx.beginPath();
    ctx.moveTo(tx, y + 2);
    ctx.lineTo(tx, y + (long ? 8 : 5));
    ctx.stroke();
  }
  // 木色握柄
  ctx.fillStyle = WOOD;
  roundRectPath(ctx, x - 12, y + 2, 14, RULER_H - 4, 3);
  ctx.fill();
  ctx.restore();
}

/** 压住织片的一只手：掌在上一根手指向下按。 */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, press: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#c08f6a';
  ctx.fillStyle = '#f2cdab';
  roundRectPath(ctx, -22 * s, -27 * s, 46 * s, 27 * s, 11 * s);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 2; i++) {
    roundRectPath(ctx, (-16 + i * 12) * s, -2 * s + press * 4 * s, 9 * s, 15 * s, 4.5 * s);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** 轻按留下的橙色的记号扣。 */
function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 5);
  ctx.lineTo(x + 15, y + 24);
  ctx.stroke();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const slide = easeInOutQuad(clamp(p / 0.68, 0, 1));
  const tap = Math.sin(clamp((p - 0.7) / 0.22, 0, 1) * Math.PI);
  const markIn = easeOutCubic(clamp((p - 0.78) / 0.14, 0, 1));
  const markOut = clamp((1 - p) / 0.06, 0, 1);
  const mark = markIn * markOut;

  // 既有织片：前四行
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      drawKnit(ctx, OX + c * CELL_W + CELL_W / 2, rowY(r), 23, BLUE, 3);
    }
  }
  // 刚织好的这一行：加粗，作为被压住的对象
  const lastY = rowY(ROWS - 1);
  for (let c = 0; c < COLS; c++) {
    drawKnit(ctx, OX + c * CELL_W + CELL_W / 2, lastY, 23, BLUE, 4);
  }

  const rx = RULER_X + RULER_SLIDE * slide;
  drawRuler(ctx, rx, lastY);
  drawMarker(ctx, rx + RULER_W - 14, lastY + 4, mark);
  drawHand(ctx, rx + RULER_W - 12, lastY - 26 + tap * 6, 0.92, tap);

  // 最多两个短标签
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('压住这一行', 34, 22);
  ctx.fillStyle = SEC;
  ctx.fillText('记下参数', 430, 122);
}

export const Ch4Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ch4Analogy;
