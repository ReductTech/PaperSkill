import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { photo } from './photokit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 340;
const STEPS = 4;

// P2 step-through: receive bits progressively; the picture sharpens.
export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: '逐步接收比特，看画面如何从空白到清晰。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const p = s.step / STEPS;
      photo(ctx, 60, 70, 420, 200, p);

      ctx.fillStyle = '#d7deea';
      ctx.fillRect(60, 40, 420, 20);
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(60, 40, 420 * p, 20);
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('已接收比特 ' + Math.round(p * 100) + '%', 500, 56);
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

  const go = (next: number) => {
    const s = clamp(next, 0, STEPS);
    stateRef.current.step = s;
    setStep(s);
    if (s === 0) setFeedback({ text: '还没收到比特，画面空白。', cls: '' });
    else if (s === 1) setFeedback({ text: '收到 25%：先出现粗略轮廓。', cls: '' });
    else if (s === 2) setFeedback({ text: '收到 50%：主体结构清晰。', cls: 'good' });
    else if (s === 3) setFeedback({ text: '收到 75%：补上大部分细节。', cls: 'good' });
    else setFeedback({ text: '全部比特到达：细节补全，图像复原。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          <b>{step}</b> / {STEPS} 步
        </span>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step === STEPS}>
          下一步 →
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
