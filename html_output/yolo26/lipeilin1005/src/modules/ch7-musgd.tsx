import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch7 Module 7.2 (P3/P4): MuSGD vs SGD — MuSGD orthogonalizes updates so the
// drivetrain never slips: 47.4 mAP @ 500 epochs vs SGD 47.0 @ 600.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

const sgdAt = (f: number) => 46.0 + 1.0 * easeOutCubic(f); // 47.0 at epoch 600 (f=1)
const musgdAt = (f: number) => (f <= 500 / 600 ? 46.0 + 1.4 * easeOutCubic(f / (500 / 600)) : 47.4); // 47.4 at 500

export const Ch7MuSGD: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ mode: 'both', progress: 0, running: false, startAt: 0, done: false });
  const [mode, setMode] = useState<'sgd' | 'musgd' | 'both'>('both');
  const [fb, setFb] = useState({ text: '最终成绩：SGD 47.0@600ep，MuSGD 47.4@500ep。', cls: '' });
  const [btn, setBtn] = useState('开始');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current;
      if (s.running) {
        const raw = (time - s.startAt) / 2000;
        s.progress = Math.min(raw, 1);
        if (raw >= 1) { s.running = false; s.done = true; setBtn('再看一次'); setFb({ text: '同样的车，传动效率决定了谁先到达。', cls: 'good' }); }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left: drivetrain ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 400, 54);
      const crank = time / 400;
      const slip = s.mode === 'sgd' && Math.sin(time / 130) > 0.6;
      const rot = slip ? crank - Math.abs(Math.sin(time / 65)) * 0.6 : crank;
      const cx = 120; const cy = 150; const r1 = 24; const r2 = 70;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(300, cy + 10, r2, 0, Math.PI * 2); ctx.stroke();
      // chain
      ctx.strokeStyle = s.mode === 'sgd' ? C.red : C.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx + r1, cy); ctx.lineTo(300 + r2, cy + 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + r1, cy + 4); ctx.lineTo(300 + r2, cy + 14); ctx.stroke();
      // crank arm + pedal
      const showMu = s.mode !== 'sgd';
      ctx.strokeStyle = showMu ? C.green : slip ? C.red : C.blue; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(rot) * 34, cy + Math.sin(rot) * 34); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle as string;
      ctx.fillRect(cx + Math.cos(rot) * 34 - 7, cy + Math.sin(rot) * 34 - 4, 14, 8);
      // rear wheel spokes
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI) / 2;
        ctx.beginPath(); ctx.moveTo(300, cy + 10); ctx.lineTo(300 + Math.cos(a) * r2, cy + 10 + Math.sin(a) * r2); ctx.stroke();
      }
      if (slip) {
        ctx.fillStyle = C.red; ctx.font = '12px sans-serif';
        ctx.fillText('打滑!', 180, 110);
      }
      // ---- right inset: convergence curves ----
      ctx.fillStyle = '#fff'; ctx.fillRect(440, 20, 620, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(440, 20, 620, 240);
      const ax0 = 490; const ay0 = 50; const aw = 500; const ah = 160;
      ctx.strokeStyle = '#cdd6e4'; ctx.lineWidth = 1; ctx.strokeRect(ax0, ay0, aw, ah);
      // axes: mAP 46-48, epoch 0-600
      const yOf = (m: number) => ay0 + (1 - (m - 46) / 2) * ah;
      const xOf = (e: number) => ax0 + e * aw;
      ctx.fillStyle = C.muted; ctx.font = '11px sans-serif';
      ctx.fillText('48', ax0 - 22, yOf(48) + 4); ctx.fillText('46', ax0 - 22, yOf(46) + 4);
      ctx.fillText('0', ax0, ay0 + ah + 14); ctx.fillText('600 epoch', ax0 + aw - 52, ay0 + ah + 14);
      const p = s.progress;
      const drawCurve = (which: 'sgd' | 'musgd') => {
        const frac = which === 'musgd' ? Math.min(p / 0.86, 1) : p;
        const maxF = which === 'musgd' ? 500 / 600 : 1;
        const f = frac * maxF;
        ctx.strokeStyle = which === 'musgd' ? C.green : C.blue; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 60 * frac; i++) {
          const ff = i / 60;
          const m = which === 'musgd' ? musgdAt(ff) : sgdAt(ff);
          const x = ax0 + ff * aw; const y = yOf(m);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const mNow = which === 'musgd' ? musgdAt(f) : sgdAt(f);
        ctx.fillStyle = which === 'musgd' ? C.green : C.blue;
        ctx.beginPath(); ctx.arc(ax0 + f * aw, yOf(mNow), 5, 0, Math.PI * 2); ctx.fill();
      };
      if (s.mode !== 'musgd') drawCurve('sgd');
      if (s.mode !== 'sgd') drawCurve('musgd');
      // final badges
      ctx.font = '13px sans-serif';
      ctx.fillStyle = C.blue; ctx.fillText('SGD 47.0 @600ep', ax0 + 8, ay0 + 18);
      ctx.fillStyle = C.green; ctx.fillText('MuSGD 47.4 @500ep', ax0 + 8, ay0 + 36);
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (m: 'sgd' | 'musgd' | 'both') => {
    stateRef.current.mode = m;
    stateRef.current.progress = 0;
    stateRef.current.done = false;
    setMode(m); setBtn('开始');
    if (m === 'sgd') setFb({ text: '600 epoch 爬到 47.0——传动有损耗。', cls: '' });
    else if (m === 'musgd') setFb({ text: '500 epoch 达 47.4，少 16.7% 轮次还高 0.4。', cls: 'good' });
    else setFb({ text: '按开始，同步绘制两条收敛曲线。', cls: '' });
  };

  const run = () => {
    stateRef.current.progress = 0;
    stateRef.current.running = true;
    stateRef.current.startAt = performance.now();
    setBtn('绘制中…');
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button className={`chip ${mode === 'sgd' ? 'selected' : ''}`} onClick={() => pick('sgd')}>SGD</button>
          <button className={`chip ${mode === 'musgd' ? 'selected' : ''}`} onClick={() => pick('musgd')}>MuSGD</button>
          <button className={`chip ${mode === 'both' ? 'selected' : ''}`} onClick={() => pick('both')}>并排对比</button>
        </div>
        {mode === 'both' && <button onClick={run} disabled={btn === '绘制中…'}>{btn}</button>}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch7MuSGD;
