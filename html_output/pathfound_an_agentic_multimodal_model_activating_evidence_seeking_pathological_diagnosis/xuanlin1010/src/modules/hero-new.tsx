import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 新方法侧：回头补看。一个循环里依次做四件事——取图样卡 → 按图样取片 →
// 接缝吻合地入位 → 空位露出下一个缺口虚线。周期 3.2 s，与旧方法侧共用同一时间基准、
// 同一桌面与同一批散片。

const W = 540;
const H = 280;
const CYCLE = 3200; // ms，两侧一致

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
  roundRect(ctx, x, y, w, h, 14);
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
  roundRect(ctx, x, y, w, h, 7);
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
  roundRect(ctx, x, y, w, h, 7);
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
    ctx.moveTo(x1 + 6, y1 + 6);
    ctx.lineTo(x2 + 6, y2 + 6);
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

// ===== 桌面布局：与旧方法侧完全一致 =====
const CELLS = [
  { x: 182, y: 18 },
  { x: 250, y: 18 },
  { x: 318, y: 18 },
  { x: 182, y: 94 },
  { x: 250, y: 94 },
  { x: 318, y: 94 },
];
const CELL_W = 64;
const CELL_H = 72;
const GAP = 4; // 当前缺口
const NEXT_GAP = 5; // 下一处空位
const PILE = [
  { x: 30, y: 192 },
  { x: 106, y: 192 },
  { x: 396, y: 192 },
  { x: 462, y: 192 },
];
const PW = 64;
const PH = 72;
const REST = { x: 508, y: 100 };
const ORIGIN = { x: PILE[0].x + PW / 2, y: PILE[0].y + PH / 2 };
const SLOT = { x: 250 + PW / 2, y: 94 + PH / 2 };
const CARD = { x: 452, y: 36, w: 76, h: 56 };
const CARD_P = { x: CARD.x + CARD.w / 2, y: CARD.y + CARD.h / 2 };

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = BOARD;
  ctx.strokeStyle = DEEP;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 24, y - 12, 48, 30, 12);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, x - 30, y - 32, 14, 26, 6);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, x - 8, y - 36, 14, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      drawBoard(ctx, 12, 186, 516, 84, 1);

      // 外框：静止
      ctx.save();
      ctx.strokeStyle = DEEP;
      ctx.lineWidth = 2;
      roundRect(ctx, 178, 14, 208, 156, 10);
      ctx.stroke();
      ctx.restore();

      // 已经拼好的片：接缝吻合，画成绿实线
      const placed = [0, 1, 2, 3];
      for (let i = 0; i < placed.length; i += 1) {
        const c = CELLS[placed[i]];
        drawPiece(ctx, c.x, c.y, CELL_W, CELL_H, {
          face: '#ffffff',
          edge: DEEP,
          texture: DEEP,
          bars: [0.32, 0.6, 0.82],
        });
      }
      drawJoint(ctx, 248, 30, 248, 154, true);
      drawJoint(ctx, 316, 30, 316, 154, true);
      drawJoint(ctx, 194, 92, 234, 92, true);

      // 下一处空位：先是很淡的虚线，补上当前缺口后才被点亮
      const revealed = t >= 0.8;
      const ng = CELLS[NEXT_GAP];
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = revealed ? BLUE : LINE;
      ctx.lineWidth = 2;
      roundRect(ctx, ng.x, ng.y, CELL_W, CELL_H, 7);
      ctx.stroke();
      ctx.restore();

      // 当前缺口：等着的空位
      if (t < 0.72) {
        ctx.save();
        ctx.setLineDash([7, 6]);
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 2;
        roundRect(ctx, 250, 94, CELL_W, CELL_H, 7);
        ctx.stroke();
        ctx.restore();
      }

      // 图样卡：取卡时被抬起并加粗描边
      const cardT = clamp((t - 0.02) / 0.42, 0, 1);
      const cardLift = 6 * Math.sin(cardT * Math.PI);
      const picking = t >= 0.05 && t < 0.44;
      drawCard(ctx, CARD.x, CARD.y - cardLift, CARD.w, CARD.h, [0.3, 0.55, 0.78], AUX);
      if (picking) {
        ctx.save();
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 3;
        roundRect(ctx, CARD.x - 3, CARD.y - cardLift - 3, CARD.w + 6, CARD.h + 6, 8);
        ctx.stroke();
        ctx.restore();
      }

      // 一只手：取卡 → 按图样取片 → 入位 → 退回
      const toCard = smooth(seg(t, 0, 0.2));
      const toPile = smooth(seg(t, 0.2, 0.44));
      const toSlot = smooth(seg(t, 0.44, 0.72));
      const toRest = smooth(seg(t, 0.72, 1));
      let hand = REST;
      if (t < 0.2) hand = mix(REST, CARD_P, toCard);
      else if (t < 0.44) hand = mix(CARD_P, ORIGIN, toPile);
      else if (t < 0.72) hand = mix(ORIGIN, SLOT, toSlot);
      else hand = mix(SLOT, REST, toRest);

      // 散片：同一批，位置静止（背面朝上）
      for (let i = 1; i < PILE.length; i += 1) {
        drawPieceBack(ctx, PILE[i].x, PILE[i].y, PW, PH);
      }

      // 按图样取来的那一片
      const locked = t >= 0.72;
      const held = { x: hand.x - PW / 2, y: hand.y - PH / 2 };
      const at = locked ? { x: 250, y: 94 } : t < 0.44 ? { x: PILE[0].x, y: PILE[0].y } : held;
      drawPiece(ctx, at.x, at.y, PW, PH, {
        face: '#ffffff',
        edge: locked ? GREEN : DEEP,
        texture: locked ? GREEN : DEEP,
        bars: [0.3, 0.55, 0.78],
      });

      if (locked) {
        // 接缝吻合地入位
        const lock = clamp(smooth(seg(t, 0.72, 0.84)), 0.5, 1);
        ctx.save();
        ctx.globalAlpha = lock;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 3;
        roundRect(ctx, 250, 94, CELL_W, CELL_H, 7);
        ctx.stroke();
        ctx.restore();
        drawJoint(ctx, 248, 96, 248, 164, true);
        drawJoint(ctx, 252, 92, 312, 92, true);
      }

      drawHand(ctx, hand.x, hand.y, 0.9);
      drawSceneLabel(ctx, '回头补看', 14, 32, false);
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

export default HeroNew;
