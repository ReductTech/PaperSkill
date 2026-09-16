import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 类比卡「退回到记号扣再补一小段」（560×140，2.8 秒循环）
// 一个主体（织片）+ 一个动作（取下记号扣，针尖退回那一行）+ 一个目标（只重织一小段）。
// 只出现真实编织物件：织片、线圈、记号扣、棒针、毛线球。

const W = 560;
const H = 140;
const CYCLE = 2800;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const YARN_DEEP = '#76906a';
const WOOD = '#92400e';
const ORANGE = '#f07e47';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const INK = '#21324a';
const SUB = '#68778f';

const PANEL_X = 150;
const PANEL_Y = 28;
const PANEL_W = 260;
const PANEL_H = 82;
const GROUND_Y = 118;
const COLS = 9;
const CELL_X = 28;
const ROW_Y = [45, 72, 99];

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

function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  width: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.18, cy + s * 0.34, cx, cy + s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.34, cx + s * 0.5, cy - s * 0.46);
  ctx.stroke();
  ctx.restore();
}

function colX(col: number): number {
  return PANEL_X + 18 + col * CELL_X;
}

/** 桌面上的毛线球：环境物件，始终不动。 */
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

/** 记号扣：橙色小环 + 一个把柄。 */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  visible: number
): void {
  if (visible <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = clamp(visible, 0, 1);
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = ORANGE;
  roundRectPath(ctx, x - 22, y - 3.5, 14, 7, 3.5);
  ctx.fill();
  ctx.restore();
}

/** 棒针：木色握柄 + 蓝色针身，针尖指向右侧。 */
function drawNeedle(ctx: CanvasRenderingContext2D, tipX: number, y: number, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tipX - 150, y - 16);
  ctx.lineTo(tipX, y);
  ctx.stroke();
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.arc(tipX - 152, y - 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;

  // 取下记号扣 → 上面那一小段淡化 → 针尖退回重织 → 记号扣别回
  const takeOff = clamp((p - 0.15) / 0.15, 0, 1);
  const putBack = clamp((p - 0.8) / 0.14, 0, 1);
  const markerVisible = 1 - takeOff + putBack * takeOff;
  const markerLift = takeOff * (1 - putBack);
  const fade = easeInOutQuad(clamp((p - 0.33) / 0.2, 0, 1));
  const knitP = clamp((p - 0.55) / 0.3, 0, 1);
  const revert = clamp((p - 0.88) / 0.12, 0, 1);

  // 织片底面
  ctx.save();
  roundRectPath(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 7);
  ctx.fillStyle = 'rgba(184,201,167,0.28)';
  ctx.fill();
  ctx.restore();

  // 未受影响的行（第 2、3 行），保持蓝色实心
  for (let r = 1; r < 3; r++) {
    for (let col = 0; col < COLS; col++) {
      drawKnit(ctx, colX(col), ROW_Y[r], 20, BLUE, 2.4, 1);
    }
  }

  // 顶上一小段：先淡化，再从左到右被重新织上
  const front = knitP * COLS;
  for (let col = 0; col < COLS; col++) {
    if (col + 0.5 < front) {
      drawKnit(ctx, colX(col), ROW_Y[0], 20, lerpColor(GREEN, BLUE, revert), 2.4, 1);
    } else {
      drawKnit(ctx, colX(col), ROW_Y[0], 20, BLUE, 2.4, 1 - 0.82 * fade);
    }
  }

  // 针尖退回那一行，只在这一小段上走一遍
  const needleAlpha = clamp(knitP / 0.12, 0, 1) * (1 - clamp((knitP - 0.95) / 0.05, 0, 1));
  const tipX = PANEL_X - 26 + knitP * (PANEL_W + 52);
  drawNeedle(ctx, tipX, ROW_Y[0], needleAlpha);

  // 记号扣与它标出的那一条线
  const markerY = PANEL_Y + 27;
  const markerX = PANEL_X - 24 - markerLift * 12;
  const markerYY = markerY - markerLift * 22;
  ctx.save();
  ctx.globalAlpha = clamp(markerVisible, 0, 1) * 0.65;
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(PANEL_X - 24, markerY);
  ctx.lineTo(PANEL_X + PANEL_W, markerY);
  ctx.stroke();
  ctx.restore();
  drawMarker(ctx, markerX, markerYY, markerVisible);

  // 桌面上的线球
  drawBall(ctx, 492, 104, 20);

  // 最多两个短标签
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText('取下记号扣', 36, 24);
  ctx.fillStyle = SUB;
  ctx.fillText('只重织一小段', 424, 24);
  ctx.restore();
}

export const Ch9Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ch9Analogy;
