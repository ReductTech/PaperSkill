import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡：一只手把参考卡一张张放到待查片右侧，排成一小叠；
// 每放一张，两片的纹理线自动对齐一次。只有「手」一个运动主体。

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
  card: '#ffffff',
};

const QUERY = { x: 64, y: 44, w: 104, h: 68 };
const CARD_W = 62;
const CARD_H = 46;
const CARD_Y = 56;
const CARD_XS = [198, 268, 338];
const HOME_X = [118, 140, 162];
const HOME_Y = 116;

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
    cx += 20 + item.length * 18 + 24;
  });
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, holding: boolean): void {
  ctx.strokeStyle = COLORS.hand;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  ctx.fillStyle = COLORS.hand;
  roundRect(ctx, x - 11, y - 32, 22, 18, 6);
  ctx.fill();
  if (holding) {
    ctx.fillStyle = COLORS.deep;
    ctx.beginPath();
    ctx.arc(x, y - 11, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCardMini(ctx: CanvasRenderingContext2D, cx: number, cy: number, lid: number, alpha: number): void {
  const x = cx - CARD_W / 2;
  const y = cy - CARD_H / 2;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = lid === 0 ? '#eef2e6' : COLORS.card;
  roundRect(ctx, x, y, CARD_W, CARD_H, 6);
  ctx.fill();
  ctx.strokeStyle = lid === 0 ? COLORS.edge : COLORS.aux;
  ctx.lineWidth = lid === 0 ? 2 : 2;
  roundRect(ctx, x, y, CARD_W, CARD_H, 6);
  ctx.stroke();
  if (lid > 0) {
    ctx.fillStyle = COLORS.edge;
    ctx.beginPath();
    ctx.moveTo(x + CARD_W - 14, y);
    ctx.lineTo(x + CARD_W, y);
    ctx.lineTo(x + CARD_W, y + 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = COLORS.deep;
  ctx.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    const yy = y + 12 + k * 10;
    ctx.beginPath();
    ctx.moveTo(x + 8, yy);
    ctx.lineTo(x + CARD_W - 8, yy);
    ctx.stroke();
  }
  ctx.restore();
}

export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const CYCLE = 3600;
    const STARTS = [0.06, 0.22, 0.38];
    const FLIGHT = 0.13;

    const draw = () => {
      const t = (Date.now() % CYCLE) / CYCLE;
      clearScene(ctx);
      drawBoard(ctx, 16, 30, W - 32, 98, 0.4);

      const placeAt = (i: number) => STARTS[i] + FLIGHT;
      const align = clamp((t - 0.56) / 0.08, 0, 1);

      let handX = HOME_X[2];
      let handY = 108;
      let holding = false;
      let handVisible = false;
      for (let i = 0; i < 3; i++) {
        if (t >= STARTS[i] - 0.02 && t <= placeAt(i) + 0.03) {
          const u = clamp((t - STARTS[i]) / FLIGHT, 0, 1);
          handX = HOME_X[i] + (CARD_XS[i] - HOME_X[i]) * easeInOutQuad(u);
          handY = 108 - 30 * Math.sin(Math.PI * u);
          holding = u < 0.85;
          handVisible = true;
        }
      }
      if (t > 0.8 && t < 0.9) {
        const u = clamp((t - 0.8) / 0.1, 0, 1);
        handX = CARD_XS[2] + (HOME_X[2] - CARD_XS[2]) * u;
        handY = 108;
        handVisible = true;
      }

      drawLegend(ctx, ['待查片', '参考卡', '纹理对齐'], 344, 22);

      drawCardMini(ctx, QUERY.x + QUERY.w / 2, QUERY.y + QUERY.h / 2, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = COLORS.deep;
      ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) {
        const yy = QUERY.y + 12 + k * 14;
        ctx.beginPath();
        ctx.moveTo(QUERY.x + 10, yy);
        ctx.lineTo(QUERY.x + QUERY.w - 10, yy);
        ctx.stroke();
      }
      ctx.restore();

      for (let i = 0; i < 3; i++) {
        if (t < placeAt(i)) continue;
        drawCardMini(ctx, CARD_XS[i], CARD_Y + CARD_H / 2, i + 1, 1);
        ctx.save();
        ctx.globalAlpha = align;
        ctx.strokeStyle = COLORS.deep;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(QUERY.x + QUERY.w, QUERY.y + 18 + i * 16);
        ctx.lineTo(CARD_XS[i] - CARD_W / 2, CARD_Y + 18 + i * 16);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = 0; i < 3; i++) {
        if (t >= STARTS[i] && t < placeAt(i)) {
          const u = clamp((t - STARTS[i]) / FLIGHT, 0, 1);
          const x = HOME_X[i] + (CARD_XS[i] - HOME_X[i]) * easeInOutQuad(u);
          drawCardMini(ctx, x, 108 - 30 * Math.sin(Math.PI * u), i + 1, 1);
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

export default Ana9;
