import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡：一只手把一片拼图片放进凹槽，接缝错开一条缝；手停在缝上方不动。
// 单个运动主体 = 手；静止道具 = 图框（含已放好的片与空凹槽）、缝的缺口带。
// 周期 3.2s，自动循环，不接输入。

const W = 560;
const H = 140;
const CYCLE = 3200;

type PieceOpts = {
  fill?: string;
  stroke?: string;
  lines?: number;
  lineColor?: string;
  lineWidth?: number;
  nub?: boolean;
  glow?: boolean;
};

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
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

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  const top = Math.round(h * 0.5);
  ctx.fillStyle = 'rgba(184, 201, 167, 0.42)';
  ctx.fillRect(0, top, w, h - top);
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, top + 0.5);
  ctx.lineTo(w, top + 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#b8c9a7';
  roundRectPath(ctx, x, y, w, h, Math.min(12, h / 2));
  ctx.fill();
  ctx.globalAlpha = Math.min(1, alpha + 0.35);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: PieceOpts = {}
) {
  const fill = opts.fill || '#dfe7d2';
  const stroke = opts.stroke || '#76906a';
  const lineColor = opts.lineColor || stroke;
  const lineWidth = opts.lineWidth || 2;
  const lines = opts.lines === undefined ? 2 : opts.lines;
  ctx.save();
  if (opts.glow) {
    ctx.shadowColor = 'rgba(34, 141, 92, 0.5)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = fill;
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= lines; i += 1) {
    const ly = y + (h * i) / (lines + 1);
    ctx.beginPath();
    ctx.moveTo(x + 7, ly);
    ctx.lineTo(x + w - 7, ly);
    ctx.stroke();
  }
  if (opts.nub !== false) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x + w, y + h / 2, 6, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawPieceBack(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#e7e9e3';
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = '#eef3e6';
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1.5;
  const limit = Math.min(w, h) / 2 - 4;
  for (let i = 1; i <= lines; i += 1) {
    const inset = 5 + i * 6;
    if (inset > limit) break;
    roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawJoint(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ok: boolean
) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.setLineDash(ok ? [] : [8, 6]);
  ctx.strokeStyle = ok ? '#228d5c' : '#c43f52';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(11, 11);
  ctx.lineTo(26, 26);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted?: boolean
) {
  ctx.save();
  ctx.fillStyle = muted ? '#68778f' : '#21324a';
  ctx.font = (muted ? '18px' : '22px') + ' "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; text: string }[],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (const item of items) {
    ctx.fillStyle = item.color;
    roundRectPath(ctx, cx, y - 12, 14, 14, 3);
    ctx.fill();
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#68778f';
    ctx.fillText(item.text, cx + 20, y);
    cx += 20 + ctx.measureText(item.text).width + 26;
  }
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f0d9c2';
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  roundRectPath(ctx, -17, -16, 34, 30, 10);
  ctx.fill();
  ctx.stroke();
  for (let i = -1; i <= 1; i += 1) {
    roundRectPath(ctx, -13 + i * 9, 10, 8, 17, 4);
    ctx.fill();
    ctx.stroke();
  }
  roundRectPath(ctx, -26, -8, 12, 17, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number) => {
      const frac = (now % CYCLE) / CYCLE;
      const down = clamp(frac / 0.3, 0, 1);
      const eased = 1 - Math.pow(1 - down, 3);
      const handY = -12 + (30 + 12) * eased;
      const placed = frac > 0.3;
      const pulse = 0.5 + 0.5 * Math.sin(now / 240);

      clearScene(ctx, W, H);
      drawBoard(ctx, 60, 122, 420, 12, 0.45);

      // 图框
      ctx.save();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      roundRectPath(ctx, 80, 60, 320, 72, 12);
      ctx.stroke();
      ctx.restore();

      // 已放好的片
      drawPiece(ctx, 90, 68, 202, 54, {
        fill: '#dfe7d2',
        stroke: '#76906a',
        lines: 3,
        lineColor: '#76906a',
        nub: false,
      });

      // 空凹槽
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      roundRectPath(ctx, 298, 68, 88, 54, 8);
      ctx.stroke();
      ctx.restore();

      if (placed) {
        drawPiece(ctx, 298, 74, 88, 54, {
          fill: '#dfe7d2',
          stroke: '#c43f52',
          lines: 2,
          lineColor: '#76906a',
          nub: false,
        });
      }

      // 露出来的缝
      ctx.save();
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(292, 68, 6, 60);
      ctx.fillRect(298, 68, 88, 6);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2 + pulse;
      ctx.beginPath();
      ctx.moveTo(298, 68);
      ctx.lineTo(298, 74);
      ctx.lineTo(386, 74);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(295, 68);
      ctx.lineTo(295, 128);
      ctx.stroke();
      ctx.restore();

      drawJoint(ctx, 292, 68, 292, 122, false);

      // 引线 + 标签
      ctx.save();
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(388, 96);
      ctx.lineTo(414, 96);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = '#c43f52';
      ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('对不上', 418, 96);
      ctx.restore();

      drawHand(ctx, 300, handY);
    };

    const tick = (now: number) => {
      render(now);
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

export default Ana4;
