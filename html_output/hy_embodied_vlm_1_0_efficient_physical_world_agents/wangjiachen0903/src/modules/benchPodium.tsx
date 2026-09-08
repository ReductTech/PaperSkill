import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 300;

const METRICS = [
  { id: 'overall', name: '38 项总平均', rows: [{ n: 'Hy 1.0 A3B', v: 65.6, c: C.green }, { n: 'Qwen3.6-A3B', v: 61.2, c: C.blue }, { n: 'Hy 0.5 MoT-2B', v: 57.2, c: C.red }] },
  { id: 'state', name: '状态理解', rows: [{ n: 'Hy 1.0 A3B', v: 68.6, c: C.green }, { n: 'Qwen3.6-A3B', v: 63.7, c: C.blue }, { n: 'Hy 0.5 MoT-2B', v: 62.6, c: C.red }] },
  { id: 'transition', name: '动作转换', rows: [{ n: 'Hy 1.0 A3B', v: 64.1, c: C.green }, { n: 'Embodied-R1.5', v: 58.8, c: C.purple }, { n: 'Qwen3.6-A3B', v: 58.7, c: C.blue }] },
  { id: 'sequential', name: '长程自适应', rows: [{ n: 'Hy 1.0 A3B', v: 57.4, c: C.green }, { n: 'Qwen3.6-A3B', v: 55.9, c: C.blue }, { n: 'Embodied-R1.5', v: 52.9, c: C.purple }] },
  { id: 'r2r', name: 'R2R-CE SR', rows: [{ n: 'Hy 1.0 A3B', v: 57.9, c: C.green }, { n: 'Qwen-VLA-Instruct', v: 57.5, c: C.blue }, { n: 'Uni-NaVid', v: 47.0, c: C.purple }] },
  { id: 'objnav', name: 'ObjectNav SR', rows: [{ n: 'Hy 1.0 A3B', v: 38.3, c: C.green }, { n: 'Qwen3.6-35B-A3B', v: 36.1, c: C.blue }, { n: 'Qwen3.5-35B-A3B', v: 35.8, c: C.purple }] },
];

export const BenchPodium: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0, start: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { sel: number; start: number }) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, '排名台：同一协议，同一把尺子', W / 2, 20, 13, C.ink);
      const m = METRICS[s.sel];
      const p = s.start ? Math.min(1, (performance.now() - s.start) / 900) : 0;
      const max = Math.max(...m.rows.map((r) => r.v));
      const baseY = 236;
      const xs = [130, 280, 430];
      // podium steps
      ctx.fillStyle = '#eef3fb';
      ctx.fillRect(60, baseY + 10, 440, 24);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(60, baseY + 10, 440, 24);
      m.rows.forEach((r, i) => {
        const h = (r.v / max) * 130 * (0.25 + 0.75 * p);
        const x = xs[i];
        const y = baseY - h;
        ctx.fillStyle = r.c;
        ctx.fillRect(x - 52, y, 104, h);
        ctx.strokeStyle = r.c;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 52, y, 104, h);
        label(ctx, r.v.toFixed(1), x, y - 12, 13, r.c);
        label(ctx, r.n, x, baseY + 30, 10, r.c);
        if (i === 0 && p >= 1) label(ctx, '🏆', x, y - 32, 18);
      });
      label(ctx, '分数越高越好 · A30B 仅作参考不参与排名', W / 2, H - 16, 11, C.muted);
    };
    const tick = () => { render(stateRef.current); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const choose = (i: number) => { stateRef.current.sel = i; stateRef.current.start = performance.now(); setSel(i); };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {METRICS.map((m, i) => (
          <button key={m.id} className={i === sel ? 'chip selected' : 'chip'} onClick={() => choose(i)}>{m.name}</button>
        ))}
      </div>
      <div className="feedback good">
        {METRICS[sel].rows[0].n} 在该指标上领先：{METRICS[sel].rows[0].v.toFixed(1)}。
      </div>
    </div>
  );
};

export default BenchPodium;
