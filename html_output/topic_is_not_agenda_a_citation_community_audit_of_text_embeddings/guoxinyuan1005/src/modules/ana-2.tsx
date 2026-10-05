import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 §2：一只手把同一册书从「大区」挪到「格位」。归大区容易对上，归到细格位就难得多了。
const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', shelf: '#92400e', blue: '#27446e',
  purple: '#7c3aed', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBook(ctx: CanvasRenderingContext2D, x: number, yBase: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  roundRect(ctx, x, yBase - h, w, h, 3);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w / 2 - 3, yBase - h + 8, 6, 11);
}

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const cycle = 3.4;
      const p = (t % cycle) / cycle;
      const move = easeInOutQuad(clamp((p - 0.16) / 0.44, 0, 1));
      const fine = clamp((p - 0.5) / 0.22, 0, 1);

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

      // 左：大区（宽格）
      const lx = 40;
      const lc = 110;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.8;
      for (let i = 0; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(lx + i * lc, 34);
        ctx.lineTo(lx + i * lc, yBase);
        ctx.stroke();
      }

      // 右：格位（细格，随动画淡入）
      const rx = 320;
      const rc = 52;
      ctx.globalAlpha = fine;
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(rx + i * rc, 34);
        ctx.lineTo(rx + i * rc, yBase);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // 被挪动的书（唯一运动主体）
      const sx = lx + 30;
      const tx = rx + rc + 14;
      const bx = sx + (tx - sx) * move;
      drawBook(ctx, bx, yBase, 22, 70, C.blue);

      // 手在书上方
      const hx = bx + 11;
      const hy = yBase - 70 - 16 + move * 4;
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(hx, hy, 9, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('大区', lx + 6, 28);
      ctx.fillText('格位', rx + 6, 28);

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
      aria-label="一只手把同一册书从大区挪进格位：粗尺子容易对上，细尺子很难"
    />
  );
};

export default Ana2;
