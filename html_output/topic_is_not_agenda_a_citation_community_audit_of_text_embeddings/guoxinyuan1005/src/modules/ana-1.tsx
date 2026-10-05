import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 §1：一只手从书架上抽出「看起来最像」的一排书，逐本翻到书脊上的议程标签。
// 十本里只有两本标签相同（绿），其余八本是红的。
const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', shelf: '#92400e', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', border: '#d7deea', text: '#21324a',
  muted: '#68778f', empty: '#c8d2e0',
};

const SAME = [true, false, false, true, false, false, false, false, false, false];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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

export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const yBase = 112;
    const bw = 22;
    const bh = 70;
    const x0 = 50;
    const gap = 44;

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const cycle = 3.2;
      const p = (t % cycle) / cycle;
      const scan = clamp(p / 0.68, 0, 1);
      const handX = 34 + scan * 460;

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

      for (let i = 0; i < 10; i++) {
        const x = x0 + i * gap;
        const cx = x + bw / 2;
        const passed = cx < handX;
        const lifted = clamp(1 - Math.abs(cx - handX) / 34, 0, 1);
        const yb = yBase - lifted * 7;
        ctx.fillStyle = passed ? (SAME[i] ? C.green : C.red) : C.empty;
        roundRect(ctx, x, yb - bh, bw, bh, 3);
        ctx.fill();
        if (passed) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(cx - 3, yb - bh + 8, 6, 11);
        }
      }

      // 抽书的手
      const hy = 62;
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(handX, hy, 9, 11, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(handX + 2, hy + 11);
      ctx.lineTo(handX + 5, hy + 22);
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('议程标签', 24, 26);
      drawLegend(ctx, 356, 22, [
        { color: C.green, label: '同议程' },
        { color: C.red, label: '不同议程' },
      ]);

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
      aria-label="一只手逐本抽出最像的书核对议程标签，十本里只有两本标签相同"
    />
  );
};

export default Ana1;
