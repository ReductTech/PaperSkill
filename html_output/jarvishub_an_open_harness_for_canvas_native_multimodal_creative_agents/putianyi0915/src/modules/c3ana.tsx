import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 类比卡：把两根线头打成一个结（560×140，2.8 秒循环）
// 一只手捏住右侧线头，移到左侧线头处绕一圈打结并收紧；结形成后两段线绷紧一次。
// 桌面与线球静止，只有手与线头在动。

const W = 560;
const H = 140;
const CYCLE = 2800;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const YARN_DEEP = '#76906a';
const BLUE = '#27446e';
const INK = '#21324a';
const SUB = '#68778f';

const KNOT_X = 296;
const KNOT_Y = 80;
const BALL_X = 496;
const BALL_Y = 112;
const BALL_R = 16;

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

function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = YARN;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * r * 0.7, cy - r * 1.05, r * 1.14, 0.34 * Math.PI, 0.66 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 2;
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

function strand(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const approach = clamp(p / 0.45, 0, 1);
  const wrap = clamp((p - 0.45) / 0.29, 0, 1);
  const tighten = clamp((p - 0.74) / 0.26, 0, 1);
  const au = easeInOutQuad(approach);
  const wu = easeInOutQuad(wrap);
  const tu = easeInOutQuad(tighten);

  // 右侧线头：被手捏着移动
  const rx = lerp(372, 314, au) + tu * 4;
  const ry = lerp(90, 82, au) - tu * 2;
  // 左侧线头：打结时被带回结心
  const lx = lerp(262, 280, tu);
  const ly = lerp(86, 82, tu);
  // 绷紧后的一次轻微回弹
  const taut = tu > 0.98 ? Math.sin(p * 90) * 1.6 * Math.min(1, (p - 0.98) * 40) : 0;

  drawBall(ctx, BALL_X, BALL_Y, BALL_R);

  // 两段线的弯曲程度随收紧而下降
  const sag = 1 - tu * 0.75;
  strand(ctx, 24, 108, 150, 118 * sag + 20, lx, ly + taut, 4);
  strand(ctx, 536, 58, 430, 58 + 26 * sag, rx, ry + taut, 4);

  // 绕一圈打成的结
  const ringR = lerp(0, 15, wu) - tu * 9;
  if (ringR > 0.5) {
    ctx.save();
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(KNOT_X, KNOT_Y, ringR, ringR * 0.62, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = YARN_DEEP;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(KNOT_X, KNOT_Y, ringR * 0.55, ringR * 0.36, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 手跟着右侧线头，打结时绕到结的一侧
  const handX = lerp(rx + 36, KNOT_X + 58, wu * 0.7) + tu * 12;
  const handY = lerp(ry + 4, KNOT_Y - 18, wu * 0.7) + 8;
  drawHand(ctx, handX, handY, 1);

  // 最多两个短标签
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('打成结', 236, 30);
  ctx.fillStyle = SUB;
  ctx.fillText('线头', 396, 34);
}

export const Ch3Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ch3Analogy;
