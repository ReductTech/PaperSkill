import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 10.1: the verified speeds as a vertical bar chart so the gap is visible at a
// glance: AMPC 0.15 / 0.5 avg m/s and 0.33 / 0.97 peak m/s, with the multiplier noted.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'the racing agent completes more than three times the number of laps as the AMPC agent. The AMPC has an average speed of 0.15 m/s and a maximum speed of 0.33 m/s. The final racing agent reaches an average speed of 0.5 m/s and a peak speed of 0.97 m/s.',
    zh: '圈数<b>超过 AMPC 3 倍</b>；AMPC 平均 <b>0.15</b>、最高 <b>0.33 m/s</b>；竞速智能体平均 <b>0.5</b>、峰值 <b>0.97 m/s</b>。',
    locator: '§IV · p.2',
    highlights: ['more than three times', '0.15 m/s', '0.5 m/s', '0.97 m/s'],
  },
];

const BASE = 246;
const SCALE = 186; // px per 1.0 m/s
const GROUPS = [
  {
    label: '平均速度',
    ampc: 0.15,
    racing: 0.5,
    x1: 258,
    x2: 398,
    mult: '×3.3',
  },
  {
    label: '峰值速度',
    ampc: 0.33,
    racing: 0.97,
    x1: 678,
    x2: 818,
    mult: '×2.9',
  },
];
const BAR_W = 86;

export const Ch10ResultRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as 'idle' | 'running' | 'done', t: 0 });
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [feedback, setFeedback] = useState({
    text: '点击开始，用柱状图对比同一赛道上的平均与峰值速度。',
    cls: '',
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
    let raf: number | null = null;

    const render = () => {
      const s = stateRef.current;
      const p = s.phase === 'idle' ? 0 : s.phase === 'running' ? s.t : 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // chart panel
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 30, 16, 1020, 248, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('速度对比（同一固定赛道）', 54, 44);
      // legend
      ctx.fillStyle = C.orange;
      ctx.fillRect(420, 33, 12, 12);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('AMPC', 438, 44);
      ctx.fillStyle = C.green;
      ctx.fillRect(500, 33, 12, 12);
      ctx.fillStyle = C.muted;
      ctx.fillText('竞速智能体', 518, 44);
      ctx.fillText('单位：m/s（越大越好）', 870, 44);

      // gridlines + y labels
      for (let g = 0; g <= 4; g++) {
        const v = g * 0.25;
        const y = BASE - v * SCALE;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(120, y);
        ctx.lineTo(1026, y);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v.toFixed(2), 110, y + 4);
        ctx.textAlign = 'left';
      }

      // bars + values
      GROUPS.forEach((grp) => {
        const bars = [
          { x: grp.x1, v: grp.ampc, color: C.orange },
          { x: grp.x2, v: grp.racing, color: C.green },
        ];
        bars.forEach((b) => {
          const h = b.v * SCALE * p;
          ctx.fillStyle = b.color;
          ctx.globalAlpha = p === 0 ? 0.25 : 1;
          ctx.fillRect(b.x, BASE - h, BAR_W, h);
          ctx.globalAlpha = 1;
          if (p > 0.35) {
            ctx.fillStyle = b.color;
            ctx.font = 'bold 14px "Segoe UI", sans-serif';
            const label = b.v.toFixed(2);
            const tw = ctx.measureText(label).width;
            ctx.fillText(label, b.x + (BAR_W - tw) / 2, BASE - h - 8);
          }
        });
        // multiplier bracket between the two bars
        if (p > 0.6) {
          const top = BASE - 1.0 * SCALE - 22;
          const y = top;
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(grp.x1 + BAR_W, y);
          ctx.lineTo(grp.x2, y);
          ctx.moveTo(grp.x1 + BAR_W, y - 5);
          ctx.lineTo(grp.x1 + BAR_W, y + 5);
          ctx.moveTo(grp.x2, y - 5);
          ctx.lineTo(grp.x2, y + 5);
          ctx.stroke();
          ctx.fillStyle = C.red;
          ctx.font = 'bold 13px "Segoe UI", sans-serif';
          const tw = ctx.measureText(grp.mult).width;
          ctx.fillText(grp.mult, (grp.x1 + BAR_W + grp.x2) / 2 - tw / 2, y - 8);
        }
        // group label
        ctx.fillStyle = C.ink;
        ctx.font = 'bold 13.5px "Segoe UI", sans-serif';
        const center = (grp.x1 + grp.x2 + BAR_W) / 2;
        const tw = ctx.measureText(grp.label).width;
        ctx.fillText(grp.label, center - tw / 2, 272);
      });
    };

    const tick = () => {
      const s = stateRef.current;
      if (s.phase === 'running') {
        s.t += 0.03;
        if (s.t >= 1) {
          s.t = 1;
          s.phase = 'done';
          setPhase('done');
          setFeedback({
            text: '竞速智能体平均 0.5 m/s、峰值 0.97 m/s，均约为 AMPC 的 3 倍；圈数超过 3 倍。',
            cls: 'good',
          });
        }
      }
      render();
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

  const startRace = () => {
    stateRef.current.phase = 'running';
    stateRef.current.t = 0;
    setPhase('running');
    setFeedback({ text: '柱子从 0 生长到论文报告的真实数值……', cls: '' });
  };

  const reset = () => {
    stateRef.current.phase = 'idle';
    stateRef.current.t = 0;
    setPhase('idle');
    setFeedback({ text: '点击开始，用柱状图对比同一赛道上的平均与峰值速度。', cls: '' });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="ctrl">
          <button onClick={startRace} disabled={phase === 'running'}>
            开始对比
          </button>
          <button onClick={reset} disabled={phase !== 'done'}>
            重置
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
        <table className="metrics" style={{ marginTop: 10, width: '100%' }}>
          <thead>
            <tr>
              <th>指标</th>
              <th>AMPC</th>
              <th>竞速智能体</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>平均速度（越大越好）</td>
              <td>0.15 m/s</td>
              <td>0.5 m/s</td>
            </tr>
            <tr>
              <td>峰值速度（越大越好）</td>
              <td>0.33 m/s</td>
              <td>0.97 m/s</td>
            </tr>
            <tr>
              <td>圈数</td>
              <td>基准</td>
              <td>超过 3 倍</td>
            </tr>
            <tr>
              <td>轨迹长度</td>
              <td>14.26 m</td>
              <td>38.81 m</td>
            </tr>
          </tbody>
        </table>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default Ch10ResultRace;
