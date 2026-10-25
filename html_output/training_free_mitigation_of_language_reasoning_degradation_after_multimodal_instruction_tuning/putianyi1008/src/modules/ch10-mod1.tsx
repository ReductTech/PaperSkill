import React, { useEffect, useRef, useState } from 'react';
import { C, stage, num, label, legend } from './studiokit';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

const W = 1080;
const H = 280;

type Metric = 0 | 1 | 2;

// Paper Table 2 (GSM8k, 8-shot CoT) and Table 3 (GQA, VizWiz VQA), alpha = 0 vs alpha = 0.1.
const DATA: Array<{
  name: string;
  unmerged: number;
  merged: number;
  base: number | null;
  note: string;
  fb: string;
}> = [
  {
    name: 'GSM8k',
    unmerged: 0.3282,
    merged: 0.4306,
    base: 0.395,
    note: '8-shot CoT',
    fb: 'GSM8k 上合并把 32.8 抬到 43.1，已经超过基座的 39.5——数学推理的退化被补回来了。',
  },
  {
    name: 'GQA',
    unmerged: 0.5514,
    merged: 0.5981,
    base: null,
    note: 'α=0.1',
    fb: 'GQA 从 55.1 升到 59.8（α=0.1，α=0.05 时 62.7）——视觉任务也能受益。',
  },
  {
    name: 'VizWiz',
    unmerged: 0.5129,
    merged: 0.6444,
    base: null,
    note: 'α=0.1',
    fb: 'VizWiz 从 51.3 升到 64.4，是提升幅度最大的一项。',
  },
];

export const Ch10Mod1: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<Metric>(0);
  const [running, setRunning] = useState(false);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: DATA[0].fb,
    c: 'good',
  });
  const stateRef = useRef({ metric: 0 as Metric, t0: 0, running: false });
  stateRef.current.metric = metric;
  // The draw loop reads `running` from the same ref the animation writes, so the
  // race really animates from a shared baseline instead of sitting at its end value.
  stateRef.current.running = running;

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setRunning(false), 1200);
    return () => window.clearTimeout(id);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const tick = (now: number) => {
      const st = stateRef.current;
      const d = DATA[st.metric];
      stage(ctx, W, H);

      const p = st.running ? Math.min(1, (now - st.t0) / 1200) : 1;
      const rows = [
        { v: d.unmerged, color: C.red, name: '未合并', delay: 0 },
        { v: d.merged, color: C.green, name: '合并后', delay: 120 },
      ];

      rows.forEach((r, i) => {
        const y = 70 + i * 72;
        const pp = Math.max(0, Math.min(1, (p * 1200 - r.delay) / 900));
        ctx.fillStyle = C.axis;
        ctx.fillRect(180, y, 700, 30);
        ctx.fillStyle = r.color;
        ctx.fillRect(180, y, 700 * r.v * 0.85 * pp, 30);
        num(ctx, 900, y + 15, r.v * pp, r.color);
      });

      if (d.base !== null) {
        const bx = 180 + 700 * d.base * 0.85;
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(bx, 56);
        ctx.lineTo(bx, 192);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      label(ctx, 60, 85, '未合并');
      label(ctx, 60, 157, '合并后');
      legend(ctx, 180, 240, [
        ['未合并', C.red],
        ['合并后', C.green],
        ['基座', C.blue],
      ]);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (m: Metric) => {
    setMetric(m);
    setFb({ t: DATA[m].fb, c: 'good' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {DATA.map((d, i) => (
          <button key={d.name} className={i === metric ? 'chip active' : 'chip'} onClick={() => pick(i as Metric)}>
            {d.name}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <button
          className="chip"
          onClick={() => {
            // Set the shared start timestamp here, in the same tick as `running`,
            // so the first animation frame can never read a stale t0.
            stateRef.current.t0 = performance.now();
            setFb({ t: '两条槽从同一零基线出发，蓝色虚线是基座水平，注意红色那条的终点位置。', c: '' });
            setRunning(true);
          }}
          disabled={running}
        >
          {running ? '对比中…' : '开始对比'}
        </button>
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        当前指标「{DATA[metric].name}」的协议：{DATA[metric].note}；数值取自论文 Table 2 / Table 3（第 9 页），
        语言与视觉指标量纲不同，只在本指标内比较，不跨指标相加。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch10Mod1;
