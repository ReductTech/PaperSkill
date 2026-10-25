import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

export const Mod71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lambda: 0.025 });
  const rafRef = useRef<number | null>(null);
  const [lambda, setLambda] = useState(0.025);
  const [feedback, setFeedback] = useState({ text: 'λ=0.025，码率与失真均衡。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      const logt = clamp((Math.log10(s.lambda) - Math.log10(0.001)) / (Math.log10(0.1) - Math.log10(0.001)), 0, 1);

      // RD curve
      const ax = 60;
      const ay = 40;
      const aw = 500;
      const ah = 180;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(ax, ay, aw, ah);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let r = 0; r <= 1; r += 0.02) {
        const d = 0.92 * Math.exp(-2.6 * r) + 0.08;
        const px = ax + r * aw;
        const py = ay + d * ah;
        if (r === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const r = 0.25 + 0.55 * logt;
      const d = 0.92 * Math.exp(-2.6 * r) + 0.08;
      const px = ax + r * aw;
      const py = ay + d * ah;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#f07e47';
      ctx.fill();
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#68778f';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('码率 →', ax + aw - 60, ay + ah + 22);
      ctx.fillText('失真', ax - 4, ay - 8);

      // right bars
      const bx = 640;
      const bw = 380;
      const rate = r;
      const dist = d;
      ctx.fillStyle = '#27446e';
      ctx.fillRect(bx, 60, rate * bw, 40);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, 60, bw, 40);
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(bx, 160, dist * bw, 40);
      ctx.strokeRect(bx, 160, bw, 40);
      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('码率（越低越好）', bx, 52);
      ctx.fillText('失真（越低越好）', bx, 152);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 1000;
    stateRef.current.lambda = v;
    setLambda(v);
    if (v > 0.06) setFeedback({ text: 'λ 偏大：重画质，失真小但码率高。', cls: 'good' });
    else if (v < 0.01) setFeedback({ text: 'λ 偏小：重体积，码率低但失真大。', cls: '' });
    else setFeedback({ text: 'λ 居中，码率与失真均衡。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          λ <span className="val">{lambda.toFixed(3)}</span>
        </label>
        <input type="range" min={1} max={100} value={Math.round(lambda * 1000)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod71;
