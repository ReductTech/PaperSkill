import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel, drawLegend } from './roadKit';

const W = 1080, H = 320;

/** Hand-traced approximate polyline from paper Figure 5 (not official table values). */
const steppoApprox = [
  [0, 0.42], [25, 0.48], [50, 0.52], [75, 0.55], [100, 0.58],
  [125, 0.61], [138, 0.64], [150, 0.63], [175, 0.63], [200, 0.63],
];
const ppoApprox = [
  [0, 0.40], [25, 0.44], [50, 0.47], [75, 0.49], [100, 0.52],
  [125, 0.55], [138, 0.57], [150, 0.56], [175, 0.55], [200, 0.55],
];

function sample(series: number[][], step: number) {
  for (let i = 0; i < series.length - 1; i++) {
    const [x0, y0] = series[i];
    const [x1, y1] = series[i + 1];
    if (step >= x0 && step <= x1) {
      const t = (step - x0) / (x1 - x0 || 1);
      return lerp(y0, y1, t);
    }
  }
  return series[series.length - 1][1];
}

/** Animated training curves for §10 — approximate readout of Figure 5. */
export const Ch10Race: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({
    text: '点击播放：复现 Figure 5 走势（手绘约值，非正式表格精确数）。',
    cls: '',
  });
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const x0 = 70, y0 = 40, pw = 920, ph = 220;
    const xOf = (s: number) => x0 + (s / 200) * pw;
    const yOf = (v: number) => y0 + ph - ((v - 0.40) / 0.25) * ph;

    const drawSeries = (series: number[][], color: string, upTo: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      let started = false;
      for (let s = 0; s <= upTo; s += 2) {
        const v = sample(series, s);
        const x = xOf(s);
        const y = yOf(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const render = (upTo: number) => {
      clearScene(ctx, W, H);
      drawLabel(ctx, 'HotpotQA 训练曲线（约值复现 Figure 5）', 40, 28, C.text);
      // axes
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(x0, y0, pw, ph);
      for (let i = 0; i <= 5; i++) {
        const v = 0.40 + i * 0.05;
        const y = yOf(v);
        ctx.strokeStyle = '#e8edf5';
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + pw, y);
        ctx.stroke();
        drawLabel(ctx, v.toFixed(2), 28, y + 4, C.muted);
      }
      for (let s = 0; s <= 200; s += 50) {
        drawLabel(ctx, String(s), xOf(s) - 8, y0 + ph + 18, C.muted);
      }
      drawLabel(ctx, 'Step →', x0 + pw - 50, y0 + ph + 18, C.muted);
      drawLabel(ctx, 'Score', 20, 36, C.muted);

      drawSeries(ppoApprox, '#5ec8d8', upTo);
      drawSeries(steppoApprox, '#6a329f', upTo);

      // peak markers (approx)
      if (upTo >= 138) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#6a329f';
        ctx.beginPath();
        ctx.moveTo(x0, yOf(0.64));
        ctx.lineTo(xOf(138), yOf(0.64));
        ctx.stroke();
        ctx.strokeStyle = '#5ec8d8';
        ctx.beginPath();
        ctx.moveTo(x0, yOf(0.57));
        ctx.lineTo(xOf(138), yOf(0.57));
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, '≈0.64', x0 + 8, yOf(0.64) - 6, '#6a329f');
        drawLabel(ctx, '≈0.57', x0 + 8, yOf(0.57) + 16, '#2a7a88');
      }

      drawLegend(ctx, [
        { color: '#6a329f', label: 'StepPO（约）' },
        { color: '#5ec8d8', label: 'Token PPO（约）' },
      ], 720, 36);
      drawLabel(ctx, `t = ${upTo}`, 960, 36, C.text);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      if (!running) { render(step); return; }
      const p = clamp((now - startRef.current) / 2800, 0, 1);
      const s = Math.round(p * 200);
      setStep(s);
      render(s);
      if (p >= 1) {
        setRunning(false);
        setFb({
          text: '多数训练步 StepPO 更高；峰值约 0.64 vs 0.57（读图约值）。证据仅限该 HotpotQA 受控对照。',
          cls: 'good',
        });
        stop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    render(step);
    return () => { stop(); disconnect(); };
  }, [running, step]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => {
          setStep(0);
          startRef.current = performance.now();
          setRunning(true);
          setFb({ text: '曲线播放中…', cls: '' });
        }}>播放曲线</button>
        <button type="button" onClick={() => { setRunning(false); setStep(200); setFb({ text: '已跳到终点（约值）。', cls: '' }); }}>跳到终点</button>
        <span className="approx-badge">读图约值 · 非表格精确数</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch10Race;
