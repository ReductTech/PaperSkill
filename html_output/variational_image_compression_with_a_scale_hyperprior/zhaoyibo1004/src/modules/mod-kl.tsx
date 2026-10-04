import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

export const ModKl: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lam: 0.5 });
  const raf = useRef<number | null>(null);
  const [lam, setLam] = useState(0.5);
  const [fb, setFb] = useState({ text: '拖动 λ，看失真项与码率项在总账里的占比如何重新分配。', cls: '' });

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

      // 失真项 D (left) shrinks as lam grows; 码率项 R (right) grows
      const dH = 60 + (1 - s.lam) * 150;
      const rH = 60 + s.lam * 150;

      ctx.fillStyle = '#c43f52';
      ctx.fillRect(180, H - 40 - dH, 180, dH);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(720, H - 40 - rH, 180, rH);

      ctx.fillStyle = '#21324a';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('失真 D', 270, H - 12);
      ctx.fillText('码率 R', 810, H - 12);

      // balance line
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, H - 40 - (dH + rH) / 2 + 4);
      ctx.lineTo(960, H - 40 - (dH + rH) / 2 + 4);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.lam = v;
    setLam(v);
    if (v > 0.66) setFb({ text: `λ=${v.toFixed(2)}：失真项被压得很小，码率项占大头——保真优先。`, cls: 'good' });
    else if (v < 0.33) setFb({ text: `λ=${v.toFixed(2)}：码率项很小，失真项占大头——省比特优先。`, cls: '' });
    else setFb({ text: `λ=${v.toFixed(2)}：失真与码率大致均衡，总账最小。`, cls: '' });
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

export default ModKl;
