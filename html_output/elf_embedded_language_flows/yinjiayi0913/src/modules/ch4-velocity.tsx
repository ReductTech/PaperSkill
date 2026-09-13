import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, hand, ring, trace, curve, arrow, label, GUIDE, BAD, MUTED, WHEEL } from './clayKit';

// 模块 4.1：拖动时间 t，观察直线插值位置与速度权重 1/(1-t) 的变化。
const W = 1080;
const H = 300;

export const Ch4Velocity: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0.3);
  const [t, setT] = useState(0.3);
  const [fb, setFb] = useState({ text: '拖动「时间 t」：手沿直线把泥推向目标轮廓，越接近终点需要补的距离越大。', cls: '' });

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
      const v = tRef.current;
      const x0 = 190;
      const y0 = 230;
      const x1 = 830;
      const y1 = 150;
      const x = x0 + (x1 - x0) * v;
      const y = y0 + (y1 - y0) * v;
      const weight = Math.min(10, 1 / Math.max(0.01, 1 - v));
      field(ctx, W, H);
      trace(ctx, [[x0, y0], [x1, y1]], GUIDE, true);
      ring(ctx, x1, y1, 62, GUIDE, true);
      clay(ctx, x0, y0, 34, 0.7, now / 400, '#d8dfcc');
      clay(ctx, x, y, 42 - 10 * v, 0.45 * (1 - v), now / 500, WHEEL);
      hand(ctx, x + 56, y - 10, 1.1, 1);
      arrow(ctx, x, y, x + 30 + weight * 12, y, v > 0.9 ? BAD : GUIDE);
      const pts: number[][] = [];
      for (let i = 0; i <= 24; i++) {
        const u = (i / 24) * 0.99;
        pts.push([i / 24, Math.min(1, (1 / (1 - u)) / 10)]);
      }
      curve(ctx, 830, 200, 210, 80, pts, v > 0.9 ? BAD : GUIDE);
      label(ctx, '权重', 836, 194, MUTED);
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

  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(event.target.value) / 100;
    tRef.current = v;
    setT(v);
    setFb(
      v >= 0.9
        ? { text: '权重 1/(1−t)² 急剧放大，这一步不适合拿来训练去噪。', cls: 'bad' }
        : { text: '斜率仍然平缓，x-预测在这个区间稳定可用。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          时间 t <span className="val">{t.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={99} value={Math.round(t * 100)} onChange={change} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch4Velocity;
