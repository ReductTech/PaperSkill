import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch4 Module 3 — 签名交互 ③：a-contrario 检验（拖动对齐像素数 → KEEP/REJECT）
const W = 460;
const H = 220;
const N = 200;
const P = 1 / 16;
const N_T = 10000;

function tailNormal(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.max(0, z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const poly = t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return d * poly;
}
function nfaFor(k: number) {
  const mean = N * P;
  const sd = Math.sqrt(N * P * (1 - P));
  return N_T * tailNormal((k - mean) / sd);
}

export const M43: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [align, setAlign] = useState(34);
  const [feedback, setFeedback] = useState({
    text: '拖动「对齐像素数 k」：足够多像素方向一致，这条线才不像「乱画」——NFA ≤ 1 才通过。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (k: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 120; i++) {
        const along = (i / 120) * 330 + 24;
        const off = ((i * 37) % 22) - 11;
        const isAligned = i < (k / N) * 120;
        ctx.fillStyle = isAligned ? '#228d5c' : '#d7deea';
        ctx.globalAlpha = isAligned ? 0.9 : 0.5;
        ctx.beginPath();
        ctx.arc(along, 110 + off, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const passed = nfaFor(k) <= 1;
      ctx.strokeStyle = passed ? '#228d5c' : '#c43f52';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(24, 110);
      ctx.lineTo(354, 110);
      ctx.stroke();
      ctx.strokeStyle = passed ? '#228d5c' : '#c43f52';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(24, 110);
      ctx.lineTo(354, 110);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const nfa = nfaFor(k);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('Would this alignment happen by chance?', 24, 30);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('n = 200 支撑像素 · p = 1/16', 24, 190);
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('NFA ≈ ' + (nfa > 999 ? nfa.toExponential(1) : nfa.toFixed(2)), 24, 150);
      ctx.fillStyle = passed ? '#228d5c' : '#c43f52';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText(passed ? '✓ KEEP' : '✗ REJECT', 250, 120);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef(34);
  stateRef.current = align;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const k = Number(e.target.value);
    stateRef.current = k;
    setAlign(k);
    const nfa = nfaFor(k);
    setFeedback(
      nfa <= 1
        ? { text: `k=${k}：NFA=${nfa.toFixed(2)} ≤ 1，这条线不可能是乱画出来的——通过，收进学生目标。`, cls: 'good' }
        : { text: `k=${k}：NFA=${nfa.toFixed(1)} > 1，噪声也能凑成这样——拒绝，绝不能污染目标。`, cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          对齐像素数 k <span className="val">{align}</span>
        </label>
        <input type="range" min={5} max={90} value={align} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M43;
