import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡：一只手把同一片拼图片硬塞进中央凹槽，接缝明显错开；手退回，再拿起同一片又硬塞一次。
// 整段只有一个动作：塞片。桌面与框线静止。周期 3.0 s。

const W = 560;
const H = 140;
const CYCLE = 3000;

// ===== 拼图复原主题：局部绘制助手（各章节同名同义） =====
const PAPER = '#f5f8f0';
const BOARD = '#b8c9a7';
const DEEP = '#76906a';
const WOOD = '#92400e';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const AUX = '#7c3aed';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

type PieceOpts = {
  face?: string;
  edge?: string;
  texture?: string;
  alpha?: number;
  bars?: number[];
  nub?: boolean;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
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

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = BOARD;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = DEEP;
  ctx.lineWidth = 2;
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
): void {
  const face = opts.face || '#ffffff';
  const edge = opts.edge || LINE;
  const texture = opts.texture || DEEP;
  const alpha = opts.alpha === undefined ? 1 : opts.alpha;
  const bars = opts.bars || [0.34, 0.62];
  const nub = opts.nub === undefined ? true : opts.nub;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = face;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (nub) {
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h, Math.min(w, h) * 0.1, Math.PI, 0);
    ctx.stroke();
  }
  ctx.strokeStyle = texture;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < bars.length; i += 1) {
    const by = y + h * bars[i];
    ctx.moveTo(x + w * 0.16, by);
    ctx.lineTo(x + w * 0.72 - i * w * 0.1, by);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPieceBack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.fillStyle = '#e7ebf2';
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#cfd6e2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.24, y + h * 0.3);
  ctx.lineTo(x + w * 0.76, y + h * 0.7);
  ctx.moveTo(x + w * 0.76, y + h * 0.3);
  ctx.lineTo(x + w * 0.24, y + h * 0.7);
  ctx.stroke();
  ctx.restore();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: number[],
  color: string
): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  for (let i = 0; i < lines.length; i += 1) {
    const ly = y + h * lines[i];
    ctx.moveTo(x + w * 0.16, ly);
    ctx.lineTo(x + w * 0.84, ly);
  }
  ctx.stroke();
  ctx.restore();
}

function drawJoint(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ok: boolean
): void {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if (ok) {
    ctx.strokeStyle = GREEN;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = RED;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1 + 5, y1 + 5);
    ctx.lineTo(x2 + 5, y2 + 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 12);
  ctx.lineTo(42, 30);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted: boolean
): void {
  ctx.save();
  ctx.fillStyle = muted ? MUTED : INK;
  ctx.font = muted
    ? '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    : '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  ctx.save();
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  const shown = items.slice(0, 3);
  for (let i = 0; i < shown.length; i += 1) {
    const item = shown[i];
    ctx.fillStyle = item.color;
    roundRect(ctx, cx, y - 7, 14, 14, 3);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.fillText(item.label, cx + 20, y);
    cx += 20 + ctx.measureText(item.label).width + 28;
  }
  ctx.restore();
}

function mix(a: { x: number; y: number }, b: { x: number; y: number }, u: number): { x: number; y: number } {
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}

function seg(t: number, a: number, b: number): number {
  return clamp((t - a) / (b - a), 0, 1);
}

function smooth(u: number): number {
  return u * u * (3 - 2 * u);
}

// ===== 固定的桌面与框线 =====
const CELL_W = 56;
const CELL_H = 72;
const LEFT_CELL = { x: 192, y: 12 };
const HOLE = { x: 252, y: 12 }; // 中央凹槽
const RIGHT_CELL = { x: 312, y: 12 };
const PW = 56;
const PH = 72;
const REST = { x: 508, y: 100 };
const JAM = { x: HOLE.x + PW / 2 + 7, y: HOLE.y + PH / 2 + 6 };
const LIFT = { x: JAM.x + 2, y: JAM.y - 14 };
const ASIDE = { x: 500, y: 96 };

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = BOARD;
  ctx.strokeStyle = DEEP;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 22, y - 11, 44, 28, 11);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, x - 28, y - 30, 13, 24, 6);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, x - 7, y - 34, 13, 26, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (t: number) => {
      clearScene(ctx, W, H);
      drawBoard(ctx, 8, 96, 544, 38, 1);

      // 框线：静止
      ctx.save();
      ctx.strokeStyle = DEEP;
      ctx.lineWidth = 2;
      roundRect(ctx, 188, 6, 184, 84, 9);
      ctx.stroke();
      ctx.restore();

      // 两边已经放好的片
      drawPiece(ctx, LEFT_CELL.x, LEFT_CELL.y, CELL_W, CELL_H, {
        face: '#ffffff',
        edge: DEEP,
        texture: DEEP,
        bars: [0.3, 0.58, 0.82],
      });
      drawPiece(ctx, RIGHT_CELL.x, RIGHT_CELL.y, CELL_W, CELL_H, {
        face: '#ffffff',
        edge: DEEP,
        texture: DEEP,
        bars: [0.3, 0.58, 0.82],
      });

      // 中央凹槽空着的时候：红色虚线
      const seated = !(t < 0.28 || (t >= 0.62 && t < 0.9));
      if (!seated) {
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        roundRect(ctx, HOLE.x, HOLE.y, CELL_W, CELL_H, 6);
        ctx.stroke();
        ctx.restore();
      }

      // 一只手：硬塞同一片，退回，再拿起同一片又硬塞一次
      const jam = smooth(seg(t, 0, 0.28));
      const out = smooth(seg(t, 0.28, 0.42));
      const back = smooth(seg(t, 0.42, 0.62));
      const pull = smooth(seg(t, 0.62, 0.74));
      const again = smooth(seg(t, 0.74, 0.9));
      const away = smooth(seg(t, 0.9, 1));
      let hand = REST;
      if (t < 0.28) hand = mix(REST, JAM, jam);
      else if (t < 0.42) hand = mix(JAM, ASIDE, out);
      else if (t < 0.62) hand = mix(ASIDE, JAM, back);
      else if (t < 0.74) hand = mix(JAM, LIFT, pull);
      else if (t < 0.9) hand = mix(LIFT, JAM, again);
      else hand = mix(JAM, REST, away);

      const held = t < 0.28 || (t >= 0.62 && t < 0.9);
      const at = held ? { x: hand.x - PW / 2, y: hand.y - PH / 2 } : { x: HOLE.x + 7, y: HOLE.y + 6 };
      drawPiece(ctx, at.x, at.y, PW, PH, {
        face: '#ffffff',
        edge: RED,
        texture: RED,
        bars: [0.32, 0.6],
      });

      if (seated) {
        // 接缝明显错开
        drawJoint(ctx, HOLE.x, HOLE.y, HOLE.x, HOLE.y + PH, false);
        drawJoint(ctx, HOLE.x, HOLE.y, HOLE.x + CELL_W, HOLE.y, false);
      }

      drawHand(ctx, hand.x, hand.y, 0.9);
      drawSceneLabel(ctx, '硬塞一片', 14, 30, false);
    };

    const tick = () => {
      const phase = (performance.now() % CYCLE) / CYCLE;
      render(phase);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) {
        render(0);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana1;
