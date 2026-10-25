import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const RACERS = [
  { label: 'JPEG', v: 0, color: '#c43f52' },
  { label: 'JPEG2000', v: 35.5, color: '#f07e47' },
  { label: 'WebP', v: 41.2, color: '#f07e47' },
  { label: 'Ballé 2018', v: 44.9, color: '#27446e' },
  { label: 'BPG', v: 53.6, color: '#27446e' },
  { label: '本文', v: 59.8, color: '#228d5c' },
];

export const Mod101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ running: false, startTime: 0, done: false });
  const rafRef = useRef<number | null>(null);
  const [done, setDone] = useState(false);
  const [metric, setMetric] = useState('ms-ssim');
  const [feedback, setFeedback] = useState({ text: '点「开始对比」，看各方法相对 JPEG 的码率节省。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const s = stateRef.current;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      const n = RACERS.length;
      const slot = 160;
      const barW = 60;
      const baseY = H - 40;
      const maxH = 180;

      RACERS.forEach((r, idx) => {
        const x = 60 + idx * slot;
        let prog = 0;
        if (s.running) {
          const t = clamp((now - s.startTime) / 1800, 0, 1);
          prog = clamp((t - idx * 0.08) / 0.7, 0, 1);
          if (t >= 1) {
            s.running = false;
            s.done = true;
            setDone(true);
            setFeedback({ text: '本文（绿）以 59.8% 的码率节省冲到最远，远超 BPG 与各经典方法。', cls: 'good' });
          }
        } else if (s.done) {
          prog = 1;
        }

        const h = (r.v / 60) * maxH * easeOutCubic(prog);
        ctx.fillStyle = r.color;
        ctx.fillRect(x, baseY - h, barW, h);
        ctx.fillStyle = '#21324a';
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(r.label, x + barW / 2, baseY + 22);
        if (prog >= 1 && r.v > 0) {
          ctx.fillStyle = '#21324a';
          ctx.fillText(r.v.toFixed(1) + '%', x + barW / 2, baseY - h - 8);
        }
        ctx.textAlign = 'left';
      });

      ctx.fillStyle = '#68778f';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('相对 JPEG 的码率节省（MS-SSIM；中间条为示意值）', 60, 30);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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

  const onStart = () => {
    if (stateRef.current.running) return;
    stateRef.current.running = true;
    stateRef.current.done = false;
    stateRef.current.startTime = performance.now();
    setDone(false);
    setFeedback({ text: '各方法同时起跑……', cls: '' });
  };

  const onMetric = (m: string) => {
    setMetric(m);
    if (m === 'psnr') setFeedback({ text: 'PSNR 上：本文相对上一代最强 DL 省 15.8%、相对 BPG 小 8.4%，并首次双超 BPG。', cls: '' });
    else setFeedback({ text: 'MS-SSIM 上：本文相对 JPEG 省 59.8%（绿条）。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={onStart} disabled={stateRef.current.running}>
          {done ? '再看一次' : '开始对比'}
        </button>
      </div>
      <div className="chip-row">
        <button className={`chip ${metric === 'ms-ssim' ? 'selected' : ''}`} onClick={() => onMetric('ms-ssim')}>
          MS-SSIM
        </button>
        <button className={`chip ${metric === 'psnr' ? 'selected' : ''}`} onClick={() => onMetric('psnr')}>
          PSNR
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod101;
