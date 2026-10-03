import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

// 结果对比（P8）：内存占用竞速。
const W = 1080;
const H = 280;

export const QuantRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ start: 0, running: false });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({ text: '点击「开始对比」查看内存占用。', cls: '' });
  const [, force] = useState(0);

  const rows = [
    { name: 'FP32', pct: 1.0, color: COLORS.red },
    { name: 'INT8', pct: 0.25, color: COLORS.blue },
    { name: 'INT4', pct: 0.125, color: COLORS.green },
  ];

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
      const p = s.running ? easeOutCubic(clamp((performance.now() - s.start) / 1500, 0, 1)) : 0;
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const labelW = 120;
      rows.forEach((r, i) => {
        const y = 40 + i * 70;
        const bw = (W - labelW - 100) * r.pct * p;
        text(ctx, r.name, 30, y + 16, COLORS.ink, 22);
        ctx.fillStyle = COLORS.axis;
        ctx.fillRect(labelW, y, W - labelW - 100, 34);
        ctx.fillStyle = r.color;
        ctx.fillRect(labelW, y, bw, 34);
        text(ctx, `${Math.round(r.pct * 100)}%`, W - 44, y + 16, COLORS.ink, 20, 'right');
      });
      text(ctx, '相对内存占用（越低越好）', 30, H - 20, COLORS.muted, 18);
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
    setFeedback({ text: 'INT4 内存仅约为 FP32 的 1/8，量化显著降低资源占用。', cls: 'good' });
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

export default QuantRace;
