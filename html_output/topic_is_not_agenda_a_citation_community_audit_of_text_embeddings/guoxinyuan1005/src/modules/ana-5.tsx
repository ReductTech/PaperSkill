import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 §5：桌上的候选卡被重新排序——卡上的被引次数条越长越往上；
// 排完后最上面那张卡的议程标签变成命中（绿）。
const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', orange: '#f07e47', green: '#228d5c',
  border: '#d7deea', text: '#21324a', muted: '#68778f', blue: '#27446e',
};

// 六张候选卡的内部引用数（仅示意相对高低，不标注数值）
const COUNT = [4, 9, 6, 12, 7, 5];
const SORTED = [3, 1, 2, 4, 5, 0];
const target = (i: number) => SORTED.indexOf(i);

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const cw = 62;
    const ch = 54;
    const y0 = 48;
    const x0 = 62;
    const gap = 78;

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const cycle = 3.4;
      const p = (t % cycle) / cycle;
      const k = easeInOutQuad(clamp(p / 0.62, 0, 1));

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // 六个落位槽
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = 'rgba(39,68,110,0.05)';
        roundRect(ctx, x0 + i * gap, y0, cw, ch, 5);
        ctx.fill();
      }

      for (let i = 0; i < 6; i++) {
        const x = lerp(x0 + i * gap, x0 + target(i) * gap, k);
        const isTop = target(i) === 0 && k > 0.85;
        ctx.fillStyle = '#fff';
        roundRect(ctx, x, y0, cw, ch, 5);
        ctx.fill();
        ctx.strokeStyle = isTop ? C.green : C.border;
        ctx.lineWidth = isTop ? 2.4 : 1.6;
        roundRect(ctx, x, y0, cw, ch, 5);
        ctx.stroke();
        ctx.fillStyle = isTop ? C.green : C.orange;
        ctx.fillRect(x + 7, y0 + 7, (COUNT[i] / 12) * (cw - 14), 5);
        if (isTop) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(x + cw - 22, y0 + ch - 14);
          ctx.lineTo(x + cw - 16, y0 + ch - 8);
          ctx.lineTo(x + cw - 7, y0 + ch - 20);
          ctx.stroke();
        }
      }

      // 手：从原来的位置滑到排完后的第一名
      const hx = lerp(x0 + 3 * gap + cw / 2, x0 + cw / 2, k);
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(hx, y0 - 14, 9, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx, y0 - 3);
      ctx.lineTo(hx, y0 + 6);
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('候选卡', 24, 26);
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C.orange;
      ctx.fillRect(400, 18, 10, 10);
      ctx.fillStyle = C.muted;
      ctx.fillText('内部引用数', 416, 27);

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
      aria-label="一只手把候选卡按内部引用数重新排序，排完后第一张卡命中查询议程"
    />
  );
};

export default Ana5;
