import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 Module 7.1 (P1 slider, technical): lambda_kine trade-off between joint error and geometry.
// Curves are didactic illustrations anchored at the paper's choice lambda=10 (not measured points).
const W = 1080;
const H = 280;

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lambda: 10 });
  const rafRef = useRef<number | null>(null);
  const [lambda, setLambda] = useState(10);
  const [feedback, setFeedback] = useState({ text: '论文取 λ_kine = 10：关节精度优先，几何仍保持。', cls: 'good' });

  const jointErr = (l: number) => 0.32 * Math.exp(-l / 6) + 0.09; // falls with lambda
  const geoPenalty = (l: number) => 0.1 + Math.max(0, l - 12) * 0.02; // rises only when extreme

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const GX = 90;
    const GY = 40;
    const GW = 700;
    const GH = 200;
    const toX = (l: number) => GX + (l / 20) * GW;
    const toY = (v: number) => GY + GH - (v / 0.5) * GH;
    // displayed lambda trails the slider with delta-time exponential damping,
    // so marker/readouts glide to new positions instead of jumping.
    let dispLam = stateRef.current.lambda;
    let lastT: number | null = null;

    const render = (time: number) => {
      const dt = lastT === null ? 0 : Math.min((time - lastT) / 1000, 0.1);
      lastT = time;
      const target = stateRef.current.lambda;
      dispLam += (target - dispLam) * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(dispLam - target) < 0.005) dispLam = target;
      const lam = dispLam;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // axes
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(GX, GY, GW, GH);
      // paper choice marker (orange vertical line at 10)
      ctx.strokeStyle = '#f07e47';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(toX(10), GY);
      ctx.lineTo(toX(10), GY + GH);
      ctx.stroke();
      ctx.setLineDash([]);
      // curves
      const drawCurve = (fn: (l: number) => number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let l = 0; l <= 20; l += 0.25) {
          const x = toX(l);
          const y = toY(fn(l));
          if (l === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawCurve(jointErr, '#c43f52');
      drawCurve(geoPenalty, '#27446e');
      // current points
      ctx.fillStyle = '#c43f52';
      ctx.beginPath();
      ctx.arc(toX(lam), toY(jointErr(lam)), 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.arc(toX(lam), toY(geoPenalty(lam)), 7, 0, Math.PI * 2);
      ctx.fill();
      // readouts
      ctx.fillStyle = '#c43f52';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText(jointErr(lam).toFixed(2), 850, 110);
      ctx.fillStyle = '#27446e';
      ctx.fillText(geoPenalty(lam).toFixed(2), 850, 170);
      // legend (2 entries)
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText('红：关节误差  蓝：几何损耗', 830, 230);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 0, 20);
    stateRef.current.lambda = v;
    setLambda(v);
    if (v < 2) setFeedback({ text: 'λ 接近 0 等于不管关节：门装得上，却转不对。', cls: 'bad' });
    else if (v <= 15) setFeedback({ text: '论文取 λ_kine = 10：关节精度优先，几何仍保持。', cls: 'good' });
    else setFeedback({ text: '过度偏重关节，几何质量开始被挤占。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          λ_kine <span className="val">{lambda}</span>
        </label>
        <input type="range" min={0} max={20} step={1} value={lambda} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
