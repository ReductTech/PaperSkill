import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel } from './river-kit';

// §4 Module 4.1: gamma slider — geometric weight bars + smoothed-signal overlay.

const W = 1080;
const H = 280;
const GAMMAS = [0, 0.5, 0.8, 0.9, 0.95, 0.99, 0.995, 0.999];

// synthetic one-step-update signal: trend + oscillation
const N = 90;
function deltaAt(i: number): number {
  return 0.03 * i + Math.sin(i * 0.9) * 0.5 + Math.sin(i * 2.7) * 0.22;
}

export const W4EmaWeights: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gi, setGi] = useState(3);
  const [fb, setFb] = useState({ text: 'γ=0.9：兼顾平滑与跟进（论文常用区间）。', cls: 'good' });

  useEffect(() => {
    render(gi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi]);

  const render = (idx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const gamma = GAMMAS[idx];
    clearScene(ctx, W, H);
    // left: weight bars w_i = (1-gamma) gamma^i
    const lx = 60;
    const lw = 380;
    const lh = H - 90;
    ctx.strokeStyle = C.border;
    ctx.strokeRect(lx, 40, lw, lh);
    for (let i = 0; i < 20; i++) {
      const w = (1 - gamma) * Math.pow(gamma, i);
      const bh = Math.min(lh - 10, w * (lh - 10) * (gamma > 0.9 ? 8 : 20));
      const hue = i < 3 ? C.blue : '#9db4c8';
      ctx.fillStyle = hue;
      const bw = lw / 22;
      ctx.fillRect(lx + 10 + i * (bw + 3), 40 + lh - 5 - bh, bw, bh);
    }
    drawLabel(ctx, '权重 w=(1−γ)γ  近→远', lx + 10, 30, C.muted, 13);
    drawLabel(ctx, `等效窗口 1/(1−γ)=${(1 / (1 - gamma)).toFixed(gamma > 0.99 ? 0 : 1)}`, lx + lw - 150, 30, C.text, 14);
    // right: raw signal vs EMA output
    const rx = 510;
    const rw = W - rx - 50;
    const ry = 40;
    const rh = H - 90;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.border;
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.fillRect(rx, ry, rw, rh);
    let ema = 0;
    const ptsRaw: number[] = [];
    const ptsEma: number[] = [];
    for (let i = 0; i < N; i++) {
      ema = gamma * ema + (1 - gamma) * deltaAt(i);
      ptsRaw.push(deltaAt(i));
      ptsEma.push(ema);
    }
    const scaleY = (v: number) => ry + rh / 2 - v * (rh / 3);
    const scaleX = (i: number) => rx + 8 + (i / (N - 1)) * (rw - 16);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ptsRaw.forEach((v, i) => (i ? ctx.lineTo(scaleX(i), scaleY(v)) : ctx.moveTo(scaleX(i), scaleY(v))));
    ctx.stroke();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ptsEma.forEach((v, i) => (i ? ctx.lineTo(scaleX(i), scaleY(v)) : ctx.moveTo(scaleX(i), scaleY(v))));
    ctx.stroke();
    drawLabel(ctx, '灰=Δx 原始　绿=EMA 输出', rx + 10, ry + 18, C.muted, 13);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = clamp(Number(e.target.value), 0, GAMMAS.length - 1);
    setGi(idx);
    const g = GAMMAS[idx];
    setFb(
      g >= 0.995
        ? { text: `γ=${g}：记忆很长，转弯时会滞后（NanoGPT 最优 0.995，需要配合提前休息）。`, cls: '' }
        : g >= 0.9
        ? { text: `γ=${g}：兼顾平滑与跟进（论文常用区间）。`, cls: 'good' }
        : { text: `γ=${g}：贴近最新一桨，平滑较弱。`, cls: '' }
    );
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <label>
          EMA 速率 γ <span className="val">{GAMMAS[gi]}</span>
        </label>
        <input type="range" min={0} max={7} value={gi} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W4EmaWeights;
