import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch5.1 — time-marker insertion (P2 step-through).
// One horizontal 12.5 Hz feature stream with an aligned time ruler; a marker is
// inserted after every 25 features (= 2 s), giving the decoder absolute time.
const W = 1080;
const H = 280;
const DUR = 8; // seconds shown
const N_FRAMES = 100; // 12.5 Hz * 8 s
const PER_MARK = 25; // features between markers

export const C5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点击下一步，观察每 25 个特征后插入一个时间标记。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const x0 = 40;
    const x1 = W - 40;
    const xOf = (i: number) => x0 + (i / N_FRAMES) * (x1 - x0);

    const render = (step: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const shown = step * PER_MARK;
      // one horizontal feature stream
      for (let i = 0; i < N_FRAMES; i++) {
        const x = xOf(i);
        ctx.fillStyle = i < shown ? '#27446e' : '#d7deea';
        ctx.fillRect(x, 100, 7, 50);
      }
      // markers after every 25 features
      for (let k = 1; k <= step; k++) {
        const mx = xOf(k * PER_MARK);
        ctx.fillStyle = '#f07e47';
        ctx.fillRect(mx - 2, 80, 4, 90);
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText((k * 2) + 's', mx - 9, 70);
      }
      // aligned time ruler
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, 210);
      ctx.lineTo(x1, 210);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      for (let s = 0; s <= DUR; s += 2) {
        const x = xOf(s * 12.5);
        ctx.beginPath();
        ctx.moveTo(x, 205);
        ctx.lineTo(x, 215);
        ctx.stroke();
        ctx.fillText(s + 's', x - 8, 232);
      }
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('音频特征流（12.5 Hz）', x0, 70);
      ctx.fillText('每 25 个特征 = 2 秒', x0, 258);
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
    const s = Math.max(0, Math.min(4, step + d));
    stateRef.current.step = s;
    setStep(s);
    if (s === 0) setFb({ text: '尚未插入时间标记。', cls: '' });
    else setFb({ text: `已插入第 ${s} 个时间标记（第 ${s * 2} 秒）。`, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(-1)} disabled={step === 0}>
          上一步
        </button>
        <button type="button" onClick={() => go(1)} disabled={step === 4}>
          下一步
        </button>
        <button type="button" onClick={() => go(-step)} disabled={step === 0}>
          重置
        </button>
        <span className="val">第 {step} 步 / 4</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C5Mod1;
