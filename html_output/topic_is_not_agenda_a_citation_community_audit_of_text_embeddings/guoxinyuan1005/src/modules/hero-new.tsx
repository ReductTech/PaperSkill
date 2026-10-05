import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 右：接上引文图重排的检索台。候选书按卡片上的「内部引用数」条重新归位，
// 一只手推着第一名入位，最上面一册变为命中（绿）并打上「L2 命中」标——议程信号被取回来了。
const W = 560;
const H = 200;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', shelf: '#92400e', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', orange: '#f07e47', border: '#d7deea',
  text: '#21324a', muted: '#68778f',
};

// 已按内部引用数降序排好的候选书（条长仅为相对高低示意，不标注数值）。
const BARS = [52, 44, 36, 28, 20, 13];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string, hot: boolean) {
  ctx.fillStyle = '#fff';
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = hot ? C.green : C.border;
  ctx.lineWidth = hot ? 2.4 : 1.6;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillRect(x + 6, y + 6, w - 12, 5);
}

function drawCheck(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x - 1, y + 5);
  ctx.lineTo(x + 7, y - 6);
  ctx.stroke();
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x, y, 9, 11, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 11);
  ctx.lineTo(x + 3, y + 22);
  ctx.stroke();
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.fillStyle = C.text;
  ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: { color: string; label: string }[]) {
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  for (const it of items) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 8, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 15, y + 1);
    cx += 15 + ctx.measureText(it.label).width + 18;
  }
}

function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) {
  ctx.font = '700 13px "Segoe UI", "Microsoft YaHei", sans-serif';
  const w = ctx.measureText(label).width + 18;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, 24, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 9, y + 17);
}

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const yTop = 62;
    const cw = 60;
    const ch = 84;
    const x0 = 40;
    const gap = 78;
    const yBase = 168;

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const cycle = 3.6;
      const p = (t % cycle) / cycle;
      const arrive = easeInOutQuad(clamp(p / 0.62, 0, 1));

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      ctx.strokeStyle = C.shelf;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(16, yBase + 2);
      ctx.lineTo(W - 16, yBase + 2);
      ctx.stroke();

      // 候选书列（已按内部引用数降序）
      for (let i = 0; i < BARS.length; i++) {
        const x = x0 + i * gap;
        const hot = i === 0 && arrive > 0.92;
        drawCard(ctx, x, yTop, cw, ch, hot ? C.green : C.orange, hot);
        // 卡片上的「内部引用数」条
        ctx.fillStyle = C.orange;
        ctx.fillRect(x + 8, yTop + ch - 12, BARS[i], 4);
        if (hot) drawCheck(ctx, x + cw - 12, yTop + 16);
      }

      drawLabel(ctx, x0, 44, '候选书列');
      drawLegend(ctx, 320, 40, [{ color: C.orange, label: '内部引用数' }]);
      ctx.globalAlpha = arrive > 0.92 ? 1 : 0.3;
      drawChip(ctx, 438, 26, 'L2 命中', C.green);
      ctx.globalAlpha = 1;

      // 推第一名入位的手（唯一运动主体）
      const hx = x0 + 96 + (1 - arrive) * 300;
      drawHand(ctx, hx, yTop + ch + 30);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x0 + cw / 2, yTop - 8);
      ctx.lineTo(x0 + cw / 2 + (1 - arrive) * 300, yTop - 8);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      raf = requestAnimationFrame(tick);
    };
    tick();
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (!raf) raf = requestAnimationFrame(tick);
      },
      () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    );
    return () => {
      if (raf) cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={ref}
      width={W}
      height={H}
      role="img"
      aria-label="按结果集内部引用数重排后，第一名候选书命中查询的 L2 研究议程"
    />
  );
};

export default HeroNew;
