import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawSceneLabel,
  drawLegend,
  drawValueChip,
} from './chefKit';
import type { WidgetProps } from './registry';

// Module 10.1 「证据柱状图」 — metric chips + horizontal bar chart (evidence
// presentation, not a race). All numbers are verified values from paper
// Table 4 / Table 5 / Table 1. RT-2-family bars are green, RT-1 red, other
// baselines muted; the winner(s) of each metric get a green outline. A compact
// DOM table below the canvas restates the exact values + measurement footnote.
const W = 1080;
const H = 280;

type Metric = 'seen' | 'unseen' | 'emergent' | 'langtable';
type Kind = 'base' | 'rt1' | 'rt2';
interface Row {
  name: string;
  v: number;
  kind: Kind;
  win?: boolean;
}

const METRICS: Record<
  Metric,
  { chip: string; tableTitle: string; rows: Row[]; fb: { text: string; cls: string } }
> = {
  seen: {
    chip: '见过任务',
    tableTitle: '见过任务成功率%（Table 4）',
    rows: [
      { name: 'R3M', v: 45, kind: 'base' },
      { name: 'VC-1', v: 63, kind: 'base' },
      { name: 'RT-1', v: 92, kind: 'rt1' },
      { name: 'MOO', v: 75, kind: 'base' },
      { name: 'PaLI-X-55B', v: 91, kind: 'rt2' },
      { name: 'PaLM-E-12B', v: 93, kind: 'rt2', win: true },
    ],
    fb: {
      text: '见过任务：RT-1 92、PaLI-X-55B 91、PaLM-E-12B 93——大家都会；差距不在熟练度，在「没见过」。',
      cls: '',
    },
  },
  unseen: {
    chip: '未见过平均',
    tableTitle: '未见过任务平均成功率%（Table 4）',
    rows: [
      { name: 'R3M', v: 12, kind: 'base' },
      { name: 'VC-1', v: 10, kind: 'base' },
      { name: 'RT-1', v: 32, kind: 'rt1' },
      { name: 'MOO', v: 35, kind: 'base' },
      { name: 'PaLI-X-55B', v: 62, kind: 'rt2', win: true },
      { name: 'PaLM-E-12B', v: 62, kind: 'rt2', win: true },
    ],
    fb: {
      text: '见过任务大家都会（91-93），没见过的平均 62 vs 32——泛化约 2 倍，正是网页知识的价值。',
      cls: 'good',
    },
  },
  emergent: {
    chip: '涌现平均',
    tableTitle: '涌现评测平均成功率%（Table 5）',
    rows: [
      { name: 'VC-1', v: 11, kind: 'base' },
      { name: 'RT-1', v: 17, kind: 'rt1' },
      { name: 'PaLI-X-55B', v: 60, kind: 'rt2', win: true },
      { name: 'PaLM-E-12B', v: 40, kind: 'rt2' },
    ],
    fb: {
      text: '涌现评测平均 60 vs 17（RT-1）、11（VC-1）——约 3 倍；符号、推理、人脸都不在机器人数据里。',
      cls: 'good',
    },
  },
  langtable: {
    chip: 'Language-Table',
    tableTitle: 'Language-Table 仿真成功率%（Table 1）',
    rows: [
      { name: 'BC-Zero', v: 72, kind: 'base' },
      { name: 'RT-1', v: 74, kind: 'rt1' },
      { name: 'LAVA', v: 77, kind: 'base' },
      { name: 'RT-2-PaLI-3B', v: 90, kind: 'rt2', win: true },
    ],
    fb: {
      text: '开源仿真 Language-Table：RT-2-PaLI-3B 90 vs LAVA 77、RT-1 74——换机器人换环境照样领先。',
      cls: 'good',
    },
  },
};

const METRIC_ORDER: Metric[] = ['seen', 'unseen', 'emergent', 'langtable'];

const barColor = (kind: Kind) => (kind === 'rt2' ? C.green : kind === 'rt1' ? C.red : C.muted);

export const Ch10Evidence: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ metric: Metric; animStart: number }>({ metric: 'unseen', animStart: 0 });
  const [metric, setMetric] = useState<Metric>('unseen');
  const [feedback, setFeedback] = useState(METRICS.unseen.fb);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      const { metric: m, animStart } = stateRef.current;
      const prog = easeOutCubic(clamp((ms - animStart) / 450, 0, 1));
      const rows = METRICS[m].rows;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      const x0 = 168;
      const maxW = 790;
      const top = 58;
      const bottom = 262;
      const rowH = (bottom - top) / rows.length;
      const barH = Math.min(rows.length > 4 ? 20 : 26, rowH - 12);

      // baseline axis
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, top - 6);
      ctx.lineTo(x0, bottom + 4);
      ctx.stroke();

      rows.forEach((r, i) => {
        const cy = top + i * rowH + rowH / 2;
        const w = (r.v / 100) * maxW * prog;
        const color = barColor(r.kind);
        // method name
        ctx.fillStyle = r.win ? C.green : C.text;
        ctx.font = (r.win ? 'bold ' : '') + '13px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.name, x0 - 14, cy);
        // bar
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x0, cy - barH / 2, Math.max(w, 2), barH, [0, 4, 4, 0]);
        ctx.fill();
        // winner green outline
        if (r.win) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(x0 - 5, cy - barH / 2 - 5, w + 10, barH + 10, [0, 7, 7, 0]);
          ctx.stroke();
        }
        // bare value chip at the bar end
        if (prog > 0.3) drawValueChip(ctx, x0 + w + 30, cy, String(r.v), color);
      });

      drawLegend(ctx, [['RT-2 系', C.green], ['RT-1', C.red], ['其他基线', C.muted]], 24, 34);
      drawSceneLabel(ctx, '成功率，越高越好', 1056, 34, { color: C.orange, align: 'right' });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (m: Metric) => {
    stateRef.current = { metric: m, animStart: performance.now() };
    setMetric(m);
    setFeedback(METRICS[m].fb);
  };

  const cur = METRICS[metric];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span className="step-label">指标</span>
        {METRIC_ORDER.map((m) => (
          <button
            key={m}
            className={'chip' + (metric === m ? ' selected' : '')}
            onClick={() => select(m)}
          >
            {METRICS[m].chip}
          </button>
        ))}
      </div>
      <div style={{ overflowX: 'auto', marginTop: 4 }}>
        <table
          style={{
            borderCollapse: 'collapse',
            fontSize: 12,
            color: C.text,
            minWidth: 320,
            margin: '0 auto',
          }}
        >
          <caption style={{ captionSide: 'top', textAlign: 'center', padding: '4px 0', fontSize: 12, color: C.muted }}>
            {cur.tableTitle}
          </caption>
          <tbody>
            {cur.rows.map((r) => (
              <tr key={r.name}>
                <td
                  style={{
                    border: '1px solid #d7deea',
                    padding: '3px 16px',
                    fontWeight: r.win ? 700 : 400,
                    color: r.win ? C.green : C.text,
                  }}
                >
                  {r.name}
                  {r.win ? ' ★' : ''}
                </td>
                <td
                  style={{
                    border: '1px solid #d7deea',
                    padding: '3px 16px',
                    textAlign: 'right',
                    fontFamily: 'var(--ui-font-mono, monospace)',
                    fontWeight: r.win ? 700 : 400,
                    color: r.win ? C.green : C.text,
                  }}
                >
                  {r.v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 6 }}>
          约 6000 次真机评测 · A/B 同场评测 · Language-Table 为开源仿真
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Evidence;
