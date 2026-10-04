import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: mathematical/technical (controlled grouped bars + evidence table).
// m-result-race — chapter 10 active module (P8, user-started result race).
// Learner presses 开始比较; grouped bars grow from 0 to the paper's recorded
// success-rate relationship across seen / unseen-easy / unseen-hard. Green =
// RT-2 (paper method), blue = RT-1 / MOO (next best), red = other baselines.
// A static DOM evidence table below preserves the exact protocol wording.
// Evidence: page 7 §4 (~6k trials); page 8 §4.1 / Fig 4; page 10 Fig 6a;
// page 11 §5 (limitations). Success rate: higher is better.
// ============================================================================

const W = 720;
const H = 300;
const C = {
  bg: '#f5f8f0', counter: '#e7e3d8', counterEdge: '#cfc8b6', envLight: '#b8c9a7',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

// bar groups: [RT-2, RT-1/MOO, other baselines] as fractions of the axis
const GROUPS = [
  { name: '已见任务', vals: [0.9, 0.9, 0.7] },
  { name: '未见(易)', vals: [0.62, 0.3, 0.1] },
  { name: '未见(难)', vals: [0.4, 0.2, 0.06] },
];
const COLORS = [C.green, C.blue, C.red];

type Run = 'idle' | 'racing' | 'done';

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

export const MResultRace: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const run = useRef<Run>('idle');
  const progress = useRef(0);
  const startAt = useRef(0);
  const [runUi, setRunUi] = useState<Run>('idle');
  const [fb, setFb] = useState({ text: '按下开始，在未见场景里比一比。', cls: '' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const h = 300;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.envLight;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, w, 26);
    ctx.globalAlpha = 1;

    // animate progress
    if (run.current === 'racing') {
      const p = clamp((performance.now() - startAt.current) / 2200, 0, 1);
      progress.current = easeOutCubic(p);
      if (p >= 1) {
        run.current = 'done';
        // feedback handled on the next interaction tick
        setRunUi('done');
        setFb({
          text: '泛化上约为 RT-1/MOO 的 2 倍、其余基线的约 6 倍；但技能范围本身没有扩大。',
          cls: 'good',
        });
      }
    }

    // axes
    const axX = 90;
    const axY = 250;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(axX, 60);
    ctx.lineTo(axX, axY);
    ctx.lineTo(660, axY);
    ctx.stroke();
    label(ctx, 30, 56, '成功率', C.muted);

    const groupW = 170;
    GROUPS.forEach((g, gi) => {
      const gx = axX + 24 + gi * groupW;
      g.vals.forEach((v, bi) => {
        const bh = v * 170 * progress.current;
        const bx = gx + bi * 30;
        ctx.fillStyle = COLORS[bi];
        ctx.fillRect(bx, axY - bh, 24, bh);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, axY - bh, 24, bh);
      });
      label(ctx, gx - 4, axY + 18, g.name, C.ink);
    });

    // legend
    const items = [
      { c: C.green, t: 'RT-2' },
      { c: C.blue, t: 'RT-1/MOO' },
      { c: C.red, t: '其余基线' },
    ];
    items.forEach((it, i) => {
      const x = 430 + i * 84;
      ctx.fillStyle = it.c;
      ctx.fillRect(x, 40, 12, 12);
      label(ctx, x + 18, 50, it.t, C.muted);
    });

    if (run.current === 'idle') {
      label(ctx, 300, 150, '按下开始比较', C.muted);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRace = () => {
    run.current = 'racing';
    progress.current = 0;
    startAt.current = performance.now();
    setRunUi('racing');
    setFb({ text: '正在按同一标准展开对比。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-m-result-race`} ref={canvasRef} width={W} height={H} aria-label="同协议下的成功率对比" />
      <div className="step-ctrl">
        {runUi !== 'done' ? (
          <button type="button" className="chip" onClick={startRace} disabled={runUi === 'racing'}>
            {runUi === 'racing' ? '比较中…' : '开始比较'}
          </button>
        ) : (
          <button type="button" className="chip" onClick={startRace}>
            重新比较
          </button>
        )}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <table className="paper" aria-label="结果证据表">
        <thead>
          <tr>
            <th>评估协议</th>
            <th>RT-2</th>
            <th>RT-1 / MOO</th>
            <th>其余基线</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>已见任务（成功率）</td>
            <td>{runUi === 'idle' ? '—' : '≈ 与 RT-1 相近'}</td>
            <td>{runUi === 'idle' ? '—' : '≈ 相当'}</td>
            <td>{runUi === 'idle' ? '—' : '更低'}</td>
          </tr>
          <tr>
            <td>泛化（未见物体/背景/环境）</td>
            <td>{runUi === 'idle' ? '—' : '最高'}</td>
            <td>{runUi === 'idle' ? '—' : '约为其 1/2'}</td>
            <td>{runUi === 'idle' ? '—' : '约为其 1/6'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MResultRace;
