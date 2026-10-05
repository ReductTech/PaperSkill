import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero 左：同一批十篇余弦邻居，上下两行分别按 L1 子领域 / L2 研究议程判定。
// 一行全绿、一行只剩一个绿——这就是"话题对了、议程错了"。
const W = 560;
const H = 200;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', green: '#228d5c',
  red: '#c43f52', purple: '#7c3aed', text: '#21324a', muted: '#68778f',
  empty: '#cfd8e4',
};

const N = 10;
// L2 判定：十篇邻居里只有一篇与查询处在同一条研究议程上（论文 top-10 落在 15–21% 区间）。
const L2_SAME = [true, false, false, false, false, false, false, false, false, false];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) {
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

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: { color: string; label: string }[]) {
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  for (const it of items) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 9, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 15, y);
    cx += 15 + ctx.measureText(it.label).width + 18;
  }
}

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const cycle = 4.2;
    const x0 = 74;
    const sw = 34;
    const gap = 7;
    const step = sw + gap;

    const render = (now: number) => {
      const p = ((now - t0) / 1000 % cycle) / cycle;
      const scan = clamp(p / 0.62, 0, 1); // 扫描进度，扫完后停留一会儿再重来
      const shown = Math.round(scan * N);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // 两行的行标签 + 方阵
      const rows = [
        { label: 'L1 子领域', y: 52, hit: (i: number) => true },
        { label: 'L2 议程', y: 100, hit: (i: number) => L2_SAME[i] },
      ];
      ctx.font = '600 12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      for (const row of rows) {
        ctx.fillStyle = C.text;
        ctx.fillText(row.label, 12, row.y + 23);
        for (let i = 0; i < N; i++) {
          const x = x0 + i * step;
          const revealed = i < shown;
          const same = row.hit(i);
          ctx.globalAlpha = revealed ? 1 : 0.45;
          ctx.fillStyle = revealed ? (same ? C.green : C.red) : C.empty;
          roundRect(ctx, x, row.y, sw, 34, 3);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      chip(ctx, x0 + N * step - gap + 8, 52, '10/10', C.green);
      chip(ctx, x0 + N * step - gap + 8, 100, '1/10', C.red);

      // 扫描线（唯一运动主体）
      const sx = x0 + scan * (N * step - gap);
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, 44);
      ctx.lineTo(sx, 142);
      ctx.stroke();

      drawLegend(ctx, x0, 172, [
        { color: C.green, label: '同社区' },
        { color: C.red, label: '不同社区' },
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
      aria-label="同一批十篇余弦邻居：按 L1 子领域判十篇全部同社区，按 L2 研究议程判只剩一篇"
    />
  );
};

export default HeroOld;
