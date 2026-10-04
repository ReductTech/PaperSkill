import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

export const ModRateDistortion: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lam: 0.5 });
  const raf = useRef<number | null>(null);
  const [lam, setLam] = useState(0.5);
  const [fb, setFb] = useState({ text: '拖动 λ，观察墨线密度与误差如何反向变化。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H - 58;
      ctx.fillStyle = '#b8c9a7';
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, H - 40);
      for (let x = 0; x <= W; x += 8) {
        const y = H - 40 - Math.sin((x - cx) * 0.006) * 42;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      const n = 2 + Math.round(s.lam * 9);
      ctx.strokeStyle = s.lam > 0.66 ? '#228d5c' : s.lam < 0.33 ? '#c43f52' : '#27446e';
      ctx.lineWidth = 2;
      for (let i = 0; i < n; i += 1) {
        const r = 0.14 + (i / Math.max(1, n - 1)) * (1.4 - s.lam * 0.5);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 70 + r * 330, 22 + r * 90, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const tick = () => {
      render();
      if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.lam = v;
    setLam(v);
    if (v > 0.66) setFb({ text: `λ=${v.toFixed(2)}：更看重「像」——墨线更密、码率更高，但误差更小。`, cls: 'good' });
    else if (v < 0.33) setFb({ text: `λ=${v.toFixed(2)}：更看重「省」——墨线稀疏、码率更低，但误差偏大。`, cls: '' });
    else setFb({ text: `λ=${v.toFixed(2)}：处在平衡区间——码率与误差都适中。`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          权衡系数 λ <span className="val">{lam.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(lam * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModRateDistortion;
