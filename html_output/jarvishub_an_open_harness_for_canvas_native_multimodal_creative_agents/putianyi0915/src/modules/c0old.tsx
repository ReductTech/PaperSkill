import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 旧方法侧（520×280）：提示-输出 / 聊天式画布。
// 画布上只有一个孤立的成品缩略块，周围是灰色的「已丢失」空位；橙色描边表示旧方法。
// 时间基准：自本 Canvas 首次进入视口起算，3 秒一个周期——每 3 秒把中间的成品抽走再放回，
// 表示每一轮都从零重来。与 c0new 使用同一周期，两侧同步。

const W = 520;
const H = 280;
const CYCLE = 3000;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const INK = '#21324a';
const SUB = '#68778f';

const CARD_X = 24;
const CARD_Y = 18;
const CARD_W = 472;
const CARD_H = 176;

const BLOCK_W = 96;
const BLOCK_H = 62;
const BLOCK_X = 260 - BLOCK_W / 2;
const BLOCK_Y = 106 - BLOCK_H / 2;

const GHOSTS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 64, y: 42, w: 84, h: 52 },
  { x: 64, y: 112, w: 84, h: 52 },
  { x: 364, y: 42, w: 84, h: 52 },
  { x: 364, y: 112, w: 84, h: 52 },
  { x: 212, y: 28, w: 96, h: 34 },
  { x: 212, y: 152, w: 96, h: 34 },
];

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

/** 已丢失的空位：灰色虚线框 + 一个虚线线圈。 */
function drawGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = SUB;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.stroke();
  drawKnit(ctx, x + w / 2, y + h / 2, 34, SUB, 2.5);
  ctx.restore();
}

/** 本轮唯一的成品：一块织好的缩略织片。alpha / scale / lift 由动画驱动。 */
function drawBlock(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  scale: number,
  lift: number
): void {
  if (alpha <= 0.01) return;
  const cx = BLOCK_X + BLOCK_W / 2;
  const cy = BLOCK_Y + BLOCK_H / 2;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(cx, cy + lift);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  roundRectPath(ctx, BLOCK_X, BLOCK_Y, BLOCK_W, BLOCK_H, 8);
  ctx.fillStyle = BLUE;
  ctx.fill();
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      drawKnit(
        ctx,
        BLOCK_X + 16 + col * 22,
        BLOCK_Y + 13 + row * 19,
        20,
        'rgba(255,255,255,0.5)',
        2
      );
    }
  }
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
  const items: Array<{ color: string; text: string; dashed: boolean }> = [
    { color: BLUE, text: '本轮成品', dashed: false },
    { color: SUB, text: '已丢失', dashed: true },
  ];
  let x = 36;
  ctx.save();
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.save();
    ctx.strokeStyle = it.color;
    ctx.fillStyle = it.color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash(it.dashed ? [4, 4] : []);
    ctx.strokeRect(x, y - 11, 20, 13);
    if (!it.dashed) ctx.fillRect(x, y - 11, 20, 13);
    ctx.restore();
    ctx.fillStyle = SUB;
    ctx.fillText(it.text, x + 27, y);
    x += 27 + it.text.length * 15 + 26;
  });
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, elapsed: number): void {
  clearScene(ctx);

  // 空画布：只剩一块在正中的成品，其余位置都是已丢失的空位
  GHOSTS.forEach((g) => drawGhost(ctx, g.x, g.y, g.w, g.h));

  // 3 秒一个周期：抽走 → 空缺 → 重新出现
  const p = (elapsed % CYCLE) / CYCLE;
  let alpha = 1;
  let scale = 1;
  let lift = 0;
  if (p < 0.55) {
    alpha = 1;
  } else if (p < 0.7) {
    const t = easeInOutQuad(clamp((p - 0.55) / 0.15, 0, 1));
    alpha = 1 - t;
    scale = 1 - 0.3 * t;
    lift = -54 * t;
  } else if (p < 0.86) {
    alpha = 0;
    scale = 0.7;
    lift = -54;
  } else {
    const t = easeInOutQuad(clamp((p - 0.86) / 0.14, 0, 1));
    alpha = t;
    scale = 0.7 + 0.3 * t;
    lift = 22 * (1 - t);
  }
  drawBlock(ctx, alpha, scale, lift);

  // 画布边框：橙色描边表示旧方法
  ctx.save();
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 3;
  roundRectPath(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 10);
  ctx.stroke();
  ctx.restore();

  drawLabel(ctx, '每轮重来一次', 36, 244, INK);
  drawLegend(ctx, 272);
}

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default HeroOld;
