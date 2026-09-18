import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  lerpColor,
  easeInOutQuad,
  easeOutCubic,
} from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 类比卡：从一排里挑出该织的那一个（560×140，3.0 秒循环）
// 手指沿一排线圈从左到右缓慢移动，停在其中一个上；
// 棒针随即穿过该线圈并把它织上，只做一次「寻位—穿过」。

const W = 560;
const H = 140;
const CYCLE = 3000;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const INK = '#21324a';
const SEC = '#68778f';
const WOOD = '#92400e';
const YARN = '#b8c9a7';

const GROUND_Y = H * 0.66;
const COLS = 7;
const COL_W = 48;
const ROW_X = 76;
const ROW_Y = 76;
const PICK = 4;

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

function colX(i: number): number {
  return ROW_X + i * COL_W;
}

/** 棒针：从针尾到针尖的一条粗线，尾端木色。 */
function drawNeedle(
  ctx: CanvasRenderingContext2D,
  tailX: number,
  tailY: number,
  tipX: number,
  tipY: number
): void {
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.arc(tailX, tailY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 向下指的一根手指。 */
function drawFinger(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, press: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#c08f6a';
  ctx.fillStyle = '#f2cdab';
  roundRectPath(ctx, -7 * s, 0, 15 * s, (34 + press * 6) * s, 7 * s);
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, -27 * s, -24 * s, 54 * s, 27 * s, 12 * s);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const walk = easeInOutQuad(clamp(p / 0.5, 0, 1));
  const bob = Math.sin(clamp((p - 0.5) / 0.12, 0, 1) * Math.PI);
  const nt = easeOutCubic(clamp((p - 0.62) / 0.2, 0, 1));
  const knit = clamp((p - 0.8) / 0.16, 0, 1);

  // 一排待织的线圈
  for (let i = 0; i < COLS; i++) {
    const c = i === PICK ? lerpColor(YARN, BLUE, knit) : YARN;
    drawKnit(ctx, colX(i), ROW_Y, 25, c, i === PICK ? 3 + knit : 3);
  }

  // 棒针：从右下推出，只穿过被选中的那一个
  const tipX = lerp(126, colX(PICK), nt);
  const tipY = lerp(134, ROW_Y + 4, nt);
  drawNeedle(ctx, tipX - 168, tipY + 60, tipX, tipY);

  // 手指：寻位 — 停住 — 穿过时微微下压
  const fingerX = colX(lerp(0, PICK, walk));
  drawFinger(ctx, fingerX, 30, 0.95, bob * 0.6 + knit * 0.6);

  // 最多两个短标签
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('逐针寻找', 20, 128);
  ctx.fillStyle = SEC;
  ctx.fillText('就织这一针', 322, 128);
}

export const Ch6Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ch6Analogy;
