import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 340;

const RACERS = [
  { name: 'VVC (VTM)', v: 0, color: '#c43f52' },
  { name: 'Gao2021', v: -10.94, color: '#7c3aed' },
  { name: 'ELIC', v: -7.88, color: '#228d5c' },
];

// P8 result race: BD-Rate bars race leftward; ELIC wins.
export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = () => {
      const now = performance.now();
      const cycle = ((now - t0) % 4800) / 4800;
      const p = Math.min(1, cycle * 1.7);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(620, 50);
      ctx.lineTo(620, 300);
      ctx.stroke();

      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(340, 50);
      ctx.lineTo(340, 300);
      ctx.stroke();
      ctx.setLineDash([]);

      RACERS.forEach((r, i) => {
        const y = 60 + i * 62;
        const bw = Math.abs(r.v) * 30 * p;
        const bx = 620 - bw;
        ctx.fillStyle = r.color;
        ctx.fillRect(bx, y, bw, 30);

        ctx.fillStyle = '#21324a';
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.fillText(r.name, 640, y + 22);

        if (p >= 0.999) {
          ctx.textAlign = 'right';
          ctx.fillText(r.v.toFixed(2) + '%', bx - 8, y + 22);
          ctx.textAlign = 'left';
        }
      });
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="feedback good">BD-Rate 越低越省码：Gao2021 −10.94% 更省但解码超 1 秒/图；ELIC −7.88% 兼顾速度（49.16ms），是帕累托最优。</div>
    </div>
  );
};

export default Ch10Mod1;
