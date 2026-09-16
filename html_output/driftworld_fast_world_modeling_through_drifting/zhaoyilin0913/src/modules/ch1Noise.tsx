import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 1 章：扩散采样步数两难（P1 滑块）。步数越少越快但越偏，越多越准但越慢。
const W = 1080;
const H = 280;

export const Ch1Noise: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ steps: 32 });
  const rafRef = useRef<number | null>(null);
  const [steps, setSteps] = useState(32);
  const [feedback, setFeedback] = useState({ text: '步数适中，质量与速度都在折中。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { steps: number }) => {
      drawRiver(ctx, W, H);
      const dockX = W - 90;
      drawDock(ctx, dockX, H * 0.6, COLORS.green);
      const err = clamp(1 - s.steps / 64, 0, 1);
      const x = dockX - 42 - err * (W * 0.66);
      drawBoat(ctx, x, H * 0.6, 1, COLORS.blue, err > 0.55 ? COLORS.red : COLORS.green);
      text(ctx, `误差 ${(err * 100).toFixed(0)}%`, 40, 34, COLORS.ink, 24);
      text(ctx, `耗时 ${(s.steps * 0.012).toFixed(2)}s`, 40, 66, COLORS.muted, 20);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.steps = v;
    setSteps(v);
    const time = (v * 0.012).toFixed(2);
    if (v <= 6) {
      setFeedback({ text: `步数太少，误差很大但很快（约 ${time}s）。`, cls: 'bad' });
    } else if (v < 28) {
      setFeedback({ text: `误差中等，速度与质量都在折中（约 ${time}s）。`, cls: '' });
    } else {
      setFeedback({ text: `画面接近目标，但已耗时约 ${time}s，难以支撑实时规划。`, cls: 'good' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          采样步数 <span className="val">{steps}</span>
        </label>
        <input type="range" min={1} max={64} value={steps} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Noise;
