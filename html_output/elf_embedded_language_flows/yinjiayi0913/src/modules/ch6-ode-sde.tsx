import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, trace, label, OK, BAD, MUTED, WHEEL } from './clayKit';

// 模块 6.2：同一时间基准下比较 ODE 与 SDE 两条采样路径（少步区间）。
const W = 1080;
const H = 300;
const GY = 200;

export const Ch6OdeSde: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef({ running: false, t0: 0 });
  const [running, setRunning] = useState(false);
  const [fb, setFb] = useState({ text: '按下开始：两侧同时出发，左为 ODE，右为 SDE。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (now: number) => {
      const r = runRef.current;
      const p = r.running ? Math.min(1, (now - r.t0) / 2600) : 0;
      field(ctx, W, H);
      const steps = 8;
      // ODE：平滑推进
      const odeX = 150 + 330 * p;
      trace(ctx, [[150, GY - 40], [480, GY - 40]], '#cfd8c2', true);
      clay(ctx, odeX, GY, 34, 0.5 * (1 - p), now / 600, '#d8dfcc');
      label(ctx, 'ODE', 140, 60, BAD);
      // SDE：每步抖动但整体更靠近目标
      const seg = Math.min(steps, Math.floor(p * steps) + 1);
      const pts: number[][] = [];
      for (let i = 0; i <= seg; i++) {
        const u = i / steps;
        const jitter = i === 0 ? 0 : 10 * Math.sin(i * 2.4);
        pts.push([150 + 330 * u * Math.min(1, p * steps / steps + 0.0001) + u * 330 * 0, GY - 40 + jitter]);
      }
      const sdeX = 150 + 330 * Math.min(1, p * 1.15);
      trace(ctx, [[150, GY - 40], [480, GY - 40]], '#cfd8c2', true);
      trace(ctx, pts, OK, false);
      clay(ctx, sdeX, GY, 34, 0.32 * (1 - Math.min(1, p * 1.15)), now / 600 + 1, WHEEL);
      if (p > 0.85) label(ctx, '更接近目标', 366, 60, OK);
      label(ctx, 'SDE', 140, 96, OK);
      ctx.save();
      ctx.strokeStyle = '#cfd8c2';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(150, GY - 84);
      ctx.lineTo(480, GY - 84);
      ctx.stroke();
      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const start = () => {
    runRef.current = { running: true, t0: performance.now() };
    setRunning(true);
    setFb({ text: '两条路径同时出发，比较谁更快靠近目标。', cls: '' });
    window.setTimeout(() => {
      runRef.current.running = false;
      setRunning(false);
      setFb({ text: '少步区间里，SDE 每步注入少量噪声能减小误差累积。', cls: 'good' });
    }, 2650);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={start} disabled={running}>
          {running ? '对比中…' : '开始对比'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch6OdeSde;
