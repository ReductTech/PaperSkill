import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 §4：一只手拿着登记板沿八个大区逐个巡检，每到一个区就核对细尺子下的结果，
// 板上逐个画叉——没有一个区是例外。
const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', red: '#c43f52',
  border: '#d7deea', text: '#21324a', muted: '#68778f',
};

const ZONES = ['生医', '物理', '化学', '材料', '计算', '工程', '生物', '环境'];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, a: number) {
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 5);
  ctx.lineTo(x + 5, y + 5);
  ctx.moveTo(x + 5, y - 5);
  ctx.lineTo(x - 5, y + 5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const bw = 52;
    const gap = 14;
    const x0 = 36;
    const yTop = 52;
    const bh = 52;

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const cycle = 4;
      const p = (t % cycle) / cycle;
      const scan = clamp(p / 0.78, 0, 1);
      const handX = x0 - 10 + scan * (8 * (bw + gap) + 10);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      for (let i = 0; i < 8; i++) {
        const x = x0 + i * (bw + gap);
        const cx = x + bw / 2;
        ctx.fillStyle = 'rgba(39,68,110,0.07)';
        roundRect(ctx, x, yTop, bw, bh, 5);
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.6;
        roundRect(ctx, x, yTop, bw, bh, 5);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ZONES[i], cx, yTop + bh / 2 + 4);
        if (cx < handX) drawCross(ctx, cx, yTop - 10, clamp((handX - cx) / 16, 0, 1));
      }

      // 登记板 + 手
      ctx.fillStyle = '#fff';
      roundRect(ctx, handX - 16, 92, 32, 26, 3);
      ctx.fill();
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 1.8;
      roundRect(ctx, handX - 16, 92, 32, 26, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(handX - 6, 96);
      ctx.lineTo(handX + 6, 96);
      ctx.moveTo(handX - 6, 104);
      ctx.lineTo(handX + 6, 104);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(handX, 122, 9, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('八域巡检', 26, 26);
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      drawCrossLegend(ctx, 430, 22);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    function drawCrossLegend(c: CanvasRenderingContext2D, x: number, y: number) {
      c.strokeStyle = C.red;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(x, y - 4);
      c.lineTo(x + 8, y + 4);
      c.moveTo(x + 8, y - 4);
      c.lineTo(x, y + 4);
      c.stroke();
      c.fillStyle = C.muted;
      c.fillText('细尺子不合格', x + 14, y + 4);
    }

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
      aria-label="一只手拿着登记板沿八个大区巡检，每个区在细尺子下都不合格"
    />
  );
};

export default Ana4;
