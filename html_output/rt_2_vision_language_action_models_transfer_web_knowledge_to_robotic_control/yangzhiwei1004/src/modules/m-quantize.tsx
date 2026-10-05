import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: hybrid linked views (left salt jar + pan; right 1-D ruler + 256-bin histogram).
// m-quantize — chapter 4 active module (P1 slider + chips).
// Learner drags the continuous "咸淡量" 0.00–1.00 and switches bins 128/256.
// Canvas: left a salt jar over a pan; right a 1-D ruler that snaps the value to
// a bin, plus a quantization-error line. Orange = coarse (large error),
// green = fine enough. Evidence: page 5 §3.2 (256 uniform bins).
// ============================================================================

const W = 720;
const H = 300;
const C = {
  bg: '#f5f8f0',
  counter: '#e7e3d8',
  counterEdge: '#cfc8b6',
  envLight: '#b8c9a7',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

export const MQuantize: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const amount = useRef(0.5);
  const bins = useRef(256);
  const [amountUi, setAmountUi] = useState(0.5);
  const [binUi, setBinUi] = useState<128 | 256>(256);
  const [fb, setFb] = useState({ text: '拖动咸淡量，看它被归到哪个格子。', cls: '' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const h = 300;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.envLight;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, 0, w, 30);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.counter;
    ctx.fillRect(0, 210, w, h - 210);
    ctx.strokeStyle = C.counterEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(w, 210);
    ctx.stroke();

    // pan
    ctx.fillStyle = '#5a5f66';
    ctx.beginPath();
    ctx.ellipse(150, 214, 76, 27, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f444b';
    ctx.lineWidth = 2;
    ctx.stroke();
    // salt jar (tilt follows amount)
    ctx.save();
    ctx.translate(240, 150);
    ctx.rotate((amount.current - 0.5) * 1.1);
    ctx.fillStyle = '#dfe4ec';
    ctx.strokeStyle = '#9aa4b4';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-11, -20, 22, 30, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // falling salt grains (density follows amount)
    const grains = Math.round(2 + amount.current * 12);
    for (let i = 0; i < grains; i++) {
      const p = (performance.now() / 900 + i * 0.13) % 1;
      ctx.fillStyle = '#fdf6ee';
      ctx.beginPath();
      ctx.arc(238 + Math.sin(i) * 6, 168 + p * 40, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // ruler + bins
    const rx = 340;
    const rw = 340;
    const n = bins.current;
    const step = rw / Math.min(n, 64);
    const top = 80;
    const bot = 240;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, bot);
    ctx.lineTo(rx + rw, bot);
    ctx.stroke();
    // bars (histogram look)
    const drawn = Math.min(n, 64);
    for (let i = 0; i < drawn; i++) {
      const x = rx + i * step;
      ctx.fillStyle = '#e6ebf2';
      ctx.fillRect(x, bot - 22, Math.max(1, step - 1), 22);
    }
    // quantized marker
    const a = clamp(amount.current, 0, 1);
    const snapped = Math.round(a * (n - 1)) / (n - 1);
    const mx = rx + snapped * rw;
    ctx.fillStyle = C.blue;
    ctx.fillRect(mx - 1.5, top, 3, bot - top);
    // true value marker
    const tx = rx + a * rw;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, top - 10);
    ctx.lineTo(tx, bot + 4);
    ctx.stroke();
    // error line between them
    const err = Math.abs(tx - mx);
    if (err > 0.5) {
      ctx.strokeStyle = err > 3 ? C.orange : C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.min(tx, mx), top + 20);
      ctx.lineTo(Math.max(tx, mx), top + 20);
      ctx.stroke();
    }
    label(ctx, rx, 58, `格数 ${n}`);
    label(ctx, rx, 268, `量化误差 ${(Math.abs(a - snapped) * 255).toFixed(2)} / 255`);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recompute = (a: number, n: number) => {
    const snapped = Math.round(a * (n - 1)) / (n - 1);
    const err = Math.abs(a - snapped);
    setFb(
      err > 0.0039
        ? { text: '格子太稀，同一个 token 要表示一大段动作。', cls: 'bad' }
        : { text: '256 格足够细，动作几乎不失真。', cls: 'good' }
    );
  };

  const onAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    amount.current = v;
    setAmountUi(v);
    recompute(v, bins.current);
  };

  const onBin = (n: 128 | 256) => {
    bins.current = n;
    setBinUi(n);
    recompute(amount.current, n);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-m-quantize`} ref={canvasRef} width={W} height={H} aria-label="把连续咸淡量切成 256 格" />
      <div className="ctrl">
        <label>
          咸淡量 <span className="val">{amountUi.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(amountUi * 100)} onChange={onAmount} aria-label="咸淡量" />
      </div>
      <div className="chip-row">
        <button type="button" className={`chip ${binUi === 128 ? 'selected' : ''}`} onClick={() => onBin(128)}>
          128 格
        </button>
        <button type="button" className={`chip ${binUi === 256 ? 'selected' : ''}`} onClick={() => onBin(256)}>
          256 格
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MQuantize;
