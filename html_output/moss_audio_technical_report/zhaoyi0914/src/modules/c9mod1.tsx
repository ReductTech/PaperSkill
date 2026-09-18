import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch4.1 — AAS error calculator (P1 slider, mathematical view).
const W = 1080;
const H = 280;

export const C9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ shift: 0 });
  const rafRef = useRef<number | null>(null);
  const [shift, setShift] = useState(0);
  const [fb, setFb] = useState({ text: '拖动偏移，观察 AAS 如何随绝对误差变化。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const refs = [0.5, 1.5, 2.5, 3.5, 4.5];
    const render = (shiftMs: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // axis
      ctx.strokeStyle = '#d7deea';
      ctx.beginPath();
      ctx.moveTo(60, 120);
      ctx.lineTo(W - 40, 120);
      ctx.stroke();
      const scale = (W - 140) / 5; // per second
      // reference marks
      refs.forEach((r) => {
        const x = 60 + r * scale;
        ctx.fillStyle = '#228d5c';
        ctx.fillRect(x, 100, 3, 40);
      });
      // predicted marks shifted
      const sh = shiftMs / 1000;
      refs.forEach((r) => {
        const x = 60 + (r + sh) * scale;
        ctx.fillStyle = '#27446e';
        ctx.fillRect(x, 60, 3, 40);
      });
      // error bars
      refs.forEach((r) => {
        const ex = 60 + r * scale;
        ctx.fillStyle = Math.abs(shiftMs) > 200 ? '#c43f52' : '#f07e47';
        ctx.fillRect(ex - 6, 180, 12, Math.min(80, Math.abs(shiftMs) / 6));
      });
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(Math.abs(shiftMs).toFixed(0) + ' ms', W - 150, 40);
    };
    const tick = () => {
      render(stateRef.current.shift);
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
    const v = Number(e.target.value);
    stateRef.current.shift = v;
    setShift(v);
    const a = Math.abs(v);
    setFb(
      a < 50
        ? { text: '对齐良好。', cls: 'good' }
        : a <= 200
        ? { text: '偏移可见。', cls: '' }
        : { text: '时间戳明显错位。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          整体偏移 <span className="val">{shift} ms</span>
        </label>
        <input type="range" min={-500} max={500} value={shift} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C9Mod1;
