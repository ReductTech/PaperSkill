import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 类比卡「在缺陷处别上记号扣」（560×140，2.6 秒循环）
// 一个主体（手指）+ 一个动作（扫过并别上记号扣）+ 一个目标（漏针处）。
// 手指沿织片表面缓慢扫过，停在一处松脱线圈上方，随即把橙色记号扣别在该位置；织片本身不动。

const W = 560;
const H = 140;
const CYCLE = 2600;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN_DEEP = '#76906a';
const WOOD = '#92400e';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const BLUE = '#27446e';
const INK = '#21324a';
const SUB = '#68778f';

const COLS = 8;
const ROWS = 4;
const CELL_W = 26;
const CELL_H = 20;
const ORIGIN_X = 120;
const ORIGIN_Y = 30;
const BAD_COL = 5;
const BAD_ROW = 1;
const GROUND_Y = 112;

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

/** 漏针所在的那个线圈，落在线圈阵列里的固定格子。 */
function badPos(): { x: number; y: number } {
  return {
    x: ORIGIN_X + BAD_COL * CELL_W + CELL_W / 2,
    y: ORIGIN_Y + BAD_ROW * CELL_H + CELL_H / 2,
  };
}

/** 橙色记号扣：一枚开口小环，placed 为真时别住（画出扣合的短横）。 */
function drawMarker(ctx: CanvasRenderingContext2D, cx: number, cy: number, placed: boolean): void {
  ctx.save();
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0.18 * Math.PI, 1.82 * Math.PI, false);
  ctx.stroke();
  if (placed) {
    ctx.beginPath();
    ctx.moveTo(cx + 5, cy - 9);
    ctx.lineTo(cx + 11, cy - 3);
    ctx.stroke();
  }
  ctx.restore();
}

/** 一只手（食指朝下），指尖落在 (x, y)。 */
function drawFinger(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = '#f2cdab';
  ctx.strokeStyle = '#c08f6a';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, x - 9, y - 44, 18, 44, 9);
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, x - 18, y - 21, 10, 17, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8b895';
  roundRectPath(ctx, x - 5, y - 41, 10, 11, 5);
  ctx.fill();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const bad = badPos();

  // 桌面上的棒针：环境物件，始终不动
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(34, 126);
  ctx.lineTo(206, 120);
  ctx.stroke();
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.arc(34, 126, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(206, 120);
  ctx.lineTo(196, 115);
  ctx.lineTo(196, 125);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 织片：已织好的线圈（蓝）
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (row === BAD_ROW && col === BAD_COL) continue;
      const cx = ORIGIN_X + col * CELL_W + CELL_W / 2;
      const cy = ORIGIN_Y + row * CELL_H + CELL_H / 2;
      drawKnit(ctx, cx, cy, 18, BLUE, false, 3.2);
    }
  }

  // 漏针处：松脱的红色线圈 + 露出的线头
  const sag = 5 + Math.sin(time / 230) * 2.5;
  drawKnit(ctx, bad.x, bad.y + 2, 20, RED, true, 3.4);
  ctx.save();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bad.x - 9, bad.y + 6);
  ctx.quadraticCurveTo(bad.x - 3, bad.y + 12 + sag, bad.x + 7, bad.y + 6 + sag * 1.6);
  ctx.stroke();
  ctx.restore();

  // 记号扣：从上方落下，落定后别住
  const drop = easeOutCubic(clamp((p - 0.46) / 0.28, 0, 1));
  drawMarker(ctx, bad.x, lerp(-14, bad.y, drop), p >= 0.74);

  // 手指：先扫过织片表面，停在漏针上方，随后收回
  const app = easeInOutQuad(clamp(p / 0.42, 0, 1));
  const back = easeInOutQuad(clamp((p - 0.8) / 0.2, 0, 1));
  const fx = lerp(150, bad.x, app) + back * 62;
  const fy = lerp(bad.y - 34, bad.y - 40, app) - back * 28 + Math.sin(time / 300) * 1.6;
  drawFinger(ctx, fx, fy);

  // 最多两个短标签
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText('找到漏针', 40, 24);
  ctx.fillStyle = SUB;
  ctx.fillText('别上记号扣', 428, 24);
  ctx.restore();
}

export const Ch7Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

export default Ch7Analogy;
