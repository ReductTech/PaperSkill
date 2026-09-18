import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch6.1 — autoregressive generation step-through (P2).
const W = 1080;
const H = 280;

const TOKENS = ['转', '写', '：', '今天', '天气', '很好', '。'];

export const C9Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (step: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // audio representation bar
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(60, 50, W - 120, 26);
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('音频表征', 60, 42);
      // generated tokens
      let x = 60;
      for (let i = 0; i < step; i++) {
        ctx.fillStyle = i === step - 1 ? '#f07e47' : '#27446e';
        ctx.fillRect(x, 140, 96, 40);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(TOKENS[i], x + 10, 166);
        x += 108;
      }
      // arrow back to decoder
      if (step > 0) {
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 12, 140);
        ctx.lineTo(x - 12, 110);
        ctx.lineTo(W - 80, 110);
        ctx.stroke();
      }
      ctx.fillStyle = '#21324a';
      ctx.fillText('已生成 ' + step + ' 个 token', 60, 230);
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
    const s = Math.max(0, Math.min(TOKENS.length, step + d));
    stateRef.current.step = s;
    setStep(s);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(1)} disabled={step === TOKENS.length}>
          下一步
        </button>
        <button type="button" onClick={() => go(-step)} disabled={step === 0}>
          重置
        </button>
        <span className="val">第 {step} 步 / {TOKENS.length}</span>
      </div>
      <div className="feedback">每生成一个 token，就以它为条件继续生成下一个。</div>
    </div>
  );
};

export default C9Mod2;
