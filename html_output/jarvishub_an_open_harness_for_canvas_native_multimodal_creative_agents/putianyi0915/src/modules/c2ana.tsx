import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 类比卡：把材料固定在桌上（560×140，2.6 秒循环）
// 一只手把线球从画面右侧移到桌面左上角的固定圆位，放稳后轻按一下。
// 桌面与线球尺寸固定，只有位置、按压力度与固定环的状态在变。

const W = 560;
const H = 140;
const CYCLE = 2600;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const YARN_DEEP = '#76906a';
const BLUE = '#27446e';
const INK = '#21324a';
const SUB = '#68778f';

const RING_X = 100;
const RING_Y = 70;
const RING_R = 26;
const BALL_R = 22;
const START_X = 468;
const START_Y = 78;

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

function drawBall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sx: number,
  sy: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sx, sy);
  ctx.beginPath();
  ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = YARN;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(i * BALL_R * 0.52, -BALL_R * 1.05, BALL_R * 1.12, 0.34 * Math.PI, 0.66 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sx, sy);
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
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

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const landed = p >= 0.55;

  // 固定圆位：未固定时灰色虚线，固定后蓝色实线
  ctx.save();
  ctx.strokeStyle = landed ? BLUE : LINE;
  ctx.lineWidth = landed ? 4 : 2;
  ctx.setLineDash(landed ? [] : [6, 5]);
  ctx.beginPath();
  ctx.arc(RING_X, RING_Y, RING_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // 十字定位记号
  ctx.save();
  ctx.strokeStyle = landed ? 'rgba(39,68,110,0.35)' : LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(RING_X - 8, RING_Y);
  ctx.lineTo(RING_X + 8, RING_Y);
  ctx.moveTo(RING_X, RING_Y - 8);
  ctx.lineTo(RING_X, RING_Y + 8);
  ctx.stroke();
  ctx.restore();

  // 位置与按压力度
  const travel = clamp(p / 0.55, 0, 1);
  const u = easeInOutQuad(travel);
  const press =
    p < 0.55 ? 0 : p < 0.74 ? easeInOutQuad((p - 0.55) / 0.19) : 1 - clamp((p - 0.74) / 0.26, 0, 1);
  const bx = lerp(START_X, RING_X, u);
  const by = lerp(START_Y, RING_Y, u) - Math.sin(Math.PI * u) * 24;
  const squash = press * 0.16;

  drawBall(ctx, bx, by + press * 4, 1 + squash, 1 - squash);

  // 固定后的接受脉冲
  if (landed) {
    const pulse = clamp((p - 0.55) / 0.45, 0, 1);
    ctx.save();
    ctx.strokeStyle = `rgba(39,68,110,${(1 - pulse) * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(RING_X, RING_Y, RING_R + 6 + pulse * 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawHand(ctx, bx + 34, by + 2 + press * 5, 1);

  // 最多两个短标签
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('固定位', 40, 30);
  ctx.fillStyle = SUB;
  ctx.fillText('线球', 416, 46);
}

export const Ch2Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ch2Analogy;
