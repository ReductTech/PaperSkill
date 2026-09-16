import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a',
};

/** 收紧蓝色引导绳，把照片拉向目标标记 */
export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const target = { x: 470, y: 62 };
    let t0 = performance.now();

    const tick = (now: number) => {
      const u = ((now - t0) % 3000) / 3000;
      const e = easeInOutQuad(u < 0.8 ? u / 0.8 : 1);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(20, 100, W - 40, 18);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(20, 100, W - 40, 18);

      // target cue
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.strokeRect(target.x - 20, target.y - 16, 40, 32);
      ctx.beginPath();
      ctx.moveTo(target.x - 8, target.y);
      ctx.lineTo(target.x + 8, target.y);
      ctx.moveTo(target.x, target.y - 8);
      ctx.lineTo(target.x, target.y + 8);
      ctx.stroke();

      const px = lerp(100, 400, e);
      const py = lerp(70, 62, e);
      // leash
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5 + e * 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 22, py);
      ctx.quadraticCurveTo(lerp(px, target.x, 0.5), py - 30 + e * 20, target.x - 20, target.y);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(px - 22, py - 16, 44, 32);
      ctx.strokeRect(px - 22, py - 16, 44, 32);
      ctx.fillStyle = C.light;
      ctx.fillRect(px - 12, py - 6, 24, 14);

      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('拉近', 40, 28);
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

export default Ana5;
