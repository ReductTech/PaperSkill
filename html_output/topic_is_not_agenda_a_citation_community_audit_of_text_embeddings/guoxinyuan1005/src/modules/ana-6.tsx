import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 §6：七堆书依次滑到借还台前的同一把刻度尺上比高；最高的两堆（带引文重排）
// 被一条红色虚线标出。
const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', shelf: '#92400e', blue: '#27446e',
  green: '#228d5c', muted: '#68778f', red: '#c43f52', text: '#21324a',
};

const VALS = [39.3, 39.7, 39.6, 44.9, 50.6, 57.7, 59.6];
const RERANKED = [false, false, false, false, false, true, true];

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const base = 118;
    const gap = 72;
    const x0 = 34;
    const sw = 46;

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const cycle = 3.8;
      const p = (t % cycle) / cycle;
      const settle = easeOutCubic(clamp((p - 0.05) / 0.6, 0, 1));

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // 借还台面
      ctx.strokeStyle = C.shelf;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(18, base + 2);
      ctx.lineTo(W - 18, base + 2);
      ctx.stroke();

      for (let i = 0; i < 7; i++) {
        const delay = clamp((settle - i * 0.055) / 0.7, 0, 1);
        const x = lerp(x0 + i * gap + 200, x0 + i * gap, delay);
        const h = (VALS[i] / 70) * 82 * delay;
        const tall = RERANKED[i];
        ctx.fillStyle = tall ? C.green : C.muted;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x, base - h, sw, h);
        ctx.globalAlpha = 1;
        // 书脊纹
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.2;
        for (let n = 1; n < 4; n++) {
          const yy = base - (h / 4) * n;
          ctx.beginPath();
          ctx.moveTo(x + 4, yy);
          ctx.lineTo(x + sw - 4, yy);
          ctx.stroke();
        }
      }

      // 红色虚线框出最高的两堆
      if (settle > 0.85) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(x0 + 5 * gap - 6, 22, sw + 12, 100);
        ctx.setLineDash([]);
      }

      // 推书的手（跟着最后一堆走）
      const hx = lerp(x0 + 6 * gap + 200 + sw / 2, x0 + 6 * gap + sw / 2, clamp((settle - 0.33) / 0.7, 0, 1));
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(hx + 34, 74, 9, 11, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('同一把尺子', 24, 24);

      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      let lx = 330;
      for (const it of [
        { color: C.muted, label: '无引文重排' },
        { color: C.green, label: '加引文重排' },
      ]) {
        ctx.fillStyle = it.color;
        ctx.fillRect(lx, 15, 11, 11);
        ctx.fillStyle = C.muted;
        ctx.fillText(it.label, lx + 16, 25);
        lx += 16 + ctx.measureText(it.label).width + 14;
      }

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
      aria-label="七堆书在同一把刻度尺上比高，带引文重排的两堆明显更高"
    />
  );
};

export default Ana6;
