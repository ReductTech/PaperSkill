import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

// 变换开关（P4 芯片）：变换前（偏斜难量化）vs 变换后（均匀易量化）。
const W = 1080;
const H = 280;
type Mode = 'before' | 'after';

export const TransformToggle: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'before' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('before');
  const [feedback, setFeedback] = useState({ text: '变换前：分布偏斜，量化误差较大。', cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { mode: Mode }) => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const cy = H * 0.55;
      for (let i = 0; i < 50; i += 1) {
        const x = s.mode === 'before' ? W * 0.2 + Math.sin(i * 23) * 110 : W * 0.5 + Math.sin(i * 29) * 260;
        ctx.fillStyle = s.mode === 'before' ? COLORS.orange : COLORS.green;
        ctx.beginPath();
        ctx.arc(x, cy + Math.cos(i * 19) * 20, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      text(ctx, s.mode === 'before' ? '偏斜分布' : '旋转后均匀分布', W / 2, 40, COLORS.ink, 22, 'center');
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

  const select = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    if (m === 'before') setFeedback({ text: '变换前：分布偏斜，量化误差较大。', cls: 'bad' });
    else setFeedback({ text: '变换后：分布更均匀，量化误差显著下降。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'before' ? 'active' : ''}`} onClick={() => select('before')}>
          变换前
        </button>
        <button className={`chip ${mode === 'after' ? 'active' : ''}`} onClick={() => select('after')}>
          变换后
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default TransformToggle;
