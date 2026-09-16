import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, dBar, dBucket, dHand, dLabel, dLegend, dRule, dTileGround } from './ditron-theme-kit';

// §5 module 1 — 选 AllReduce 还是 AG+RS.
// The chips pick a workload and a collective; the three bars only ever show the
// values the paper reports (Qwen3-32B, 8 x H800, geometric speedup over
// CuBLAS+NCCL, higher is better). Any combination the paper does not report stays
// an empty dashed frame with a red explanation — nothing is extrapolated.

const W = 1080;
const H = 280;

type Workload = 'attn' | 'ffn';
type Mode = 'allreduce' | 'ag-rs' | 'alltoall';
type FeedbackCls = '' | 'good' | 'bad';

interface Feedback {
  text: string;
  cls: FeedbackCls;
}

interface ReportValue {
  tag: string;
  value: number;
}

interface ChoiceState {
  workload: Workload;
  mode: Mode;
}

const WORKLOADS: { id: Workload; label: string }[] = [
  { id: 'attn', label: '注意力投影' },
  { id: 'ffn', label: 'FFN' },
];

const MODES: { id: Mode; label: string }[] = [
  { id: 'allreduce', label: '全归约' },
  { id: 'ag-rs', label: 'AG+RS' },
  { id: 'alltoall', label: '全交换' },
];

// Only the (workload, mode) pairs the paper reports are listed here.
const REPORTED: Record<Workload, Partial<Record<Mode, ReportValue[]>>> = {
  attn: { allreduce: [{ tag: 'prefill', value: 1.12 }, { tag: 'decode', value: 1.26 }] },
  ffn: {
    allreduce: [{ tag: '128k', value: 1.17 }],
    'ag-rs': [{ tag: '128k', value: 1.27 }],
  },
};

const RECOMMENDED: Record<Workload, Mode> = { attn: 'allreduce', ffn: 'ag-rs' };
const CONTEXT: Record<Workload, string> = { attn: '512–16k', ffn: '128k' };

const BAR_X = 96;
const BAR_W = 840;
const ROW_TOP = 48;
const ROW_PITCH = 48;
const ROW_H = 32;

const INITIAL_STATE: ChoiceState = { workload: 'attn', mode: 'allreduce' };

const INITIAL_FEEDBACK: Feedback = {
  text: '注意力模块的 GEMM 归约维只有 head dim = 128，太短，掩盖不了 AG/RS 的延迟，论文因此推荐 AllReduce。',
  cls: '',
};

function feedbackFor(workload: Workload, mode: Mode): Feedback {
  if (mode === 'alltoall') {
    return {
      text: 'AllToAll 用于 MoE 的 dispatch 与 combine，不用于注意力和 FFN 的投影。',
      cls: 'bad',
    };
  }
  if (workload === 'attn' && mode === 'ag-rs') {
    return {
      text:
        '论文只给出注意力用 AllReduce 的数值（head dim 只有 128，GEMM 太短，掩盖不了 AllGather/ReduceScatter 的延迟）；配 AG+RS 的对比只以图中的另一条曲线表示，未给出具体数字。',
      cls: 'bad',
    };
  }
  if (workload === 'attn') {
    return {
      text:
        '注意力用 AllReduce：相对 CuBLAS+NCCL，prefill 几何加速 1.12×、decode 1.26×（Qwen3-32B，8×H800）。',
      cls: 'good',
    };
  }
  if (mode === 'ag-rs') {
    return {
      text: 'FFN 用 AG+RS：128k token 时相对 CuBLAS+NCCL 为 1.27×，高于 AllReduce 的 1.17×（Qwen3-32B，8×H800）。',
      cls: 'good',
    };
  }
  return {
    text: 'FFN 用 AllReduce：128k token 时相对 CuBLAS+NCCL 为 1.17×，可以用，但低于 AG+RS 的 1.27×。',
    cls: '',
  };
}

function readoutFor(workload: Workload, mode: Mode): string {
  const values = REPORTED[workload][mode];
  if (!values || values.length === 0) return '论文未报告';
  return values.map((item) => `${item.tag} ${item.value.toFixed(2)}×`).join(' / ');
}

function rowColor(workload: Workload, mode: Mode): string {
  const values = REPORTED[workload][mode];
  if (!values || values.length === 0) return KIT.border;
  return mode === RECOMMENDED[workload] ? KIT.success : KIT.guidance;
}

export const M51CommChoice: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef(0);
  const stateRef = useRef<ChoiceState>(INITIAL_STATE);
  const [workload, setWorkload] = useState<Workload>(INITIAL_STATE.workload);
  const [mode, setMode] = useState<Mode>(INITIAL_STATE.mode);
  const [readout, setReadout] = useState<string>(readoutFor(INITIAL_STATE.workload, INITIAL_STATE.mode));
  const [feedback, setFeedback] = useState<Feedback>(INITIAL_FEEDBACK);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (state: ChoiceState, time: number) => {
      const t = time / 1000;
      dTileGround(ctx, W, H);

      // scene anchors in the top-left corner: the bucket and the recurring hand
      dBucket(ctx, 36, 92);
      dHand(ctx, 38, 30, t, KIT.text);

      // three rows: one per collective, showing only the reported values
      MODES.forEach((row, i) => {
        const y = ROW_TOP + i * ROW_PITCH;
        const selected = row.id === state.mode;
        const values = REPORTED[state.workload][row.id];
        ctx.globalAlpha = selected ? 1 : 0.6;
        if (values && values.length > 0) {
          const fill = rowColor(state.workload, row.id);
          const stacked = values.length > 1;
          values.forEach((item, j) => {
            const frac = clamp((item.value - 1) / 0.4, 0, 1);
            const barY = stacked ? y + j * 18 : y;
            const barH = stacked ? 14 : ROW_H;
            dBar(ctx, BAR_X, barY, BAR_W, barH, frac, fill);
            dLabel(ctx, item.value.toFixed(2), BAR_X + BAR_W * frac + 10, barY + barH - 3, KIT.text);
          });
        } else {
          ctx.save();
          ctx.setLineDash([8, 6]);
          ctx.strokeStyle = KIT.border;
          ctx.lineWidth = 2;
          ctx.strokeRect(BAR_X, y + 4, BAR_W, ROW_H - 8);
          ctx.restore();
        }
        if (selected) {
          ctx.strokeStyle = KIT.emphasis;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(BAR_X - 8, y - 2);
          ctx.lineTo(BAR_X - 16, y - 2);
          ctx.lineTo(BAR_X - 16, y + ROW_H + 2);
          ctx.lineTo(BAR_X - 8, y + ROW_H + 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      // baseline 1.0 with a 1.2 tick
      dRule(ctx, BAR_X, 196, BAR_X + BAR_W, 196, KIT.border);
      ctx.strokeStyle = KIT.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(BAR_X, 188);
      ctx.lineTo(BAR_X, 204);
      ctx.moveTo(BAR_X + BAR_W * 0.5, 188);
      ctx.lineTo(BAR_X + BAR_W * 0.5, 204);
      ctx.stroke();
      dLabel(ctx, '1.0', BAR_X, 222, KIT.muted, 'center');
      dLabel(ctx, '1.2', BAR_X + BAR_W * 0.5, 222, KIT.muted, 'center');

      // workload identity plus the sequence-length context of the numbers
      dLabel(ctx, state.workload === 'attn' ? '注意力' : 'FFN', 96, 34, KIT.text);
      dLabel(ctx, CONTEXT[state.workload], 16, 246, KIT.muted);
      dLegend(
        ctx,
        MODES.map((row) => ({ color: rowColor(state.workload, row.id), text: row.label })),
        200,
        246
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (now: number) => {
      if (!t0Ref.current) t0Ref.current = now;
      render(stateRef.current, now - t0Ref.current);
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

  const apply = (next: ChoiceState) => {
    stateRef.current = next;
    setWorkload(next.workload);
    setMode(next.mode);
    setReadout(readoutFor(next.workload, next.mode));
    setFeedback(feedbackFor(next.workload, next.mode));
  };

  const onWorkloadClick = (next: Workload) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    apply({ workload: next, mode: stateRef.current.mode });
  };

  const onModeClick = (next: Mode) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    apply({ workload: stateRef.current.workload, mode: next });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {WORKLOADS.map((item) => (
          <button
            key={item.id}
            className={item.id === workload ? 'chip selected' : 'chip'}
            aria-pressed={item.id === workload}
            onClick={onWorkloadClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {MODES.map((item) => (
          <button
            key={item.id}
            className={item.id === mode ? 'chip selected' : 'chip'}
            aria-pressed={item.id === mode}
            onClick={onModeClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          当前组合 <span className="val">{readout}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M51CommChoice;
