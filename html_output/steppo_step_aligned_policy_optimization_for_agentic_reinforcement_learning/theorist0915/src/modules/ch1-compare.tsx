import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoad, drawCar, drawFlag, drawLabel, drawLegend } from './roadKit';

const W = 1080, H = 280;
export const Ch1Compare: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fb, setFb] = useState({ text: '点击开始，同步对比 token 级与步级导航。', cls: '' });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (p: number) => {
      clearScene(ctx, W, H);
      // two panels
      ctx.strokeStyle = C.axis; ctx.strokeRect(30, 30, 480, 220); ctx.strokeRect(560, 30, 480, 220);
      drawLabel(ctx, '旧：token', 50, 58, C.red);
      drawLabel(ctx, '新：交互步', 580, 58, C.green);
      drawRoad(ctx, 180, 480); // clipped visually by panel
      // left car jitter
      const lx = 60 + p * 380;
      drawCar(ctx, lx, 172 + Math.sin(p * 40) * 14 * (1 - p * 0.3), C.red);
      drawFlag(ctx, 470, 160, C.red);
      // right car smooth segments
      const rx = 590 + p * 380;
      drawCar(ctx, rx, 172, C.green);
      drawFlag(ctx, 1000, 160, C.green);
      drawLegend(ctx, [
        { color: C.red, label: '旧方法' },
        { color: C.green, label: 'StepPO' },
      ], 40, 250);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (now: number) => {
      if (!running) { render(progress); return; }
      const p = clamp((now - startRef.current) / 2400, 0, 1);
      setProgress(p);
      render(p);
      if (p >= 1) {
        setRunning(false);
        setFb({ text: '同起点下，步级路径更稳；token 级在局部抖动中浪费信用。', cls: 'good' });
        stop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    render(progress);
    return () => { stop(); disconnect(); };
  }, [running, progress]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => {
          setProgress(0); startRef.current = performance.now(); setRunning(true);
          setFb({ text: '两侧同步出发……', cls: '' });
        }}>开始对比</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch1Compare;
