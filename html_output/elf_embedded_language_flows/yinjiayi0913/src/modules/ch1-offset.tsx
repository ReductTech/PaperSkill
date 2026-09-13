import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, hand, ring, trace, curve, label, GUIDE, OK, BAD, MUTED, WHEEL } from './clayKit';

// 模块 1.1：噪声强度滑块 + 一次「推回中心」引导，展示误差累积与引导的作用。
const W = 1080;
const H = 300;
const CX = 400;
const CY = 196;

export const Ch1Offset: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ noise: 0.5, guided: false });
  const [noise, setNoise] = useState(0.5);
  const [fb, setFb] = useState({ text: '拖动「噪声强度」观察偏心如何累积，再点「推回中心」施加一次引导。', cls: '' });

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
      const s = stateRef.current;
      const offset = s.noise * (s.guided ? 0.45 : 1);
      field(ctx, W, H);
      ring(ctx, CX, CY, 92, GUIDE, true);
      const x = CX + offset * 250;
      trace(ctx, [[CX, CY], [x, CY]], s.guided ? OK : BAD, false);
      clay(ctx, x, CY, 68, 0.15 + 0.5 * offset, now / 520, WHEEL);
      if (s.guided) hand(ctx, x + 92, CY - 12, 1.3, 1);
      const pts: number[][] = [];
      for (let i = 0; i <= 20; i++) {
        const v = i / 20;
        pts.push([v, Math.min(1, v * (s.guided ? 0.45 : 1))]);
      }
      curve(ctx, 800, 70, 240, 140, pts, s.guided ? OK : BAD);
      label(ctx, s.guided ? '已引导' : '无引导', 806, 62, s.guided ? OK : BAD);
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

  const apply = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(event.target.value) / 100;
    stateRef.current.noise = v;
    setNoise(v);
    const offset = v * (stateRef.current.guided ? 0.45 : 1);
    setFb(
      offset > 0.7
        ? { text: '偏心太大：每走一步都取整，误差就累积成歪形。', cls: 'bad' }
        : offset < 0.3
        ? { text: '偏心很小，形状能稳定收在中心环里。', cls: 'good' }
        : { text: '还在漂移，继续调节看看趋势。', cls: '' }
    );
  };

  const guide = () => {
    stateRef.current.guided = true;
    setFb({ text: '一次引导就把偏离拉回中心，误差没有继续累积。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          噪声强度 <span className="val">{noise.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(noise * 100)} onChange={apply} />
        <button className="chip" onClick={guide} disabled={stateRef.current.guided}>
          推回中心
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch1Offset;
