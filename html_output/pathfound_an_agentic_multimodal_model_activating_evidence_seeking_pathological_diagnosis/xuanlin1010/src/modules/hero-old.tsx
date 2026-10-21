import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 旧方法侧：一次读片。整段只有一个动作——把手里那一片硬塞进缺口，接缝始终错开，
// 全程停在失败状态，从不回头。周期 3.2 s，与新方法侧共用同一时间基准。

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

// ===== 桌面布局：与新方法侧完全一致 =====
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
const GAP = 4; // 中央缺口
const NEXT_GAP = 5; // 还没轮到的空位
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
const SLOT = { x: 250 + PW / 2 + 9, y: 94 + PH / 2 - 7 };
const LIFTED = { x: SLOT.x + 10, y: SLOT.y - 30 };
const ASIDE = { x: 430, y: 104 };

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

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      for (let i = 0; i < CELLS.length; i += 1) {
        const c = CELLS[i];
        if (i === GAP) continue;
        if (i === NEXT_GAP) {
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = LINE;
          ctx.lineWidth = 2;
          roundRect(ctx, c.x, c.y, CELL_W, CELL_H, 7);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        drawPiece(ctx, c.x, c.y, CELL_W, CELL_H, {
          face: '#ffffff',
          edge: DEEP,
          texture: DEEP,
          bars: [0.32, 0.6, 0.82],
        });
      }

      // 缺口：始终是红色虚线，从来没被补对
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      roundRect(ctx, 250, 94, CELL_W, CELL_H, 7);
      ctx.stroke();
      ctx.restore();

      // 一只手：反复塞同一片
      const grab = smooth(seg(t, 0, 0.16));
      const push = smooth(seg(t, 0.16, 0.44));
      const back = smooth(seg(t, 0.44, 0.56));
      const back2 = smooth(seg(t, 0.56, 0.66));
      const lift = smooth(seg(t, 0.66, 0.74));
      const again = smooth(seg(t, 0.74, 0.82));
      const away = smooth(seg(t, 0.82, 1));
      let hand = REST;
      if (t < 0.16) hand = mix(REST, ORIGIN, grab);
      else if (t < 0.44) hand = mix(ORIGIN, SLOT, push);
      else if (t < 0.56) hand = mix(SLOT, ASIDE, back);
      else if (t < 0.66) hand = mix(ASIDE, SLOT, back2);
      else if (t < 0.74) hand = mix(SLOT, LIFTED, lift);
      else if (t < 0.82) hand = mix(LIFTED, SLOT, again);
      else hand = mix(SLOT, REST, away);

      // 散片：同一批，位置静止（背面朝上）
      for (let i = 1; i < PILE.length; i += 1) {
        drawPieceBack(ctx, PILE[i].x, PILE[i].y, PW, PH);
      }

      // 被反复硬塞的那一片：手里拿着，或者错位地卡在缺口里
      const seated = (t >= 0.44 && t < 0.66) || t >= 0.82;
      const held = { x: hand.x - PW / 2, y: hand.y - PH / 2 };
      const at = seated ? { x: 259, y: 87 } : t < 0.16 ? { x: PILE[0].x, y: PILE[0].y } : held;
      drawPiece(ctx, at.x, at.y, PW, PH, {
        face: '#ffffff',
        edge: RED,
        texture: RED,
        bars: [0.36, 0.66],
      });

      if (seated) {
        // 塞进去了，但接缝错开
        drawJoint(ctx, 250, 94, 250, 166, false);
        drawJoint(ctx, 250, 94, 314, 94, false);
      }

      drawHand(ctx, hand.x, hand.y, 0.9);
      drawSceneLabel(ctx, '只看一遍', 14, 32, false);
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

export default HeroOld;
