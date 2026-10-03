import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text, roundedRect } from './qkit';
import type { WidgetProps } from './registry';

// 逐层量化（P2 逐步推进）。
const W = 1080;
const H = 280;
const TOTAL = 6;

export const LayerStep: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: '第 0 层：尚未量化。', cls: '' });

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
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const bw = W - 160;
      const gap = 10;
      const lh = 22;
      for (let i = 0; i < TOTAL; i += 1) {
        const y = 40 + i * (lh + gap);
        const done = i < s.step;
        roundedRect(ctx, 80, y, bw, lh, 4);
        ctx.fillStyle = done ? COLORS.green : COLORS.blue;
        ctx.fill();
        text(ctx, done ? `层 ${i + 1} · 已量化` : `层 ${i + 1}`, 96, y + lh / 2, done ? '#ffffff' : '#ffffff', 18);
      }
      text(ctx, `进度 ${s.step} / ${TOTAL}`, 80, H - 24, COLORS.ink, 20);
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

  const go = (s: number) => {
    stateRef.current.step = s;
    setStep(s);
    if (s === 0) setFeedback({ text: '第 0 层：尚未量化。', cls: '' });
    else if (s >= TOTAL) setFeedback({ text: '全部层量化完成：误差通过逐层补偿得到控制。', cls: 'good' });
    else setFeedback({ text: `第 ${s} 层量化：用已量化层的输出校准下一层。`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" disabled={step === 0} onClick={() => go(Math.max(0, step - 1))}>
          上一步
        </button>
        <button className="chip" disabled={step === TOTAL} onClick={() => go(Math.min(TOTAL, step + 1))}>
          下一步
        </button>
        <button className="chip" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default LayerStep;
