import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 160;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', orange: '#f07e47', text: '#21324a',
};

/** Hero 新法：FlowEdit——照片沿短绿直路滑向编辑外观 */
export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let t0 = performance.now();

    const tick = (now: number) => {
      const u = ((now - t0) % 3000) / 3000;
      const e = easeInOutQuad(u < 0.85 ? u / 0.85 : 1);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(20, 120, W - 40, 20);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(20, 120, W - 40, 20);

      const sx = 80;
      const sy = 70;
      const tx = 470;
      const ty = 70;

      ctx.strokeStyle = C.green;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // edited look target
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.strokeRect(tx - 26, ty - 22, 52, 44);
      ctx.fillStyle = C.orange;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('编辑后', tx - 20, ty + 40);

      const px = lerp(sx, tx, e);
      const py = lerp(sy, ty, e);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(px - 22, py - 16, 44, 32);
      ctx.strokeRect(px - 22, py - 16, 44, 32);
      // tint toward edit
      ctx.fillStyle = `rgba(240,126,71,${e * 0.35})`;
      ctx.fillRect(px - 14, py - 8, 28, 18);

      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('直达编辑', 40, 28);
      canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    const start = () => {
      if (!raf.current) {
        t0 = performance.now();
        raf.current = requestAnimationFrame(tick);
      }
    };
    const off = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      off();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default HeroNew;
