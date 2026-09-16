import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 3 章：逐步去噪 vs 一次漂移（P3 同步前后对比）。
const W = 1080;
const H = 300;

export const Ch3Compare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ start: 0, running: false });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({ text: '点击「开始对比」观察两条船到岸的过程。', cls: '' });
  const [, force] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { start: number; running: boolean }) => {
      const dur = 2200;
      const now = performance.now();
      const p = s.running ? clamp((now - s.start) / dur, 0, 1) : 0;
      drawRiver(ctx, W, H, 0);
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 20);
      ctx.lineTo(W / 2, H - 10);
      ctx.stroke();
      // 左边：扩散（红色，多步且抖动）
      drawDock(ctx, W / 2 - 64, H * 0.62, COLORS.red);
      const dProg = easeOutCubic(p);
      const dX = 52 + dProg * (W / 2 - 140) + Math.sin(p * 28) * (1 - p) * 7;
      drawBoat(ctx, dX, H * 0.62, 0.9, COLORS.red, COLORS.muted);
      text(ctx, '扩散 · 多步', W / 4, 34, COLORS.red, 22, 'center');
      // 右边：漂移（绿色，一步顺滑）
      drawDock(ctx, W - 64, H * 0.62, COLORS.green);
      const gX = W / 2 + 52 + p * (W / 2 - 140);
      drawBoat(ctx, gX, H * 0.62, 0.9, COLORS.blue, COLORS.green);
      text(ctx, '漂移 · 一步', (W * 3) / 4, 34, COLORS.green, 22, 'center');
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

  const begin = () => {
    stateRef.current = { start: performance.now(), running: true };
    setFeedback({ text: '对比进行中……漂移一次到位，扩散需要很多步。', cls: '' });
    force((n) => n + 1);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip active" onClick={begin}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Compare;
