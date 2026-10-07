import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, startCanvasLoop, lerp, loopX, drawCyclist, drawClouds } from '../lib/canvasKit';
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
  const stateRef = useRef({ t: 0.6, sched: 'def' as keyof typeof SCHED });
  const easeRef = useRef({ t: 0.6, alpha: SCHED.def.alpha(0.6) });
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
      const e = easeRef.current;
      const sch = SCHED[s.sched];
      // eased transitions: dragging the slider or switching schedules glides
      e.t = lerp(e.t, s.t, 0.12);
      e.alpha = lerp(e.alpha, sch.alpha(s.t), 0.12);
      const alpha = e.alpha;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      drawClouds(ctx, time, 430, 24);
      // ---- left: rider + schedule board ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 420, 54);
      const slopeH = lerp(6, 40, e.t) + lerp(24, 0, alpha);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 232); ctx.lineTo(420, 232 - slopeH); ctx.stroke();
      // seamless off-screen loop, spinning wheels and pedaling
      const px = loopX((time / 4200) % 1, 420, 50);
      const py = 232 - (px / 420) * slopeH + Math.sin(time / 120) * 1.5;
      drawCyclist(ctx, px, py, { scale: 0.8, color: C.blue, riderColor: C.blue, wheelPhase: px / 11 });
      // schedule board with fill = t (eased)
      ctx.fillStyle = '#fff'; ctx.fillRect(300, 60, 100, 120);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.strokeRect(300, 60, 100, 120);
      ctx.fillStyle = C.green; ctx.fillRect(310, 170 - 100 * e.t, 80, 100 * e.t);
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
      // current point (eased)
      const ax = cx0 + e.t * cw; const ay = cy0 + (1 - alpha) * ch;
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = '13px sans-serif';
      ctx.fillText('α(t)', cx0, cy0 - 8);
      // weight bars (eased)
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

    return startCanvasLoop(canvas, render);
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
