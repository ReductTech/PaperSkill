import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch3.1 — final-layer vs multi-layer (P3 synchronized before/after).
const W = 1080;
const H = 280;

export const C3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ running: false, t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [fb, setFb] = useState({ text: '点击开始，比较末层表征与多层注入的线索保留。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { running: boolean; t0: number }, now: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const p = s.running ? easeInOutQuad(Math.min(1, (now - s.t0) / 2200)) : 0;
      // divider
      ctx.strokeStyle = '#d7deea';
      ctx.beginPath();
      ctx.moveTo(W / 2, 20);
      ctx.lineTo(W / 2, H - 20);
      ctx.stroke();
      // left: final layer only
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(60, 80, 400 * (0.2 + 0.4 * p), 10);
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('仅末层', 60, 60);
      // right: multi-layer
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.3 + 0.6 * Math.min(1, p - i * 0.15);
        ctx.fillStyle = i === 0 ? '#27446e' : '#7c3aed';
        ctx.fillRect(560, 62 + i * 22, 400 * (0.3 + 0.5 * p), 12);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#21324a';
      ctx.fillText('多层注入', 560, 42);
      // result bars
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(60, 210, 400 * 0.45, 14);
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(560, 210, 400 * 0.82, 14);
    };
    const tick = () => {
      render(stateRef.current, performance.now());
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

  const start = () => {
    stateRef.current = { running: true, t0: performance.now() };
    setFb({ text: '多层注入保留了更多低/中层声学线索。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={start}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C3Mod1;
