import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel } from './river-kit';

// §7 Module 7.1: gamma slider — contraction-factor curves of GD, NAG (gamma=0)
// and EMA-Nesterov (Theorem 1), with the acceleration threshold gamma < 1-1/kappa.

const W = 1080;
const H = 280;
const KAPPA = 50; // example condition number, labeled as such

export const W7RateCurve: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamma, setGamma] = useState(0);
  const [fb, setFb] = useState({ text: 'γ=0.00：与经典 NAG 重合（退化验证）。', cls: 'good' });

  useEffect(() => {
    render(gamma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamma]);

  const render = (g: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clearScene(ctx, W, H);
    const lx = 80;
    const ly = 40;
    const lw = W - 160;
    const lh = H - 110;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(lx, ly, lw, lh);
    const T = 600;
    // contraction factors per Theorem 1
    const gd = Math.pow(1 - 1 / KAPPA, 1); // per-iter factor
    const nag = Math.pow(1 - Math.sqrt(1 / KAPPA), 1);
    const ema = Math.pow(1 - Math.sqrt(Math.max(1e-6, 1 - g) / KAPPA), 1);
    const threshold = 1 - 1 / KAPPA;
    const scaleY = (f: number) => ly + lh - ((1 - f) / (1 - gd)) * (lh - 20) - 10;
    const line = (f: number, color: string, dash: number[]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(lx + 10, scaleY(f));
      ctx.lineTo(lx + lw - 10, scaleY(f));
      ctx.stroke();
      ctx.setLineDash([]);
    };
    // threshold vertical line at gamma = 1-1/kappa on the horizontal gamma axis
    // bottom strip: gamma axis with threshold marker
    const ax = lx;
    const ay = ly + lh + 28;
    ctx.strokeStyle = C.border;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + lw, ay);
    ctx.stroke();
    // color the gamma axis: green below threshold, red above
    const tx = ax + (threshold / 0.98) * lw;
    ctx.fillStyle = C.green;
    ctx.fillRect(ax, ay, Math.min(tx, ax + (g / 0.98) * lw), 6);
    ctx.fillStyle = C.red;
    ctx.fillRect(Math.max(ax, ax + (g / 0.98) * lw), ay, Math.max(0, tx - ax - (g / 0.98) * lw), 6);
    ctx.fillStyle = C.muted;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('γ=0', ax - 6, ay + 22);
    ctx.fillText(`门槛 γ*=1−1/κ=${threshold.toFixed(2)}`, tx - 50, ay + 22);
    // curves (flat per-iteration factor lines with value labels)
    line(gd, '#68778f', [6, 5]);
    line(nag, C.green, [8, 5]);
    const ok = g < threshold;
    line(ema, ok ? C.blue : C.red, []);
    drawLabel(ctx, `GD (1−1/κ)`, lx + lw - 130, scaleY(gd) - 8, '#68778f', 13);
    drawLabel(ctx, `NAG (γ=0)`, lx + lw - 130, scaleY(nag) - 8, C.green, 13);
    drawLabel(ctx, `EMA-Nesterov 因子 ${ema.toFixed(4)}`, lx + 14, scaleY(ema) - 10, ok ? C.blue : C.red, 14);
    // position marker on gamma axis
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(ax + (g / 0.98) * lw, ay + 3, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const g = Number(e.target.value) / 100;
    setGamma(g);
    const threshold = 1 - 1 / KAPPA;
    setFb(
      g < threshold
        ? { text: `γ=${g.toFixed(2)}：满足式(12) γ<1−1/κ，快于梯度下降（κ=50 为示例值）。`, cls: 'good' }
        : { text: `γ=${g.toFixed(2)}：越过门槛 γ*=1−1/κ，速率不再优于梯度下降。`, cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <label>
          EMA 速率 γ <span className="val">{gamma.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={98} value={Math.round(gamma * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W7RateCurve;
