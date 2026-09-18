import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 160;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  red: '#c43f52', muted: '#68778f', text: '#21324a', border: '#d7deea',
};

/** Hero 旧法：反演——照片进噪点云再回来，结构漂移（红） */
export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const u = ((now - t0) % 3600) / 3600;
      const e = easeInOutQuad(u);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(20, 120, W - 40, 20);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(20, 120, W - 40, 20);

      // path: source -> noise cloud -> drifted target
      const sx = 80;
      const sy = 70;
      const nx = 280;
      const ny = 45;
      const tx = 470;
      const ty = 85; // drifted

      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(nx - 40, 20, nx, ny);
      ctx.quadraticCurveTo(nx + 60, 100, tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      // noise cloud
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + e * 2;
        const r = 18 + (i % 3) * 6;
        ctx.fillStyle = `rgba(196,63,82,${0.15 + (i % 4) * 0.05})`;
        ctx.beginPath();
        ctx.arc(nx + Math.cos(a) * r, ny + Math.sin(a) * r * 0.6, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // photo position along path
      let px: number;
      let py: number;
      if (e < 0.5) {
        const t = e * 2;
        px = lerp(sx, nx, t);
        py = lerp(sy, ny, t) - Math.sin(t * Math.PI) * 20;
      } else {
        const t = (e - 0.5) * 2;
        px = lerp(nx, tx, t);
        py = lerp(ny, ty, t) + Math.sin(t * Math.PI) * 15;
      }

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.fillRect(px - 22, py - 16, 44, 32);
      ctx.strokeRect(px - 22, py - 16, 44, 32);
      // structure lines drift
      ctx.strokeStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(px - 10, py - 4 + e * 6);
      ctx.lineTo(px + 10, py + 2 - e * 4);
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('反演绕路', 40, 28);
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

export default HeroOld;
