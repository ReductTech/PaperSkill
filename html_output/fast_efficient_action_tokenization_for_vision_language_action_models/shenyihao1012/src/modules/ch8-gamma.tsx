import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawLegend } from './packKit';
import type { WidgetProps } from './registry';

// Module 8.2 (P1 slider) — the γ trade-off bench. Per the paper: larger γ
// means finer quantization (more tokens, lower reconstruction error), smaller γ
// compresses harder (fewer tokens, higher error). The paper reports both
// hyperparameters are insensitive; the default γ=10 sits in the sweet spot.
// Curves are qualitative trend lines (no fabricated numeric y-values).
const W = 1080;
const H = 300;
const X0 = 96;
const X1 = 1000;
const Y0 = 64;
const Y1 = 238;

const gx = (g: number): number => X0 + ((g - 1) / 19) * (X1 - X0);
const cy = (v: number): number => Y1 - v * (Y1 - Y0);

// token count: rises with γ (finer quantization keeps more non-zero entries)
const tokCurve = (g: number): number => 0.16 + 0.84 * (1 - Math.exp(-(g - 1) / 8.5));
// reconstruction error: falls with γ, flattening out (diminishing returns)
const errCurve = (g: number): number => 0.05 + 0.95 * Math.exp(-(g - 1) / 5.2);

function drawPlot(ctx: CanvasRenderingContext2D, gamma: number, ms: number): void {
  ctx.clearRect(0, 0, W, H);
  drawSceneBg(ctx, W, H, { ground: false });

  // sweet-spot band around γ=10
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = C.green;
  ctx.fillRect(gx(7), Y0 - 8, gx(13) - gx(7), Y1 - Y0 + 16);
  ctx.restore();

  // axes + x ticks (bare numbers)
  ctx.save();
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X0, Y1);
  ctx.lineTo(X1, Y1);
  ctx.moveTo(X0, Y0 - 6);
  ctx.lineTo(X0, Y1);
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  [1, 5, 10, 15, 20].forEach((g) => {
    const x = gx(g);
    ctx.beginPath();
    ctx.moveTo(x, Y1);
    ctx.lineTo(x, Y1 + 5);
    ctx.stroke();
    ctx.fillText(String(g), x, Y1 + 9);
  });
  ctx.restore();

  // the two trend curves
  const curve = (fn: (g: number) => number, color: string): void => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let g = 1; g <= 20.0001; g += 0.25) {
      const x = gx(g);
      const y = cy(fn(g));
      if (g <= 1.0001) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };
  curve(tokCurve, C.purple);
  curve(errCurve, C.orange);

  // current γ marker line + pulsing points on both curves
  const cx = gx(gamma);
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.75;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(cx, Y1);
  ctx.lineTo(cx, Y0 - 8);
  ctx.stroke();
  ctx.setLineDash([]);
  const pulse = 0.5 + 0.5 * Math.sin(ms / 300);
  const marker = (y: number, color: string): void => {
    ctx.globalAlpha = 0.22 + 0.22 * pulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, y, 10 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(cx, y, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
  };
  marker(cy(tokCurve(gamma)), C.purple);
  marker(cy(errCurve(gamma)), C.orange);
  ctx.restore();

  drawSceneLabel(ctx, '甜点 γ≈10', (gx(7) + gx(13)) / 2, Y0 + 8, {
    color: C.green,
    align: 'center',
  });
  drawSceneLabel(ctx, 'γ（量化缩放）', X1, Y1 + 30, { color: C.muted, align: 'right' });
  drawLegend(ctx, [['token 数', C.purple], ['重建误差', C.orange]], 40, 26);
}

function gammaFeedback(g: number): { text: string; cls: string } {
  if (g < 4) return { text: '压太狠：误差抬头', cls: 'bad' };
  if (g > 15) return { text: '更精细但 token 变多——收益递减', cls: '' };
  return { text: '甜点：γ=10，误差与压缩兼得', cls: 'good' };
}

export const Ch8Gamma: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ gamma: number }>({ gamma: 10 });
  const [gamma, setGamma] = useState(10);
  const [feedback, setFeedback] = useState(() => gammaFeedback(10));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      drawPlot(ctx, stateRef.current.gamma, ms);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  // listens to the `input` event so the curves track the thumb while dragging
  const onGammaInput = (e: React.FormEvent<HTMLInputElement>) => {
    const v = Number(e.currentTarget.value);
    stateRef.current.gamma = v;
    setGamma(v);
    setFeedback(gammaFeedback(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          量化 γ <span className="val">{gamma}</span>
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={gamma}
          onInput={onGammaInput}
          onChange={onGammaInput}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Gamma;
