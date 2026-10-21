import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { photo } from './photokit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

const gauss = (x: number, mu: number, sig: number) =>
  Math.exp(-((x - mu) * (x - mu)) / (2 * sig * sig));

// P4 chips: with/without hyperprior changes the Gaussian fit over the symbol histogram.
export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 0 });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState(0);
  const [feedback, setFeedback] = useState({ text: '切换「有/无超先验」，看高斯拟合效果。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { mode: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      photo(ctx, 60, 60, 180, 150, s.mode === 1 ? 1 : 0.15);

      const hx = 380;
      const hy = 60;
      const hw = 620;
      const hh = 180;
      const mu0 = 0.4;
      const bins = 11;
      const binW = hw / bins;
      for (let b = 0; b < bins; b++) {
        const xv = (b - (bins - 1) / 2) / 2;
        const freq = gauss(xv, mu0, 0.9) * (1 + 0.15 * Math.sin(xv * 2));
        const bh = freq * hh * 0.95;
        ctx.fillStyle = '#b8c9a7';
        ctx.fillRect(hx + b * binW + 2, hy + hh - bh, binW - 4, bh);
      }

      const mu = s.mode === 1 ? mu0 : 0;
      const sig = s.mode === 1 ? 0.9 : 2.6;
      ctx.strokeStyle = s.mode === 1 ? '#228d5c' : '#c43f52';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const xv = (i / 200) * 5 - 2.5;
        const gx = hx + ((xv + 2.5) / 5) * hw;
        const gy = hy + hh - gauss(xv, mu, sig) * hh * 0.95;
        if (i === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.stroke();

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(s.mode === 1 ? '超先验' : '无先验', hx, hy - 12);
      ctx.fillText('符号值', hx + hw - 48, hy + hh + 22);
    };

    const tick = () => {
      render(stateRef.current);
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

  const pick = (m: number) => {
    stateRef.current.mode = m;
    setMode(m);
    if (m === 1) setFeedback({ text: '有超先验：分布贴合符号直方图，码率下降。', cls: 'good' });
    else setFeedback({ text: '无超先验：分布不贴合，码率偏高。', cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 0 ? 'selected' : ''}`} onClick={() => pick(0)}>
          无超先验
        </button>
        <button className={`chip ${mode === 1 ? 'selected' : ''}`} onClick={() => pick(1)}>
          有超先验
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
