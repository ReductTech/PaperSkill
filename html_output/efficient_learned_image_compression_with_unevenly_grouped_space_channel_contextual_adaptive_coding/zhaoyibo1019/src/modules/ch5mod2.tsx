import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;
const UNEVEN = [16, 16, 32, 64, 192];

// P4 chips: even 10-slice vs uneven 5-group, with entropy-estimation latency.
export const Ch5Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 0 });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState(0);
  const [feedback, setFeedback] = useState({ text: '切换均匀 / 非均匀分组，比较并行步数与延迟。', cls: '' });

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

      const groups = s.mode === 0 ? Array(10).fill(1) : UNEVEN;
      const total = groups.reduce((a, b) => a + b, 0);
      const gap = 6;
      const areaW = W - 120;
      let cx = 80;
      const y = 70;
      const hh = 90;
      groups.forEach((g) => {
        const gw = (g / total) * (areaW - gap * (groups.length - 1));
        ctx.fillStyle = s.mode === 0 ? '#c43f52' : '#228d5c';
        ctx.fillRect(cx, y, gw, hh);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, y, gw, hh);
        cx += gw + gap;
      });

      const lat = s.mode === 0 ? 13.46 : 6.45;
      const lw = (lat / 14) * 400;
      ctx.fillStyle = '#21324a';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('熵估计延迟', 80, 220);
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(80, 232, 400, 26);
      ctx.fillStyle = s.mode === 0 ? '#c43f52' : '#228d5c';
      ctx.fillRect(80, 232, lw, 26);
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(lat.toFixed(2) + ' ms', 80 + lw + 8, 252);
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
    if (m === 0) setFeedback({ text: '均匀 10 切片：10 步并行，延迟 13.46 ms。', cls: 'bad' });
    else setFeedback({ text: '非均匀 5 组：5 步并行，延迟 6.45 ms，砍半。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 0 ? 'selected' : ''}`} onClick={() => pick(0)}>
          均匀 10 切片
        </button>
        <button className={`chip ${mode === 1 ? 'selected' : ''}`} onClick={() => pick(1)}>
          非均匀 5 组
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod2;
