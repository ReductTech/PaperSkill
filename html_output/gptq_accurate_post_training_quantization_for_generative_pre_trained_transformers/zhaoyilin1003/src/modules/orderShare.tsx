import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

// 顺序共享（P4 芯片）：共享顺序 vs 逐行贪心。
const W = 1080;
const H = 280;
type Mode = 'shared' | 'greedy';

export const OrderShare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'shared' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('shared');
  const [feedback, setFeedback] = useState({ text: '共享顺序：速度快，精度代价很小。', cls: 'good' });

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
      const bw = W - 220;
      const rows = [
        { name: '精度', pct: s.mode === 'shared' ? 0.87 : 0.92, color: COLORS.green },
        { name: '速度', pct: s.mode === 'shared' ? 0.95 : 0.3, color: COLORS.blue },
      ];
      rows.forEach((r, i) => {
        const y = 50 + i * 80;
        text(ctx, r.name, 40, y + 16, COLORS.ink, 22);
        ctx.fillStyle = COLORS.axis;
        ctx.fillRect(160, y, bw, 34);
        ctx.fillStyle = r.color;
        ctx.fillRect(160, y, bw * r.pct, 34);
        text(ctx, (r.pct * 100).toFixed(0) + '%', 160 + bw * r.pct + 14, y + 16, COLORS.ink, 20);
      });
      text(ctx, s.mode === 'shared' ? '共享顺序' : '逐行贪心', W / 2, 34, COLORS.orange, 26, 'center');
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
    if (m === 'shared') setFeedback({ text: '共享顺序：所有行共用同一量化顺序，速度大幅提升，精度代价很小。', cls: 'good' });
    else setFeedback({ text: '逐行贪心：每行各自排序，精度略高，但更新次数暴涨、速度很慢。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'shared' ? 'active' : ''}`} onClick={() => select('shared')}>
          共享顺序
        </button>
        <button className={`chip ${mode === 'greedy' ? 'active' : ''}`} onClick={() => select('greedy')}>
          逐行贪心
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default OrderShare;
