import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, dTileGround, dBar, dHand, dRule, dLabel, dLegend } from './ditron-theme-kit';

// ============================================================================
// §10 module 10.1 — the verified result race plus its evidence table.
// Hybrid linked views driven by ONE state (`metric` + the explicit start):
//   raceZone    both bars leave the same start line x = 96 on one axis; the old
//               method bar is fixed at its recorded position, the paper method
//               bar grows to its recorded position after the learner clicks
//               「开始对比」;
//   captionZone the verifying straightedge (静态), the metric name and the unit.
// Every number below is copied from the §10 evidence list with its protocol
// (model, hardware, baseline, metric, unit, direction) kept in the DOM table.
// ============================================================================

const W = 1080;
const H = 280;

const X0 = 96;
const SPAN = 880;
const OLD_Y = 58;
const NEW_Y = 128;
const ROW_H = 44;
const RACE_TOP = 40;
const RACE_BOTTOM = 190;

type Metric = 'ag-gemm' | 'gemm-rs' | 'ag-moe' | 'mega' | 'vllm';

interface Competitor {
  label: string;
  value: number;
}

interface MetricSpec {
  chip: string;
  canvasName: string;
  baselineLabel: string;
  baseline: number;
  ditron: number;
  barText: string;
  ditronText: string;
  competitors: Competitor[];
  caveat: boolean;
  conclusion: string;
  protocol: string;
}

const METRIC_ORDER: Metric[] = ['ag-gemm', 'gemm-rs', 'ag-moe', 'mega', 'vllm'];

const METRICS: Record<Metric, MetricSpec> = {
  'ag-gemm': {
    chip: 'AG-GEMM',
    canvasName: 'AG-GEMM',
    baselineLabel: 'CuBLAS+NCCL（非重叠基线）',
    baseline: 1,
    ditron: 1.43,
    barText: '1.43',
    ditronText: '1.43×',
    competitors: [
      { label: 'TileLink', value: 1.13 },
      { label: 'FLUX', value: 1.09 },
    ],
    caveat: false,
    conclusion:
      'AG-GEMM：8×H800，形状取自 LLaMA/Mixtral/GPT/Qwen/DeepSeek，相对 CuBLAS+NCCL（非重叠基线）几何加速 1.43×，相对 TileLink 1.13×、相对 FLUX 1.09×；指标为加速比，越大越好。',
    protocol:
      '形状：LLaMA3/3.1、Mistral-7B、Qwen2-72B、Qwen1.5-MoE、Mixtral-8x7B/8x22B、DeepSeek-MoE，AG-GEMM 取 6 组 M=8192 形状；硬件：8× NVIDIA H800 节点内；基线：CuBLAS+NCCL（非重叠）、TileLink、FLUX；指标：几何加速比，单位 ×，越大越好。',
  },
  'gemm-rs': {
    chip: 'GEMM-RS',
    canvasName: 'GEMM-RS',
    baselineLabel: 'CuBLAS+NCCL（非重叠基线）',
    baseline: 1,
    ditron: 1.27,
    barText: '1.27',
    ditronText: '1.27×',
    competitors: [
      { label: 'TileLink', value: 1.02 },
      { label: 'FLUX', value: 1.3 },
    ],
    caveat: false,
    conclusion:
      'GEMM-RS：8×H800，相对 CuBLAS+NCCL 1.27×、TileLink 1.02×、FLUX 1.30×（TileLink 与 FLUX 不支持 AllReduce）；越大越好。',
    protocol:
      '形状：与 AG-GEMM 相同的 6 组 M=8192 形状；硬件：8× NVIDIA H800 节点内；基线：CuBLAS+NCCL（非重叠）、TileLink、FLUX；指标：几何加速比，单位 ×，越大越好；TileLink 与 FLUX 不支持 AllReduce。',
  },
  'ag-moe': {
    chip: 'AG-MoE',
    canvasName: 'AG-MoE',
    baselineLabel: 'CuBLAS+NCCL（非重叠基线）',
    baseline: 1,
    ditron: 19.18,
    barText: '19.18',
    ditronText: '19.18×',
    competitors: [
      { label: 'TileLink', value: 1.89 },
      { label: 'COMET', value: 1.06 },
    ],
    caveat: true,
    conclusion:
      'AG-MoE：8×H800，相对 CuBLAS+NCCL 19.18×、TileLink 1.89×、COMET 1.06×（图中用对数坐标）；越大越好。',
    protocol:
      '形状：Qwen1.5-MoE-A2.7B、Mixtral-8x7B、Mixtral-8x22B、DeepSeek-MoE，num_tokens=8192；硬件：8× NVIDIA H800 节点内；基线：CuBLAS+NCCL（非重叠）、TileLink、COMET；指标：几何加速比，单位 ×，越大越好。论文报告这是最大的单负载收益（图中对 MoE 使用对数坐标）；附录时延表显示该组 CuBLAS+NCCL 基线为 18.12–24.27 ms，基线偏慢，但论文未解释原因。',
  },
  mega: {
    chip: 'MegaKernel 单 batch',
    canvasName: 'MegaKernel',
    baselineLabel: 'Torch Eager',
    baseline: 1,
    ditron: 6.28,
    barText: '6.28',
    ditronText: '6.28×',
    competitors: [
      { label: 'Mirage', value: 1.73 },
      { label: 'Torch+CUDAGraph', value: 1.33 },
      { label: 'DITRON+CUDAGraph', value: 1.11 },
      { label: 'vLLM', value: 1.1 },
    ],
    caveat: false,
    conclusion:
      'MegaKernel 单 batch：8×H800，Qwen3-8B/32B 与 LLaMA-70B，相对 Torch Eager 6.28×、Mirage 1.73×、Torch+CUDAGraph 1.33×、DITRON+CUDAGraph 1.11×、vLLM 1.10×；延迟越低越好，此处显示为加速比。',
    protocol:
      '模型：Qwen3-8B、Qwen3-32B、LLaMA-70B，单 batch；硬件：8× NVIDIA H800；基线：Torch Eager、Torch+CUDAGraph、DITRON+CUDAGraph、Mirage、vLLM；指标：几何加速比（延迟越低越好，此处统一换算为加速比），单位 ×，越大越好；其中 DITRON+CUDAGraph 用于分离任务级融合相对图捕获的收益。',
  },
  vllm: {
    chip: 'vLLM 端到端',
    canvasName: 'vLLM',
    baselineLabel: 'vLLM（未集成 DITRON）',
    baseline: 1,
    ditron: 1.3,
    barText: '1.05–1.30',
    ditronText: '1.05×–1.30×（即提升 5%–30%）',
    competitors: [],
    caveat: true,
    conclusion:
      'vLLM 端到端：8×H800，LLaMA3-70B 与 Qwen3-32B，batch > 128 时相对 vLLM 提升 5%–30%；batch = 512 时约 12k tokens/s（70B）与 17k tokens/s（32B）；吞吐越大越好。',
    protocol:
      '模型：LLaMA3-70B、Qwen3-32B 的张量并行推理；硬件：8× NVIDIA H800；基线：未集成 DITRON 的 vLLM（其 AllReduce 核经专家调优）；指标：端到端吞吐，batch > 128 时相对提升 5%–30%（即 1.05×–1.30×），batch = 512 时约 12k tokens/s（70B）与 17k tokens/s（32B）；吞吐越大越好。',
  },
};

const INITIAL_FEEDBACK = {
  text: '选择指标后点击「开始对比」，两条会从同一个基线 1.00× 出发，赛跑只改变本文方法的条长。',
  cls: '',
};

// Boundaries the paper itself reports; they stay visible with every metric.
const CAVEATS: string[] = [
  'MoE+AllReduce：论文报告相对 CuBLAS+NCCL 平均加速 13.89×（8×H800），但用附录延迟表反推的几何均值约 12.8×、算术均值约 30×，与该数字不一致，论文未解释。',
  'AG+MoE 的第 2 个形状上 DITRON 为 1.51 ms，略慢于 COMET 的 1.48 ms（8×H800，越低越好）——并非所有形状都占优。',
  'batch 小于 128 时，未集成 DITRON 的 vLLM 端到端吞吐略优；重叠的收益需要足够大的 batch。',
];

interface RaceState {
  metric: Metric;
  running: boolean;
  progress: number;
  startTime: number;
  duration: number;
}

interface OnState {
  text: string;
  cls: string;
}

function drawTrophy(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = KIT.success;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 10);
  ctx.lineTo(x + 9, y - 10);
  ctx.lineTo(x + 6, y + 2);
  ctx.lineTo(x - 6, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 2, y + 2, 4, 7);
  ctx.fillRect(x - 8, y + 9, 16, 3);
  ctx.strokeStyle = KIT.success;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x - 10, y - 5, 5, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 10, y - 5, 5, Math.PI * 1.5, Math.PI * 0.5);
  ctx.stroke();
}

export const M101ResultRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RaceState>({
    metric: 'ag-gemm',
    running: false,
    progress: 0,
    startTime: 0,
    duration: 1600,
  });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('ag-gemm');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<OnState>(INITIAL_FEEDBACK);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      stateRef.current.duration = 400;
    }

    const render = (s: RaceState, tSec: number): void => {
      const spec = METRICS[s.metric];
      dTileGround(ctx, W, H);

      // bare value with a quiet halo, so ticks and the datum line never cut the digits
      const drawValue = (text: string, x: number, y: number): void => {
        const width = ctx.measureText(text).width;
        ctx.fillStyle = KIT.quiet;
        ctx.fillRect(x - 5, y - 14, width + 10, 19);
        ctx.fillStyle = KIT.text;
        ctx.textAlign = 'left';
        ctx.fillText(text, x, y);
      };

      const maxValue = Math.max(
        spec.baseline,
        spec.ditron,
        ...spec.competitors.map((item) => item.value)
      );
      const posOf = (value: number): number => X0 + clamp(value / maxValue, 0, 1) * SPAN;

      // lane frames (1 px grid weight)
      ctx.strokeStyle = KIT.border;
      ctx.lineWidth = 1;
      [OLD_Y, NEW_Y].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(X0, y + ROW_H + 8);
        ctx.lineTo(X0 + SPAN, y + ROW_H + 8);
        ctx.stroke();
      });

      // competitors stay visible: one reference tick per reported competitor value
      const sorted = [...spec.competitors].sort((a, b) => a.value - b.value);
      let lastTextEnd = -1000;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      sorted.forEach((item) => {
        const x = posOf(item.value);
        ctx.strokeStyle = KIT.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, OLD_Y - 6);
        ctx.lineTo(x, NEW_Y + ROW_H + 6);
        ctx.stroke();
        const text = `${item.value}`;
        const width = ctx.measureText(text).width;
        if (x + width / 2 > lastTextEnd + 8) {
          ctx.fillStyle = KIT.muted;
          ctx.textAlign = 'center';
          ctx.fillText(text, x, OLD_Y - 12);
          ctx.textAlign = 'left';
          lastTextEnd = x + width / 2;
        }
      });

      // old method: fixed at its recorded position once the race starts
      const fracBase = (posOf(spec.baseline) - X0) / SPAN;
      const oldFrac = fracBase * clamp(s.progress * 3, 0, 1);
      dBar(ctx, X0, OLD_Y, SPAN, ROW_H, oldFrac, KIT.failure);
      ctx.font = '600 14px "Segoe UI", "Microsoft YaHei", sans-serif';
      drawValue(`${spec.baseline.toFixed(2)}`, posOf(spec.baseline) + 10, OLD_Y + ROW_H / 2 + 5);

      // paper method: grows from the same start line to its recorded position
      const fracDitron = (posOf(spec.ditron) - X0) / SPAN;
      const newFrac = fracDitron * easeOutCubic(clamp(s.progress, 0, 1));
      dBar(ctx, X0, NEW_Y, SPAN, ROW_H, newFrac, KIT.success);
      const newEnd = X0 + SPAN * newFrac;
      const textOffset = spec.caveat ? 20 : 10;
      drawValue(
        spec.barText,
        Math.min(newEnd + textOffset, 1064 - ctx.measureText(spec.barText).width),
        NEW_Y + ROW_H / 2 + 5
      );

      // the finish / detection line travels with the race
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = KIT.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X0 + SPAN * clamp(s.progress, 0, 1), RACE_TOP);
      ctx.lineTo(X0 + SPAN * clamp(s.progress, 0, 1), RACE_BOTTOM);
      ctx.stroke();
      ctx.restore();

      // scale: bare numbers only
      ctx.fillStyle = KIT.muted;
      ctx.font = '500 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('0', X0, RACE_BOTTOM - 4);
      ctx.textAlign = 'right';
      ctx.fillText(`${maxValue.toFixed(2)}`, X0 + SPAN, RACE_BOTTOM - 4);
      ctx.textAlign = 'left';

      // verification: a trophy only when no reported shape loses; otherwise a red dot
      if (s.progress >= 1) {
        if (spec.caveat) {
          ctx.fillStyle = KIT.failure;
          ctx.beginPath();
          ctx.arc(X0 + SPAN * fracDitron + 8, NEW_Y + ROW_H / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawTrophy(ctx, 966, 60);
        }
      }

      // captionZone: static straightedge, metric name and unit
      dHand(ctx, 120, 230, tSec, KIT.text);
      dRule(ctx, 180, 250, 420, 250, KIT.support);
      dLegend(
        ctx,
        [
          { color: KIT.failure, text: '旧方法' },
          { color: KIT.success, text: '本文方法' },
          { color: KIT.border, text: '基线 1.00' },
        ],
        470,
        244
      );
      dLabel(ctx, spec.canvasName, 1044, 234, KIT.text, 'right');
      dLabel(ctx, '×', 1044, 258, KIT.muted, 'right');
    };

    // first frame at mount: never a blank box while off-screen
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (now: number): void => {
      const s = stateRef.current;
      if (s.running) {
        const next = clamp((now - s.startTime) / s.duration, 0, 1);
        s.progress = next;
        if (next >= 1) {
          s.running = false;
          setRunning(false);
          setProgress(1);
          setFeedback({ text: METRICS[s.metric].conclusion, cls: 'good' });
        }
      }
      render(s, now / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const spec = METRICS[metric];

  const onPickMetric = (next: Metric): void => {
    const s = stateRef.current;
    s.metric = next;
    s.running = false;
    s.progress = 0;
    s.startTime = 0;
    setMetric(next);
    setRunning(false);
    setProgress(0);
    setFeedback(INITIAL_FEEDBACK);
  };

  const onStart = (): void => {
    const s = stateRef.current;
    if (s.running) return;
    s.startTime = performance.now();
    s.running = true;
    s.progress = 0;
    setRunning(true);
    setProgress(0);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          指标 <span className="val">{spec.chip}</span>
        </label>
        <div className="chip-row">
          {METRIC_ORDER.map((item) => (
            <button
              key={item}
              type="button"
              className={item === metric ? 'chip selected' : 'chip'}
              aria-pressed={item === metric}
              onClick={() => onPickMetric(item)}
            >
              {METRICS[item].chip}
            </button>
          ))}
          <button type="button" className="chip" disabled={running} onClick={onStart}>
            {progress === 1 ? '再对比一次' : '开始对比'}
          </button>
        </div>
      </div>
      <table className="paper">
        <thead>
          <tr>
            <th>对比项</th>
            <th>数值（单位 ×，越大越好）</th>
            <th>协议</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{spec.baselineLabel}</td>
            <td>{`${spec.baseline.toFixed(2)}×`}</td>
            <td>旧方法：作为基线，本行固定为 1.00×。</td>
          </tr>
          <tr>
            <td>DITRON（本文方法）</td>
            <td>{spec.ditronText}</td>
            <td>{spec.protocol}</td>
          </tr>
          {spec.competitors.map((item) => (
            <tr key={item.label}>
              <td>{item.label}</td>
              <td>{`${item.value}×`}</td>
              <td>同一模型、硬件与形状下的已报告加速比，作为参照同时出现在赛跑刻度上。</td>
            </tr>
          ))}
        </tbody>
      </table>
      {CAVEATS.map((text) => (
        <div key={text} className="feedback bad">
          {text}
        </div>
      ))}
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M101ResultRace;
