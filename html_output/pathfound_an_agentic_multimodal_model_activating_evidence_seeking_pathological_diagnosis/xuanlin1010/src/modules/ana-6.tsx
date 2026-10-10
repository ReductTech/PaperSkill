import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡：一只手连续把拼图片摆到桌上，摆到第六片时停住，手收回；
// 桌上的片数保持不动。只有一个运动主体（手与被它带过去的那一片）；
// 静止道具两件：桌面、桌角那叠待取的片。

const W = 560;
const H = 140;
const CYCLE = 3400;
const STEP = 400;
const START = 120;
const SLOT_Y = 84;
const SLOT_X0 = 30;
const SLOT_GAP = 60;
const STACK_X = 488;
const STACK_Y = 70;

type Ctx = CanvasRenderingContext2D;

const COL = {
  bg: '#f5f8f0',
  board: '#b8c9a7',
  boardDeep: '#76906a',
  wood: '#92400e',
  guide: '#27446e',
  good: '#228d5c',
  bad: '#c43f52',
  warm: '#f07e47',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  edge: '#d7deea',
  face: '#ffffff',
};

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, w, h);
}

function drawBoard(ctx: Ctx, x: number, y: number, w: number, h: number, alpha = 0.35) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COL.board;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COL.boardDeep;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
}

interface PieceOpts {
  fill?: string;
  edge?: string;
  texture?: string;
  lines?: number;
  nub?: boolean;
  alpha?: number;
}

function drawPiece(ctx: Ctx, x: number, y: number, w: number, h: number, opts: PieceOpts = {}) {
  const fill = opts.fill ?? COL.face;
  const edge = opts.edge ?? COL.edge;
  const lines = opts.lines ?? 2;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.strokeStyle = opts.texture ?? COL.boardDeep;
  ctx.lineWidth = 1;
  for (let i = 1; i <= lines; i += 1) {
    const yy = y + (h * i) / (lines + 1);
    ctx.beginPath();
    ctx.moveTo(x + 7, yy);
    ctx.lineTo(x + w - 7, yy);
    ctx.stroke();
  }
  if (opts.nub !== false) {
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.arc(x + w - 8, y + h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPieceBack(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#eef1ea';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = COL.edge;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.restore();
}

function drawCard(ctx: Ctx, x: number, y: number, w: number, h: number, lines: number, color: string) {
  ctx.save();
  ctx.fillStyle = COL.face;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w - 12, y);
  ctx.lineTo(x + w, y + 12);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  const cx = x + w / 2;
  const cy = y + h / 2;
  for (let i = 1; i <= lines; i += 1) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, (w / 2.7) * (i / lines), (h / 2.7) * (i / lines), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawJoint(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, ok: boolean) {
  ctx.save();
  ctx.strokeStyle = ok ? COL.good : COL.bad;
  ctx.lineWidth = 3;
  if (!ok) ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawNeedle(ctx: Ctx, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = COL.wood;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();
  ctx.strokeStyle = COL.guide;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(ctx: Ctx, text: string, x: number, y: number, muted = false) {
  ctx.save();
  ctx.fillStyle = muted ? COL.muted : COL.text;
  ctx.font = muted
    ? '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    : '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(ctx: Ctx, items: { label: string; color: string }[], x: number, y: number) {
  ctx.save();
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    roundRect(ctx, cx, y - 7, 14, 14, 4);
    ctx.fill();
    ctx.fillStyle = COL.muted;
    ctx.fillText(it.label, cx + 20, y + 1);
    cx += 20 + ctx.measureText(it.label).width + 22;
  });
  ctx.restore();
}

function easeInOut(t: number) {
  const v = clamp(t, 0, 1);
  return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
}

function drawHand(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = COL.text;
  roundRect(ctx, x, y, 44, 20, 9);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COL.text;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, 44, 20, 9);
  ctx.stroke();
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 8 + i * 13, y + 20);
    ctx.lineTo(x + 8 + i * 13, y + 30);
    ctx.stroke();
  }
  ctx.restore();
}

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const paint = (time: number) => {
      clearScene(ctx, W, H);
      drawBoard(ctx, 8, 56, 544, 76, 0.35);

      // 静止道具：桌角那叠待取的片
      drawPieceBack(ctx, STACK_X - 8, STACK_Y - 8, 54, 38);
      drawPieceBack(ctx, STACK_X - 4, STACK_Y - 4, 54, 38);
      drawPieceBack(ctx, STACK_X, STACK_Y, 54, 38);

      const t = time % CYCLE;
      const endAll = START + 6 * STEP;
      const inWindow = t >= START && t < endAll;
      const idx = inWindow ? Math.min(6, Math.floor((t - START) / STEP) + 1) : 0;
      const f = inWindow ? ((t - START) % STEP) / STEP : 0;
      const allDone = t >= endAll;

      // 已经摆到桌上的片
      for (let i = 1; i <= 6; i += 1) {
        const done = allDone || (inWindow && (i < idx || (i === idx && f >= 0.55)));
        if (done) {
          drawPiece(ctx, SLOT_X0 + (i - 1) * SLOT_GAP, SLOT_Y, 54, 38, { edge: COL.edge });
        }
      }

      // 摆到第六片就停手，绿框标出停止的位置
      if (allDone || (inWindow && idx === 6 && f >= 0.55)) {
        ctx.save();
        ctx.strokeStyle = COL.good;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        roundRect(ctx, SLOT_X0 + 5 * SLOT_GAP - 5, SLOT_Y - 5, 64, 48, 10);
        ctx.stroke();
        ctx.restore();
      }

      // 运动主体：手与被它带过去的那一片
      let k = 0;
      if (inWindow) {
        if (f < 0.5) k = easeInOut(f / 0.5);
        else if (f < 0.62) k = 1;
        else k = 1 - easeInOut((f - 0.62) / 0.38);
      }
      const toSlot = idx >= 1;
      const tx = toSlot ? SLOT_X0 + (idx - 1) * SLOT_GAP : STACK_X;
      const ty = toSlot ? SLOT_Y : STACK_Y;
      const hx = STACK_X + (tx - STACK_X) * k;
      const hy = STACK_Y + (ty - STACK_Y) * k;

      if (inWindow && idx >= 1 && f < 0.55) {
        drawPiece(ctx, hx, hy, 54, 38, { edge: COL.guide });
      }
      drawHand(ctx, hx + 3, hy - 32);

      drawSceneLabel(ctx, '已摆好', 30, 48, false);
      drawSceneLabel(ctx, '待取的片', 430, 48, true);
    };

    const tick = (now: number) => {
      paint(now);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana6;
