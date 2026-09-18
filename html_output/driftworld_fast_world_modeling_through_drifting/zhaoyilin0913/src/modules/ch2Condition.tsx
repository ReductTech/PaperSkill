import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 2 章：条件输入（P4 模式芯片）。历史帧 + 动作决定预测是否贴到真实轨迹。
const W = 1080;
const H = 280;
type Mode = 'none' | 'history' | 'full';

export const Ch2Condition: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'none' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('none');
  const [feedback, setFeedback] = useState({ text: '没有历史帧，预测几乎失去起点。', cls: 'bad' });

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
      drawRiver(ctx, W, H);
      const dockX = W - 90;
      const cy = H * 0.6;
      drawDock(ctx, dockX, cy, COLORS.green);
      drawBoat(ctx, 120, cy, 1, COLORS.blue, COLORS.muted);
      // 预测目标：随条件完整度越来越贴近真实码头。
      const targetX = s.mode === 'full' ? dockX - 30 : s.mode === 'history' ? W * 0.55 : W * 0.78;
      const targetColor = s.mode === 'full' ? COLORS.green : s.mode === 'history' ? COLORS.blue : COLORS.red;
      ctx.fillStyle = targetColor;
      ctx.beginPath();
      ctx.arc(targetX, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(150, cy);
      ctx.lineTo(targetX, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, '预测目标', targetX - 20, cy - 34, targetColor, 18, 'right');
      text(ctx, '真实目标', dockX, cy - 34, COLORS.green, 18, 'right');
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
    if (m === 'none') setFeedback({ text: '没有历史帧，预测失去起点，几乎随机。', cls: 'bad' });
    else if (m === 'history') setFeedback({ text: '知道起点但不知道动作方向，预测仍会跑偏。', cls: '' });
    else setFeedback({ text: '历史帧 + 动作齐备，预测贴到真实轨迹。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {([
          ['none', '无历史帧'],
          ['history', '仅历史帧'],
          ['full', '历史帧 + 动作'],
        ] as Array<[Mode, string]>).map(([m, label]) => (
          <button key={m} className={`chip ${mode === m ? 'active' : ''}`} onClick={() => select(m)}>
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Condition;
