import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡：一只手把三张拼图片依次放到三个并列的工具位上，
// 每放一次，对应位子亮起并短暂显出纹理。只有「手」一个运动主体。

const W = 560;
const H = 140;

const COLORS = {
  field: '#f5f8f0',
  board: '#b8c9a7',
  deep: '#76906a',
  edge: '#d7deea',
  aux: '#7c3aed',
  hand: '#92400e',
  text: '#21324a',
  muted: '#68778f',
  piece: '#ffffff',
};

const SLOTS = [170, 280, 390];
const HOME = [96, 122, 148];
const SLOT_W = 88;
const SLOT_H = 62;
const SLOT_Y = 48;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.field;
  ctx.fillRect(0, 0, W, H);
}

function drawBoard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COLORS.edge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, muted?: boolean): void {
  ctx.fillStyle = muted ? COLORS.muted : COLORS.text;
  ctx.font = muted
    ? '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    : '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, items: string[], x: number, y: number): void {
  const shown = items.slice(0, 3);
  let cx = x;
  shown.forEach((item, i) => {
    const color = i === 0 ? COLORS.text : i === 1 ? COLORS.deep : COLORS.aux;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + 7, y - 6, 6, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, item, cx + 20, y, true);
    cx += 20 + item.length * 18 + 26;
  });
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, holding: boolean): void {
  ctx.strokeStyle = COLORS.hand;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = COLORS.hand;
  roundRect(ctx, x - 11, y - 34, 22, 18, 6);
  ctx.fill();
  if (holding) {
    ctx.fillStyle = COLORS.deep;
    ctx.beginPath();
    ctx.arc(x, y - 12, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPieceMini(ctx: CanvasRenderingContext2D, x: number, y: number, tex: number, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = COLORS.piece;
  roundRect(ctx, x - 20, y - 14, 40, 28, 6);
  ctx.fill();
  ctx.strokeStyle = COLORS.deep;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 20, y - 14, 40, 28, 6);
  ctx.stroke();
  ctx.strokeStyle = COLORS.deep;
  ctx.lineWidth = 1;
  for (let i = 0; i < tex; i++) {
    const yy = y - 7 + i * 7;
    ctx.beginPath();
    ctx.moveTo(x - 13, yy);
    ctx.lineTo(x + 13, yy);
    ctx.stroke();
  }
  ctx.restore();
}

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const CYCLE = 4200;
    const STARTS = [0.05, 0.22, 0.39];
    const FLIGHT = 0.14;

    const draw = () => {
      const t = (Date.now() % CYCLE) / CYCLE;
      clearScene(ctx);
      drawBoard(ctx, 16, 30, W - 32, 98, 0.4);

      const placeAt = (i: number) => STARTS[i] + FLIGHT;
      const settle = clamp((t - 0.66) / 0.08, 0, 1);
      const relight = clamp((t - 0.86) / 0.12, 0, 1);

      let handX = HOME[2];
      let handY = 104;
      let holding = false;
      let handVisible = false;
      for (let i = 0; i < 3; i++) {
        if (t >= STARTS[i] - 0.02 && t <= placeAt(i) + 0.04) {
          const u = clamp((t - STARTS[i]) / FLIGHT, 0, 1);
          handX = HOME[i] + (SLOTS[i] - HOME[i]) * easeInOutQuad(u);
          handY = 104 - 34 * Math.sin(Math.PI * u);
          holding = u < 0.85;
          handVisible = true;
        }
      }
      if (t > 0.82 && t < 0.92) {
        const u = clamp((t - 0.82) / 0.1, 0, 1);
        handX = SLOTS[2] + (HOME[2] - SLOTS[2]) * u;
        handY = 104;
        handVisible = true;
      }

      drawSceneLabel(ctx, '三个位子，一条链', 24, 22);
      drawLegend(ctx, ['手', '工具位', '已就位'], 324, 22);

      for (let i = 0; i < 3; i++) {
        const x = SLOTS[i];
        const placed = t >= placeAt(i);
        const lit = placed ? (t > 0.82 ? relight : 1) : 0;
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.45 * lit;
        ctx.fillStyle = lit > 0.5 ? '#ffffff' : COLORS.board;
        roundRect(ctx, x - SLOT_W / 2, SLOT_Y, SLOT_W, SLOT_H, 10);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = lit > 0.5 ? COLORS.aux : COLORS.edge;
        ctx.lineWidth = lit > 0.5 ? 3 : 2;
        roundRect(ctx, x - SLOT_W / 2, SLOT_Y, SLOT_W, SLOT_H, 10);
        ctx.stroke();
        if (!placed) {
          ctx.strokeStyle = COLORS.deep;
          ctx.lineWidth = 1;
          for (let k = 0; k < 3; k++) {
            const yy = SLOT_Y + 18 + k * 12;
            ctx.beginPath();
            ctx.moveTo(x - 28, yy);
            ctx.lineTo(x + 28, yy);
            ctx.stroke();
          }
        }
        if (placed) {
          ctx.save();
          ctx.globalAlpha = settle;
          ctx.fillStyle = COLORS.text;
          ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✓', x, SLOT_Y + SLOT_H / 2 + 1);
          ctx.restore();
        }
      }

      for (let i = 0; i < 3; i++) {
        if (t >= STARTS[i] && t <= placeAt(i) + 0.02 && t < 0.86) {
          const u = clamp((t - STARTS[i]) / FLIGHT, 0, 1);
          const x = HOME[i] + (SLOTS[i] - HOME[i]) * easeInOutQuad(u);
          drawPieceMini(ctx, x, 112 - 34 * Math.sin(Math.PI * u), i + 1, 1);
        } else if (t < STARTS[i]) {
          drawPieceMini(ctx, HOME[i], 112, i + 1, 1);
        }
      }

      if (handVisible) drawHand(ctx, handX, handY, holding);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      draw();
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

  return (
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
  );
};

export default Ana8;
