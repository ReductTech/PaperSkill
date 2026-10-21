import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

// 舍入方式（P4 芯片）：就近取整 vs 自适应舍入。
const W = 1080;
const H = 280;
type Mode = 'nearest' | 'adaptive';

export const RoundChips: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'nearest' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('nearest');
  const [feedback, setFeedback] = useState({ text: '就近取整：每个数单独向最近的量化点靠拢。', cls: '' });

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
      const x0 = 140;
      const x1 = W - 100;
      const y = H * 0.55;
      // 数轴 0..1
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      for (let v = 0; v <= 1; v += 0.25) {
        const x = x0 + v * (x1 - x0);
        ctx.fillStyle = COLORS.muted;
        ctx.fillRect(x - 2, y - 8, 4, 16);
        text(ctx, v.toFixed(2), x, y + 26, COLORS.muted, 18, 'center');
      }
      const val = 0.4;
      const vx = x0 + val * (x1 - x0);
      const target = s.mode === 'nearest' ? 0.25 : 0.5;
      const tx = x0 + target * (x1 - x0);
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath();
      ctx.arc(vx, y - 34, 10, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '权重 0.40', vx, y - 60, COLORS.blue, 18, 'center');
      ctx.strokeStyle = s.mode === 'nearest' ? COLORS.red : COLORS.green;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(vx, y - 24);
      ctx.lineTo(tx, y - 24);
      ctx.stroke();
      ctx.fillStyle = s.mode === 'nearest' ? COLORS.red : COLORS.green;
      ctx.beginPath();
      ctx.arc(tx, y - 24, 8, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, `舍入到 ${target.toFixed(2)}`, tx, y - 56, s.mode === 'nearest' ? COLORS.red : COLORS.green, 18, 'center');
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
    if (m === 'nearest') setFeedback({ text: '就近取整：单点误差最小，但未必让整体任务损失最小。', cls: '' });
    else setFeedback({ text: '自适应舍入：根据任务损失决定向上还是向下，整体误差更小。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'nearest' ? 'active' : ''}`} onClick={() => select('nearest')}>
          就近取整
        </button>
        <button className={`chip ${mode === 'adaptive' ? 'active' : ''}`} onClick={() => select('adaptive')}>
          自适应舍入
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default RoundChips;
