import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function piece(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  roundRect(ctx, x - s / 2, y - s / 2, s, s, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(33,50,74,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

const LANES = [
  { label: '只靠邻居', err: 0.6, color: '#c43f52' },
  { label: '只靠盒盖', err: 0.45, color: '#27446e' },
  { label: '邻居 + 盒盖', err: 0.2, color: '#228d5c' },
];

export const Mod31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ running: false, startTime: 0, done: false });
  const rafRef = useRef<number | null>(null);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({ text: '点「开始对比」，看三条线的预测误差。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const s = stateRef.current;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      let t = 0;
      if (s.running) {
        t = Math.min(1, (now - s.startTime) / 1500);
        if (t >= 1) {
          s.running = false;
          s.done = true;
          setDone(true);
          setFeedback({
            text: '邻居 + 盒盖互补，误差最小（绿）；只靠邻居看不到全局（红）；只靠盒盖没有细节（蓝）。',
            cls: '',
          });
        }
      } else if (s.done) {
        t = 1;
      }

      LANES.forEach((lane, idx) => {
        const cx = 120 + idx * 330;
        ctx.strokeStyle = '#228d5c';
        ctx.setLineDash([5, 4]);
        roundRect(ctx, cx - 28, 150, 56, 52, 6);
        ctx.stroke();
        ctx.setLineDash([]);

        const e = easeOutCubic(t);
        const py = 40 + e * (150 - 40 - 24);
        const px = cx + (lane.err * 44) * Math.sin(e * Math.PI);
        piece(ctx, px, py, 40, e > 0.95 ? lane.color : '#f07e47');

        ctx.fillStyle = '#21324a';
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lane.label, cx, 24);
        ctx.textAlign = 'left';

        // error bar
        const bx = cx - 90;
        const bh = lane.err * 100;
        ctx.fillStyle = lane.color;
        ctx.fillRect(bx, H - 36 - bh, 180, bh);
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, H - 136, 180, 100);
        ctx.fillStyle = '#68778f';
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillText(Math.round(lane.err * 100) + '%', cx + 50, H - 40);
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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

  const onStart = () => {
    if (stateRef.current.running) return;
    stateRef.current.running = true;
    stateRef.current.done = false;
    stateRef.current.startTime = performance.now();
    setDone(false);
    setFeedback({ text: '三条线同时开始预测……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={onStart} disabled={stateRef.current.running}>
          {done ? '再看一次' : '开始对比'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod31;
