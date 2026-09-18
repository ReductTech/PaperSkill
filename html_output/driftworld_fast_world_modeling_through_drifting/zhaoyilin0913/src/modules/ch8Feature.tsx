import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { drawRiver, drawBoat, drawDock, COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 8 章（模块二）：在哪个空间计算漂移损失（P4 芯片）。
const W = 1080;
const H = 280;
type Space = 'pixel' | 'latent' | 'dino';

export const Ch8Feature: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ space: Space }>({ space: 'pixel' });
  const rafRef = useRef<number | null>(null);
  const [space, setSpace] = useState<Space>('pixel');
  const [feedback, setFeedback] = useState({ text: '像素空间：复杂场景里细节不足，抓手模糊。', cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const ghost = (s: Space) => (s === 'pixel' ? 6 : s === 'latent' ? 3 : 0);
    const render = (s: { space: Space }) => {
      drawRiver(ctx, W, H);
      const dockX = W - 120;
      const cy = H * 0.6;
      const g = ghost(s.space);
      for (let i = 0; i < g; i += 1) {
        drawBoat(ctx, 180 + (i - g / 2) * 8, cy + (i - g / 2) * 4, 1, COLORS.muted, COLORS.muted);
      }
      drawBoat(ctx, 180, cy, 1, COLORS.blue, g === 0 ? COLORS.green : COLORS.muted);
      drawDock(ctx, dockX, cy, g === 0 ? COLORS.green : COLORS.muted);
      text(ctx, g === 0 ? '画面锐利' : '画面模糊', dockX, cy - 44, g === 0 ? COLORS.green : COLORS.red, 20, 'center');
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

  const select = (s: Space) => {
    stateRef.current.space = s;
    setSpace(s);
    if (s === 'pixel') setFeedback({ text: '像素空间：适合简单仿真任务，复杂场景里抓手模糊。', cls: 'bad' });
    else if (s === 'latent') setFeedback({ text: 'VAE 潜空间：丢掉部分细节，仍然偏模糊。', cls: '' });
    else setFeedback({ text: 'DINOv2/v3 特征空间：语义距离更合理，画面锐利。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {([
          ['pixel', '像素空间'],
          ['latent', 'VAE 潜空间'],
          ['dino', 'DINO 特征空间'],
        ] as Array<[Space, string]>).map(([s, label]) => (
          <button key={s} className={`chip ${space === s ? 'active' : ''}`} onClick={() => select(s)}>
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Feature;
