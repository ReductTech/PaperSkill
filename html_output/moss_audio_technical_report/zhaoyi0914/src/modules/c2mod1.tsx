import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch2.2 — encoder multi-task training process (P2 step-through).
// The encoder is trained from scratch with ASR / AST / Audio Caption tasks (§2.2).
// Each step trains the SHARED encoder on one task; coverage grows as more tasks
// are seen, so the shared representation must serve all of them.
const W = 1080;
const H = 280;
const TASKS = ['ASR', 'AST', '音频描述'];
const MAX_STEP = 6;

export const C2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点击下一步，开始用三种任务训练共享编码器。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (k: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const activeTask = k > 0 ? (k - 1) % 3 : -1;
      const seen = Math.min(k, 3);

      // three task boxes (left)
      TASKS.forEach((t, i) => {
        const y = 50 + i * 70;
        const on = i === activeTask;
        ctx.fillStyle = on ? '#27446e' : '#d7deea';
        ctx.fillRect(80, y, 200, 46);
        ctx.fillStyle = on ? '#ffffff' : '#21324a';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(t, 110, y + 29);
        if (on) {
          ctx.strokeStyle = '#27446e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(280, y + 23);
          ctx.lineTo(470, 140);
          ctx.stroke();
        }
      });
      ctx.fillStyle = '#21324a';
      ctx.fillText('训练任务', 80, 36);

      // shared encoder (center)
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(470, 90, 180, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('共享编码器', 500, 145);

      // coverage bar (right)
      const cov = seen / 3;
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(800, 70, 60, 160);
      ctx.fillStyle = cov >= 1 ? '#228d5c' : '#27446e';
      ctx.fillRect(800, 230 - cov * 160, 60, cov * 160);
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('任务覆盖 ' + seen + '/3', 780, 55);
    };
    const tick = () => {
      render(stateRef.current.step);
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

  const go = (d: number) => {
    const s = Math.max(0, Math.min(MAX_STEP, step + d));
    stateRef.current.step = s;
    setStep(s);
    if (s === 0) setFb({ text: '点击下一步，开始用三种任务训练共享编码器。', cls: '' });
    else {
      const t = TASKS[(s - 1) % 3];
      const seen = Math.min(s, 3);
      setFb({
        text: `第 ${s} 步：用「${t}」训练共享编码器，已覆盖 ${seen}/3 种任务。`,
        cls: seen >= 3 ? 'good' : '',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(1)} disabled={step === MAX_STEP}>
          下一步
        </button>
        <button type="button" onClick={() => go(-step)} disabled={step === 0}>
          重置
        </button>
        <span className="val">第 {step} 步 / {MAX_STEP}</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C2Mod1;
