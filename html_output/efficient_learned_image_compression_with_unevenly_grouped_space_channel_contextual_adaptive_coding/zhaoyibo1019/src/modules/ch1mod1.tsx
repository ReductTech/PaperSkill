import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { photo } from './photokit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

// P1 slider: lambda trades rate against distortion; a photo develops in sync.
export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lambda: 0.5 });
  const rafRef = useRef<number | null>(null);
  const [lambda, setLambda] = useState(0.5);
  const [feedback, setFeedback] = useState({ text: '拖动 λ 滑块，观察码率与失真的权衡。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { lambda: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      photo(ctx, 60, 40, 300, 220, 1 - s.lambda);

      // rate bar (large lambda -> low rate)
      const bx = 640;
      const bw = 90;
      const by = 40;
      const bh = 220;
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(bx, by, bw, bh);
      const rate = 1 - s.lambda;
      const fh = bh * rate;
      ctx.fillStyle = rate > 0.7 ? '#c43f52' : rate < 0.3 ? '#228d5c' : '#27446e';
      ctx.fillRect(bx, by + bh - fh, bw, fh);

      // distortion bar (large lambda -> high distortion)
      const dx = 800;
      const dw = 90;
      const dy = 40;
      const dh = 220;
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(dx, dy, dw, dh);
      const dist = s.lambda;
      const dfh = dh * dist;
      ctx.fillStyle = dist > 0.7 ? '#c43f52' : dist < 0.3 ? '#228d5c' : '#27446e';
      ctx.fillRect(dx, dy + dh - dfh, dw, dfh);

      ctx.fillStyle = '#21324a';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('码率', bx, by - 12);
      ctx.fillText('失真', dx, dy - 12);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('λ = ' + s.lambda.toFixed(2), 940, 60);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.lambda = v;
    setLambda(v);
    if (v > 0.7) setFeedback({ text: 'λ 大：省码率了，但画面变模糊。', cls: 'good' });
    else if (v < 0.3) setFeedback({ text: 'λ 小：画面清晰，但码率飙升。', cls: 'bad' });
    else setFeedback({ text: '这是权衡区——没有「又小又清晰」的免费午餐。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          权衡系数 λ <span className="val">{lambda.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(lambda * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
