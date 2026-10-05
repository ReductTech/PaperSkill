import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawLegend,
  drawSceneLabel,
  OK,
  BAD,
  WOOD,
  MUTED,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// Module 10.1 (1080x280): the only place in the tutorial that shows measured paper
// numbers. Press 「开始对比」 and the bars race to their end state; the 4 chips switch
// benchmark. Bar lengths are strictly proportional to the paper's Table 1 / 2 / 4 / 6
// values — no difference is ever exaggerated, and every bar carries its exact value.

const W = 1080;
const H = 280;

const AXIS_X = 112;
const BAR_MAX_W = 764;
const ROW_TOP = 52;
const ROW_H = 32;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type BenchId = 'robomimic_state' | 'robomimic_image' | 'multistage' | 'real';
type Phase = 'idle' | 'running' | 'done';
type Role = 'ours' | 'best' | 'other';

interface Bar {
  role: Role;
  value: number;
}

interface Row {
  label: string;
  bars: Bar[];
}

interface BenchDef {
  chip: string;
  metric: string | null;
  legend: { color: string; text: string }[];
  rows: Row[];
  idle: string;
  running: string;
  done: string;
}

const ROLE_COLOR: Record<Role, string> = { ours: OK, best: BAD, other: WOOD };

const BENCHES: Record<BenchId, BenchDef> = {
  robomimic_state: {
    chip: 'Robomimic 状态',
    metric: '成功率',
    legend: [
      { color: OK, text: '扩散策略' },
      { color: BAD, text: '最强基线' },
    ],
    rows: [
      { label: 'Lift', bars: [{ role: 'ours', value: 1 }] },
      { label: 'Can', bars: [{ role: 'ours', value: 1 }] },
      { label: 'Square', bars: [{ role: 'ours', value: 1 }, { role: 'best', value: 0.95 }] },
      { label: 'Transport', bars: [{ role: 'ours', value: 1 }, { role: 'best', value: 0.76 }] },
      { label: 'ToolHang', bars: [{ role: 'ours', value: 1 }, { role: 'best', value: 0.67 }] },
    ],
    idle: '按「开始对比」跑一场结果赛。自上而下是 Lift、Can、Square、Transport、ToolHang；绿色是扩散策略，红色是该任务上最强基线。',
    running: '条长按论文 Table 1 绘制，用的是各方法的最好成绩；Lift 与 Can 上基线的最高值同样是 1.00，与扩散策略持平，所以没有单独画出基线条。',
    done: 'Robomimic 状态基准上，扩散策略在 Lift/Can/Square 都到 1.00，Transport 与 ToolHang 的提升最大。所有数字均为成功率，越高越好。',
  },
  robomimic_image: {
    chip: 'Robomimic 图像',
    metric: '成功率',
    legend: [
      { color: OK, text: '扩散策略' },
      { color: BAD, text: '最强基线' },
    ],
    rows: [
      { label: 'Push-T', bars: [{ role: 'ours', value: 0.91 }, { role: 'best', value: 0.75 }] },
      { label: 'ToolHang', bars: [{ role: 'ours', value: 0.95 }, { role: 'best', value: 0.68 }] },
    ],
    idle: '按「开始对比」跑一场结果赛。自上而下是 Push-T 与 ToolHang 两个图像输入任务；绿色是扩散策略，红色是该任务上最强基线。',
    running: '条长按论文 Table 2 绘制，用的是各方法的最好成绩。',
    done: '图像基准上，扩散策略在 Push-T 取得 0.91，ToolHang 从基线的 0.68 提升到 0.95。所有数字均为成功率，越高越好。',
  },
  multistage: {
    chip: '多阶段任务',
    metric: '频率',
    legend: [
      { color: OK, text: '扩散策略' },
      { color: BAD, text: '最强基线' },
      { color: WOOD, text: '另一变体' },
    ],
    rows: [
      {
        label: 'BlockPush p2',
        bars: [
          { role: 'ours', value: 0.94 },
          { role: 'best', value: 0.71 },
          { role: 'other', value: 0.11 },
        ],
      },
      {
        label: 'Kitchen p4',
        bars: [{ role: 'ours', value: 0.99 }, { role: 'best', value: 0.44 }],
      },
    ],
    idle: '按「开始对比」跑一场结果赛。第一行是 Block Push 的 p2 指标，第二行是 Kitchen 的 p4；灰色条是同一方法的另一个主干变体。',
    running: '条长按论文 Table 4 绘制；绿色取两个主干里较好的那个，与论文统计口径一致。两行用的是不同的 p 指标，都是「越高越好」的次数比例。',
    done: '长程多模态任务：Block Push 的 p2 达到 0.94（最强基线 0.71），Kitchen 的 p4 达到 0.99（最强基线 0.44）。论文正文把这两个指标汇总为 p2 提升 32%、p4 提升 213%（论文自报）。',
  },
  real: {
    chip: '真机',
    metric: null,
    legend: [
      { color: OK, text: '扩散策略' },
      { color: BAD, text: '最强基线变体' },
      { color: WOOD, text: '人类' },
    ],
    rows: [
      {
        label: '成功率',
        bars: [
          { role: 'other', value: 1 },
          { role: 'ours', value: 0.95 },
          { role: 'best', value: 0.2 },
          { role: 'best', value: 0 },
        ],
      },
      { label: 'IoU', bars: [{ role: 'other', value: 0.84 }, { role: 'ours', value: 0.8 }] },
    ],
    idle: '按「开始对比」跑一场结果赛。第一行是成功率，第二行是 IoU；灰色条是人类，红色是基线里最好的两个变体。',
    running: '条长按论文 Table 6 绘制；IoU 是在最后一步量取的，不是全程最大值。',
    done: '真机 Push-T：95% 成功率、0.80 IoU，人类是 1.00 / 0.84；最好的 IBC 与 LSTM-GMM 变体只有 0% 与 20%。注意 IoU 是在最后一步量取的，不是全程最大值。',
  },
};

const BENCH_ORDER: BenchId[] = ['robomimic_state', 'robomimic_image', 'multistage', 'real'];

function barMetrics(n: number): { h: number; pad: number } {
  const h = n === 1 ? 11 : n === 2 ? 9 : n === 3 ? 7 : 6;
  return { h, pad: (ROW_H - n * h) / (n + 1) };
}

export const M101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ bench: BenchId; phase: Phase; t: number }>({
    bench: 'robomimic_state',
    phase: 'idle',
    t: 0,
  });
  const [bench, setBench] = useState<BenchId>('robomimic_state');
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { bench: BenchId; phase: Phase; t: number }) => {
      const def = BENCHES[s.bench];
      clearScene(ctx, W, H);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(AXIS_X + 0.5, 40);
      ctx.lineTo(AXIS_X + 0.5, 216);
      ctx.stroke();
      for (let k = 1; k <= 4; k++) {
        const gx = AXIS_X + (BAR_MAX_W * k) / 4;
        ctx.beginPath();
        ctx.moveTo(gx + 0.5, 44);
        ctx.lineTo(gx + 0.5, 216);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gx + 0.5, 216);
        ctx.lineTo(gx + 0.5, 221);
        ctx.stroke();
      }
      ctx.font = '11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillStyle = MUTED;
      for (let k = 0; k <= 4; k++) {
        ctx.fillText((k / 4).toFixed(2), AXIS_X + (BAR_MAX_W * k) / 4, 233);
      }

      for (let i = 0; i < def.rows.length; i++) {
        const row = def.rows[i];
        const rowY = ROW_TOP + i * ROW_H;
        const g = easeOutCubic(clamp((s.t - i * 0.06) / 0.72, 0, 1));
        const n = row.bars.length;
        const m = barMetrics(n);

        ctx.font = '13px ' + FONT;
        ctx.textAlign = 'right';
        ctx.fillStyle = MUTED;
        ctx.fillText(row.label, AXIS_X - 14, rowY + ROW_H / 2 + 4);

        for (let j = 0; j < n; j++) {
          const bar = row.bars[j];
          const by = rowY + m.pad + j * (m.h + m.pad);
          const bw = bar.value * BAR_MAX_W * g;
          ctx.fillStyle = ROLE_COLOR[bar.role];
          ctx.fillRect(AXIS_X, by, Math.max(0, bw), m.h);
          if (g > 0.03) {
            ctx.globalAlpha = g;
            ctx.font = '12px ' + FONT;
            ctx.textAlign = 'left';
            ctx.fillStyle = ROLE_COLOR[bar.role];
            ctx.fillText(bar.value.toFixed(2), AXIS_X + BAR_MAX_W + 16, by + m.h - 1);
            ctx.globalAlpha = 1;
          }
        }
      }

      ctx.font = '18px ' + FONT;
      const mw = def.metric ? ctx.measureText(def.metric).width : 0;
      if (def.metric) {
        drawSceneLabel(ctx, def.metric, 24, 254);
        drawSceneLabel(ctx, '越高越好', 24 + mw + 24, 254, MUTED);
      } else {
        drawSceneLabel(ctx, '越高越好', 24, 254, MUTED);
      }

      drawLegend(ctx, def.legend, 24, 24);
    };

    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      const s = stateRef.current;
      if (s.phase === 'running') {
        s.t = Math.min(1, s.t + dt / 1800);
        if (s.t >= 1) {
          s.phase = 'done';
          setPhase('done');
        }
      }
      render(s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const startCompare = () => {
    stateRef.current.bench = bench;
    stateRef.current.phase = 'running';
    stateRef.current.t = 0;
    setPhase('running');
  };

  const pickBench = (b: BenchId) => {
    stateRef.current.bench = b;
    stateRef.current.phase = 'idle';
    stateRef.current.t = 0;
    setBench(b);
    setPhase('idle');
  };

  const def = BENCHES[bench];
  const feedback =
    phase === 'done'
      ? { text: def.done, cls: 'good' }
      : phase === 'running'
      ? { text: def.running, cls: '' }
      : { text: def.idle, cls: '' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {BENCH_ORDER.map((b) => (
          <button
            key={b}
            className={'chip' + (bench === b ? ' selected' : '')}
            onClick={() => pickBench(b)}
          >
            {BENCHES[b].chip}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button
          className={'chip' + (phase === 'running' ? ' selected' : '')}
          onClick={startCompare}
        >
          开始对比
        </button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M101;
