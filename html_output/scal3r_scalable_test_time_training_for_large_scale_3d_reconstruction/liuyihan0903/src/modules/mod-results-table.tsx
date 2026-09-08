import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9.2 — P4 chips switch a single evidence panel: geometry / runtime.
// geo: ETH3D CD 0.11 (↓ better) & F1 0.91 (↑ better), green.
// runtime: sequence-length vs time near-linear polyline (Table 5), blue.
// (失败情形 has moved to §10.1 mod-limitations.)

const W = 560;
const H = 240;

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.62, w * 0.6, h * 0.78);
  ctx.quadraticCurveTo(w * 0.85, h * 0.88, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h * 0.8, w * 0.5, h * 0.88);
  ctx.quadraticCurveTo(w * 0.8, h * 0.96, w, h * 0.86);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

type Tab = 'geo' | 'runtime';
interface State {
  t: number;
  tab: Tab;
}

export const ModResultsTable: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({ t: 0, tab: 'geo' });
  const rafRef = useRef<number | null>(null);
  const [tab, setTab] = useState<Tab>('geo');
  const [feedback, setFeedback] = useState({
    text: 'ETH3D：CD 0.11（越低越好）/ F1 0.91（越高越好）',
    cls: 'good',
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

    const renderGeo = (s: State) => {
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('几何精度（ETH3D）', 18, 28);

      // two metric readouts as cards
      const pulse = 0.5 + 0.5 * Math.sin(s.t * 0.06);
      const cards = [
        { label: 'Chamfer 距离 CD', val: '0.11', dir: '↓ 越低越好', x: 40 },
        { label: 'F1 分数', val: '0.91', dir: '↑ 越高越好', x: 300 },
      ];
      cards.forEach((c) => {
        ctx.fillStyle = '#eef4ea';
        ctx.fillRect(c.x, 60, 220, 120);
        ctx.strokeStyle = `rgba(34,141,92,${0.5 + 0.4 * pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x, 60, 220, 120);
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(c.label, c.x + 16, 86);
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 40px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(c.val, c.x + 16, 138);
        ctx.fillStyle = '#228d5c';
        ctx.font = '13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(c.dir, c.x + 16, 166);
      });
    };

    const renderRuntime = (s: State) => {
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('推理时间 vs 序列长度（Table 5）', 18, 28);

      const ox = 60;
      const oy = 200;
      const axW = 460;
      const axH = 150;
      // axes
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy - axH);
      ctx.lineTo(ox, oy);
      ctx.lineTo(ox + axW, oy);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('时间', 22, oy - axH + 4);
      ctx.fillText('序列长度', ox + axW - 60, oy + 18);

      // near-linear points
      const pts = [0, 0.25, 0.5, 0.75, 1].map((f, i) => ({
        x: ox + f * axW,
        y: oy - (0.08 + f * 0.86) * axH,
        i,
      }));
      // reveal progressively with idle animation
      const reveal = clamp(map(s.t % 160, 0, 120, 0, 1), 0, 1);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const shown = 1 + Math.floor(reveal * (pts.length - 1));
      for (let i = 0; i < shown; i++) {
        const p = pts[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      pts.slice(0, shown).forEach((p) => {
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);
      if (s.tab === 'geo') renderGeo(s);
      else renderRuntime(s);
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const pick = (v: Tab) => {
    stateRef.current.tab = v;
    setTab(v);
    if (v === 'geo')
      setFeedback({ text: 'ETH3D：CD 0.11（越低越好）/ F1 0.91（越高越好）', cls: 'good' });
    else setFeedback({ text: '推理时间随序列近似线性（Table 5）', cls: '' });
  };

  const opts: { v: Tab; label: string }[] = [
    { v: 'geo', label: '几何' },
    { v: 'runtime', label: '运行时' },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {opts.map((o) => (
          <button
            key={o.v}
            className={`chip ${tab === o.v ? 'selected' : ''}`}
            onClick={() => pick(o.v)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModResultsTable;
