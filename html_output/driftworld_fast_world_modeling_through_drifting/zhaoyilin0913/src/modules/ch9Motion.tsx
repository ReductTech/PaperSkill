import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 9 章：运动加权（P4 芯片）。均匀加权让抓手模糊，运动加权让抓手清晰。
const W = 1080;
const H = 280;
type Mode = 'uniform' | 'motion';

export const Ch9Motion: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'uniform' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('uniform');
  const [feedback, setFeedback] = useState({ text: '均匀加权：损失摊到背景，抓手模糊。', cls: 'bad' });

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
      const cy = H * 0.62;
      const dockX = W - 110;
      drawDock(ctx, dockX, cy, COLORS.green);
      drawBoat(ctx, 240, cy, 1, COLORS.blue, COLORS.green);
      const gx = 300;
      const gy = cy - 34;
      const ghost = s.mode === 'uniform' ? 5 : 0;
      for (let i = 0; i < ghost; i += 1) {
        ctx.fillStyle = COLORS.muted;
        ctx.fillRect(gx + (i - ghost / 2) * 7, gy + (i - ghost / 2) * 4, 34, 22);
      }
      ctx.fillStyle = ghost === 0 ? COLORS.green : COLORS.red;
      ctx.fillRect(gx, gy, 34, 22);
      text(ctx, '抓手', gx + 17, gy + 42, ghost === 0 ? COLORS.green : COLORS.red, 16, 'center');
      const fvd = s.mode === 'uniform' ? '46.1' : '22.9';
      text(ctx, `FVD ${fvd}`, 40, 34, COLORS.ink, 22);
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
    if (m === 'uniform') setFeedback({ text: '均匀加权：损失摊到背景，模型容易学成复制上一帧。', cls: 'bad' });
    else setFeedback({ text: '运动加权：损失聚焦运动区域，抓手清晰、FVD 更低。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'uniform' ? 'active' : ''}`} onClick={() => select('uniform')}>
          均匀加权
        </button>
        <button className={`chip ${mode === 'motion' ? 'active' : ''}`} onClick={() => select('motion')}>
          运动加权
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Motion;
