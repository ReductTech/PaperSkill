import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const SIGMA_FACTORIZED = new Array(14).fill(0.5);
const SIGMA_HYPER = [0.22, 0.24, 0.34, 0.52, 0.78, 0.92, 0.96, 0.9, 0.6, 0.36, 0.26, 0.22, 0.2, 0.22];

export const ModPriorModes: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'factorized' });
  const raf = useRef<number | null>(null);
  const [mode, setMode] = useState('factorized');
  const [fb, setFb] = useState({ text: '当前：分解先验——每处都套用相同的 σ，忽略了空间差异。', cls: '' });

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

      const sigmas = s.mode === 'factorized' ? SIGMA_FACTORIZED : SIGMA_HYPER;
      const color = s.mode === 'factorized' ? '#c43f52' : '#228d5c';
      const bw = 52;
      const gap = 20;
      const startX = (W - sigmas.length * (bw + gap)) / 2;

      ctx.fillStyle = '#68778f';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('σ', 40, H - 40);

      sigmas.forEach((sig, i) => {
        const x = startX + i * (bw + gap);
        const h = sig * 180;
        ctx.fillStyle = color;
        ctx.fillRect(x, H - 50 - h, bw, h);
        ctx.strokeStyle = '#d7deea';
        ctx.strokeRect(x, H - 50 - h, bw, h);
      });

      // baseline
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, H - 50);
      ctx.lineTo(W - 40, H - 50);
      ctx.stroke();
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

  const pick = (m: string) => {
    stateRef.current.mode = m;
    setMode(m);
    if (m === 'factorized') setFb({ text: '分解先验：每处 σ 都一样（红），把边缘与平坦处一视同仁——浪费比特。', cls: 'bad' });
    else setFb({ text: '尺度超先验：σ 由 z 预测、跟着细节密度走（绿）——比特花在刀刃上。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'factorized' ? 'selected' : ''}`} onClick={() => pick('factorized')}>
          分解先验
        </button>
        <button className={`chip ${mode === 'hyperprior' ? 'selected' : ''}`} onClick={() => pick('hyperprior')}>
          尺度超先验
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModPriorModes;
