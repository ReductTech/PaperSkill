import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10 类比卡「把两件成品并排对齐」（560×140，2.6 秒循环）
// 一个主体（两片织好的成品）+ 一个动作（一只手把它们推到桌面中线上）+ 一个目标（对齐后收针定型）。
// 只有织片与手在动；线球是环境物件，始终不动。

const W = 560;
const H = 140;
const CYCLE = 2600;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const YARN_DEEP = '#76906a';
const ORANGE = '#f07e47';
const INK = '#21324a';
const SUB = '#68778f';

const GROUND_Y = 118;
const PANEL_Y = 34;
const PANEL_W = 148;
const PANEL_H = 62;

const LEFT_FROM = 60;
const LEFT_TO = 122;
const RIGHT_FROM = 350;
const RIGHT_TO = 290;

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
  width: number
): void {
  ctx.save();
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

/** 一片织好的成品：底面 + 4×5 线圈；tightened 驱动顶边的收针动作。 */
function drawPanel(ctx: CanvasRenderingContext2D, x: number, tightened: number): void {
  ctx.save();
  roundRectPath(ctx, x, PANEL_Y, PANEL_W, PANEL_H, 6);
  ctx.fillStyle = 'rgba(184,201,167,0.42)';
  ctx.fill();
  ctx.restore();

  const squeeze = 1 - 0.12 * tightened;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      drawKnit(ctx, x + 18 + col * 28, PANEL_Y + 11 + row * 14 * squeeze, 16, YARN_DEEP, 2);
    }
  }

  if (tightened > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(tightened, 0, 1);
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 6, PANEL_Y + 1);
    ctx.lineTo(x + 6 + (PANEL_W - 12) * clamp(tightened, 0, 1), PANEL_Y + 1);
    ctx.stroke();
    ctx.restore();
  }
}

/** 一只手：捏住织片边缘并推动。 */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.fillStyle = '#f2cdab';
  ctx.strokeStyle = '#c08f6a';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, -8, -13, 26, 26, 9);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    roundRectPath(ctx, -28, -12 + i * 8, 24, 6.5, 3.2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const align = easeInOutQuad(clamp(p / 0.35, 0, 1));
  const bind = easeOutCubic(clamp((p - 0.4) / 0.35, 0, 1));
  const settle = clamp((p - 0.75) / 0.1, 0, 1);

  const leftX = LEFT_FROM + (LEFT_TO - LEFT_FROM) * align;
  const rightX = RIGHT_FROM + (RIGHT_TO - RIGHT_FROM) * align;

  // 桌面中线上的一条对齐线
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.5 * align;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(280, GROUND_Y - 78);
  ctx.lineTo(280, GROUND_Y - 6);
  ctx.stroke();
  ctx.restore();

  // 桌面上的线球：环境物件，始终不动
  ctx.save();
  ctx.beginPath();
  ctx.arc(498, 106, 17, 0, Math.PI * 2);
  ctx.fillStyle = YARN;
  ctx.fill();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  drawPanel(ctx, leftX, 0);
  drawPanel(ctx, rightX, bind);

  // 一只手：先把右侧那片推向中线，再沿它的顶边做一次收针
  const moveT = easeInOutQuad(clamp((p - 0.4) / 0.3, 0, 1));
  const pushX = rightX + PANEL_W + 16;
  const pushY = PANEL_Y + PANEL_H / 2;
  const bindX = rightX + 10 + (PANEL_W - 20) * bind;
  const bindY = PANEL_Y - 2;
  const hx = pushX + (bindX - pushX) * moveT;
  const hy = pushY + (bindY - pushY) * moveT;
  ctx.save();
  ctx.globalAlpha = clamp(1 - 0.75 * settle, 0, 1);
  drawHand(ctx, hx, hy);
  ctx.restore();

  // 最多两个短标签
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText('并排对齐', 36, 24);
  ctx.fillStyle = SUB;
  ctx.fillText('收针定型', 442, 24);
  ctx.restore();
}

export const Ch10Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ch10Analogy;
