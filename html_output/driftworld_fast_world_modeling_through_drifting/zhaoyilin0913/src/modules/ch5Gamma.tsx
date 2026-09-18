import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 5 章：动作增强（P1 滑块 γ）。γ 越大，越偏向「不看动作」的先验。
const W = 1080;
const H = 280;

export const Ch5Gamma: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ gamma: 0.3 });
  const rafRef = useRef<number | null>(null);
  const [gamma, setGamma] = useState(0.3);
  const [feedback, setFeedback] = useState({ text: '动作约束较强，船紧跟舵向。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { gamma: number }) => {
      drawRiver(ctx, W, H);
      const dockX = W - 90;
      const cy = H * 0.6;
      drawDock(ctx, dockX, cy, COLORS.green);
      const noActionX = W * 0.2;
      ctx.fillStyle = COLORS.muted;
      ctx.beginPath();
      ctx.arc(noActionX, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '空动作先验', noActionX, cy - 34, COLORS.muted, 18, 'center');
      text(ctx, '动作目标', dockX, cy - 34, COLORS.green, 18, 'center');
      const x = dockX - 30 + (noActionX - (dockX - 30)) * s.gamma;
      drawBoat(ctx, x, cy, 1, COLORS.blue, s.gamma > 0.55 ? COLORS.red : COLORS.green);
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
    const v = Number(e.target.value) / 100;
    stateRef.current.gamma = v;
    setGamma(v);
    if (v < 0.3) setFeedback({ text: '动作约束强：船紧跟动作方向，预测贴到目标。', cls: 'good' });
    else if (v < 0.6) setFeedback({ text: '动作与先验混合，预测在两者之间折中。', cls: '' });
    else setFeedback({ text: '先验占比过高：船随波逐流，几乎不理会动作。', cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          γ <span className="val">{gamma.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={90} value={Math.round(gamma * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Gamma;
