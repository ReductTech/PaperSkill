import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 类比卡：只让这一针穿过去（560×140，2.4 秒循环）
// 一只手把线头对准针眼推过去，线从小孔中穿出并被拉直；
// 只做一次穿过动作，针与桌面不动。

const W = 560;
const H = 140;
const CYCLE = 2400;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const INK = '#21324a';
const SEC = '#68778f';
const WOOD = '#92400e';
const RED = '#c43f52';
const YARN_DEEP = '#76906a';

const GROUND_Y = H * 0.66;
const NEEDLE_Y = 72;
const EYE_X = 172;
const S = { x: 362, y: 116 };
const T = { x: 78, y: 34 };

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

/** 横向的针：浅色针身、右端针尖、左端木色尾柄，中间留出针眼。 */
function drawNeedle(ctx: CanvasRenderingContext2D): void {
  const y = NEEDLE_Y;
  ctx.save();
  roundRectPath(ctx, 98, y - 4.5, 332, 9, 4.5);
  ctx.fillStyle = LINE;
  ctx.fill();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // 针尖
  ctx.beginPath();
  ctx.moveTo(428, y - 4.5);
  ctx.lineTo(448, y);
  ctx.lineTo(428, y + 4.5);
  ctx.closePath();
  ctx.fillStyle = LINE;
  ctx.fill();
  ctx.stroke();
  // 木色尾柄
  ctx.fillStyle = WOOD;
  roundRectPath(ctx, 86, y - 6, 15, 12, 4);
  ctx.fill();
  // 针眼
  ctx.beginPath();
  ctx.ellipse(EYE_X, y, 15, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = BG;
  ctx.fill();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** 一段摆动的线。 */
function drawStrand(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  amp: number,
  color: string,
  width: number,
  dashed: boolean
): void {
  const segs = 16;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const nx = -dy / len;
  const ny = dx / len;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const bump = Math.sin(t * Math.PI) * amp;
    const x = x1 + dx * t + nx * bump;
    const y = y1 + dy * t + ny * bump;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** 被拦下的一段线：虚线到不了针身，末端一个小横杠。 */
function drawBlocked(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawStrand(ctx, x1, y1, x2, y2, 4, RED, 2.5, true);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x2 - 7, y2 + 6);
  ctx.lineTo(x2 + 7, y2 - 6);
  ctx.stroke();
  ctx.restore();
}

/** 捏着线头的一只手。 */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.5);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#c08f6a';
  ctx.fillStyle = '#f2cdab';
  roundRectPath(ctx, -18 * s, -14 * s, 40 * s, 27 * s, 11 * s);
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, -30 * s, -9 * s, 20 * s, 9 * s, 4.5 * s);
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, -30 * s, 3 * s, 20 * s, 9 * s, 4.5 * s);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const push = easeInOutQuad(clamp(p / 0.58, 0, 1));
  const through = easeOutCubic(clamp((p - 0.6) / 0.2, 0, 1));
  const settle = clamp((p - 0.8) / 0.2, 0, 1);

  // 其余位置的线：够不到针眼，保持不动
  drawBlocked(ctx, 470, 108, 356, 88, 0.45);
  drawBlocked(ctx, 470, 128, 300, 108, 0.3);

  // 线头：从右下推向针眼；针身与针眼后画，正好盖住线头尖端，像是穿进了孔里
  const hx = S.x + (EYE_X - S.x) * push;
  const hy = S.y + (NEEDLE_Y - S.y) * push - Math.sin(push * Math.PI) * 10;
  drawStrand(ctx, S.x, S.y, hx, hy, (1 - push) * 7 + 1.5, YARN_DEEP, 3, false);

  drawNeedle(ctx);

  // 穿出的一段：由弯变直，即被拉直
  if (through > 0.01) {
    const tx = EYE_X + (T.x - EYE_X) * through;
    const ty = NEEDLE_Y + (T.y - NEEDLE_Y) * through;
    drawStrand(ctx, EYE_X, NEEDLE_Y, tx, ty, (1 - settle) * 9, YARN_DEEP, 3, false);
  }

  drawHand(ctx, hx + 16, hy + 12, 0.9);

  // 最多两个短标签
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('对准针眼', 24, 22);
  ctx.fillStyle = SEC;
  ctx.fillText('只放行这一根', 296, 22);
}

export const Ch5Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ch5Analogy;
