import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch7 Module 7.1 (P1+P4): progressive loss scheduling — drag the training round
// or switch schedules; alpha(t) slides supervision from the dense branch to the
// one-to-one branch. Default 0.8->0.1 wins (46.7 E2E mAP).
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e', orange: '#f07e47',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

const SCHED = {
  fixed: { label: '固定 0.5/0.5', alpha: (t: number) => 0.5, map: 46.4, cls: '' },
  def: { label: '0.8→0.1（默认）', alpha: (t: number) => 0.8 - 0.7 * t, map: 46.7, cls: 'good' },
  hard: { label: '1.0→0.1', alpha: (t: number) => 1.0 - 0.9 * t, map: 46.4, cls: '' },
  soft: { label: '0.9→0.1', alpha: (t: number) => 0.9 - 0.8 * t, map: 46.3, cls: '' },
};

const FB: Record<string, { text: string; cls: string }> = {
  def: { text: '前期 0.8 权重打基础，后期 0.1 收给一对一头——E2E mAP 46.7，全场最佳。', cls: 'good' },
  fixed: { text: '两头一样用力，推理头始终练不透：46.4。', cls: '' },
  hard: { text: '一开始就完全压掉一对一头，恢复不过来：46.4。', cls: '' },
  soft: { text: '起步偏弱也吃亏：46.3。', cls: '' },
};

export const Ch7Progressive: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ t: 0.6, sched: 'def' as keyof typeof SCHED });
  const [t, setT] = useState(60);
  const [sched, setSched] = useState<keyof typeof SCHED>('def');
  const [fb, setFb] = useState(FB.def);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current;
      const sch = SCHED[s.sched];
      const alpha = sch.alpha(s.t);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left: rider + schedule board ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 420, 54);
      const slopeH = lerp(6, 40, s.t) + lerp(24, 0, alpha);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 232); ctx.lineTo(420, 232 - slopeH); ctx.stroke();
      const px = 40 + ((time / 3000) % 1) * 300;
      const py = 232 - (px / 420) * slopeH + Math.sin(time / 120) * 1.5;
      const sc = 0.8;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 18 * sc, py, 14 * sc, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20 * sc, py, 14 * sc, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 18 * sc, py); ctx.lineTo(px - 2 * sc, py - 16 * sc); ctx.lineTo(px + 20 * sc, py); ctx.lineTo(px - 18 * sc, py);
      ctx.moveTo(px - 2 * sc, py - 16 * sc); ctx.lineTo(px + 4 * sc, py - 20 * sc);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2 * sc, py - 30 * sc, 6 * sc, 0, Math.PI * 2); ctx.fill();
      // schedule board with fill = t
      ctx.fillStyle = '#fff'; ctx.fillRect(300, 60, 100, 120);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.strokeRect(300, 60, 100, 120);
      ctx.fillStyle = C.green; ctx.fillRect(310, 170 - 100 * s.t, 80, 100 * s.t);
      ctx.strokeStyle = C.muted; ctx.strokeRect(310, 70, 80, 100);
      // ---- right inset: alpha curve + weight bars + mAP ----
      ctx.fillStyle = '#fff'; ctx.fillRect(460, 20, 600, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(460, 20, 600, 240);
      // curve axes
      const cx0 = 500; const cy0 = 60; const cw = 300; const ch = 130;
      ctx.strokeStyle = '#cdd6e4'; ctx.lineWidth = 1;
      ctx.strokeRect(cx0, cy0, cw, ch);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const tt = i / 40;
        const av = sch.alpha(tt);
        const x = cx0 + tt * cw; const y = cy0 + (1 - av) * ch;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // current point
      const ax = cx0 + s.t * cw; const ay = cy0 + (1 - alpha) * ch;
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = '13px sans-serif';
      ctx.fillText('α(t)', cx0, cy0 - 8);
      // weight bars
      ctx.fillText('o2m 权重', 830, 84);
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(830, 92, 200, 18);
      ctx.fillStyle = C.blue; ctx.fillRect(830, 92, 200 * alpha, 18);
      ctx.fillStyle = C.text; ctx.fillText('o2o 权重', 830, 134);
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(830, 142, 200, 18);
      ctx.fillStyle = C.green; ctx.fillRect(830, 142, 200 * (1 - alpha), 18);
      // mAP badge
      const best = s.sched === 'def';
      ctx.fillStyle = best ? C.green : C.blue;
      ctx.fillRect(830, 186, 120, 44);
      ctx.fillStyle = '#fff'; ctx.font = '22px sans-serif';
      ctx.fillText(String(sch.map), 858, 216);
      ctx.fillStyle = C.muted; ctx.font = '11px sans-serif';
      ctx.fillText(best ? 'E2E mAP 最佳' : 'E2E mAP', 836, 246);
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

  const update = (tv: number, sv: keyof typeof SCHED) => {
    stateRef.current.t = tv / 100;
    stateRef.current.sched = sv;
    setT(tv); setSched(sv);
    setFb(FB[sv]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          训练轮次 t <span className="val">{t}%</span>
        </label>
        <input type="range" min={0} max={100} value={t} onChange={(e) => update(Number(e.target.value), sched)} />
        <div className="chip-row">
          {(Object.keys(SCHED) as (keyof typeof SCHED)[]).map((k) => (
            <button key={k} className={`chip ${sched === k ? 'selected' : ''}`} onClick={() => update(t, k)}>{SCHED[k].label}</button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch7Progressive;
