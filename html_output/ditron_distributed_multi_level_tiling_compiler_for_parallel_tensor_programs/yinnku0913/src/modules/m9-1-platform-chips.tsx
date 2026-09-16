import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  KIT,
  dTileGround,
  dGrid,
  dHand,
  dBucket,
  dBar,
  dLabel,
  dLegend,
} from './ditron-theme-kit';
import type { TileState } from './ditron-theme-kit';

// ============================================================================
// §9 module 9.1 — one primitive set, many interconnects and platforms.
// Hybrid linked views driven by ONE state (`platform`):
//   left  (groundZone)  life metaphor: the same hand keeps laying tiles, only the
//                       ground material and the hand's rhythm change;
//   right (barZone)     technical view: the speedups the paper reports for the
//                       selected platform, all against their recorded baselines.
// Every number below comes from the §9 evidence list with its protocol intact.
// ============================================================================

const W = 1080;
const H = 280;

const GX = 48;
const GY = 40;
const GW = 420;
const GH = 180;
const GRID_X = 88;
const GRID_Y = 44;
const CELL = 56;
const TILES = 18;

const TRACK_X = 560;
const TRACK_W = 436;
const BAR_Y0 = 44;
const BAR_ZONE_H = 172;
const ROW_H = 34;
const ROW_GAP = 12;

type Platform = 'h800' | 'pcie' | 'amd' | 'ib';

interface BarSpec {
  label: string;
  low: number;
  high?: number;
  log?: boolean;
  note: string;
}

interface PlatformSpec {
  chip: string;
  canvasName: string;
  headline: string;
  ground: string;
  protocol: string;
  bars: BarSpec[];
}

const PLATFORM_ORDER: Platform[] = ['h800', 'pcie', 'amd', 'ib'];

const PLATFORMS: Record<Platform, PlatformSpec> = {
  h800: {
    chip: 'NVLink 节点内',
    canvasName: '节点内',
    headline: 'AG-GEMM 1.43×',
    ground: KIT.lightEnv,
    protocol:
      '形状：5 个负载共 26 组配置（取自 LLaMA3/3.1、Mistral-7B、Qwen2-72B、Qwen1.5-MoE、Mixtral-8x7B/8x22B、DeepSeek-MoE）；其中 AG-GEMM 为 6 组 M=8192 形状；硬件：8× NVIDIA H800 节点内；基线：CuBLAS+NCCL（非重叠）；指标：几何加速比，单位 ×，越大越好。',
    bars: [
      { label: 'AG-GEMM', low: 1.43, log: true, note: '6 组 M=8192 形状的几何平均（相对 CuBLAS+NCCL）。' },
      { label: 'GEMM-RS', low: 1.27, log: true, note: '6 组 M=8192 形状的几何平均（相对 CuBLAS+NCCL）。' },
      {
        label: 'GEMM-AR',
        low: 1.32,
        log: true,
        note: '相对 CuBLAS+NCCL；论文归因于借助 NVLink Sharp 的更快 AllReduce（支持 one-shot 与 two-shot）。',
      },
      {
        label: 'AG-MoE',
        low: 19.18,
        log: true,
        note: '4 组 num_tokens=8192 形状的几何平均（相对 CuBLAS+NCCL）；本模块的 H800 加速比条统一使用 0.5×–20× 的对数刻度，论文画 MoE 结果时也用对数坐标。',
      },
    ],
  },
  pcie: {
    chip: 'PCIe',
    canvasName: 'PCIe',
    headline: '几何平均 8.33×',
    ground: KIT.tileEdge,
    protocol:
      '硬件：8 卡 PCIe 互联 GPU；基线：CuBLAS+NCCL（AllToAll 表标注为 NCCL）；指标：单项与几何平均加速比，单位 ×，越大越好。',
    bars: [
      { label: 'GEMM-RS', low: 2.54, note: '单项加速比（相对 CuBLAS+NCCL）。' },
      { label: 'AllToAll', low: 4.51, note: '单项加速比；该表基线标注为 NCCL。' },
      { label: 'MoE-RS', low: 9.26, note: '单项加速比（相对 CuBLAS+NCCL）。' },
      {
        label: '几何平均',
        low: 8.33,
        note: '六个负载的几何平均；其中 AllGather+MoE 的单项区间为 14.86×–49.84×。',
      },
    ],
  },
  amd: {
    chip: 'AMD 8 卡',
    canvasName: 'AMD 8 卡',
    headline: '2%–38%',
    ground: KIT.darkEnv,
    protocol:
      '硬件：8 卡 AMD GPU（RocSHMEM + Triton for AMD）；基线：RocmBLAS+RCCL；指标：加速比，单位 ×，越大越好；论文把该平台结果标注为初步结果。',
    bars: [
      { label: 'AG-GEMM 几何', low: 1.11, note: '8 卡 AMD 上相对 RocmBLAS+RCCL 的几何加速。' },
      { label: 'GEMM-RS 几何', low: 1.16, note: '8 卡 AMD 上相对 RocmBLAS+RCCL 的几何加速。' },
      {
        label: '总体区间',
        low: 1.02,
        high: 1.38,
        note: '论文正文把该平台的整体收益写成 2%–38%，即 1.02×–1.38×；Qwen3-32B 模块级注意力 1.03×、FFN 1.07×。',
      },
    ],
  },
  ib: {
    chip: '跨节点网络',
    canvasName: '跨节点',
    headline: '4 节点 0.61×–1.03×',
    ground: KIT.muted,
    protocol:
      '硬件：H800 集群 1/2/4 节点（8/16/32 GPU），节点内 NVLink 单向 200 GB/s、跨节点单向 50 GB/s；基线：CuBLAS+NCCL；指标：训练强扩展加速比（总 token 固定 32768），单位 ×，大于 1 才表示有收益。论文另一处报告训练强扩展（TP，8–32 GPU）整体区间为 0.80×–1.71×。',
    bars: [
      {
        label: '1 节点',
        low: 1.31,
        high: 1.67,
        note: 'AG-GEMM 强扩展区间（相对 CuBLAS+NCCL）。',
      },
      {
        label: '2 节点',
        low: 1.11,
        high: 1.76,
        note: 'AG-GEMM 强扩展区间（相对 CuBLAS+NCCL）。',
      },
      {
        label: '4 节点',
        low: 0.61,
        high: 1.03,
        note: 'AG-GEMM 强扩展区间跨过 1×：跨节点带宽低，分片后单卡 GEMM 太小，掩盖不了通信。',
      },
    ],
  },
};

interface OnState {
  text: string;
  cls: string;
}

const FEEDBACK: Record<Platform, OnState> = {
  h800: {
    cls: 'good',
    text: '8×H800 节点内（相对 CuBLAS+NCCL 的几何加速，越大越好）：AG-GEMM 1.43×、GEMM+RS 1.27×、GEMM+AR 1.32×、AG+MoE 19.18×。',
  },
  pcie: {
    cls: '',
    text: 'PCIe 平台（8 卡）六个负载的几何平均加速 8.33×（相对 CuBLAS+NCCL），单项从 GEMM+RS 2.54× 到 AG+MoE 49.84×；算力更弱反而让通信占比更高，重叠的收益也更明显。',
  },
  amd: {
    cls: 'bad',
    text: 'AMD 8 卡的收益区间是 2%–38%（相对 RocmBLAS+RCCL 的加速）；这是初步结果，量级远小于节点内 NVLink 场景。',
  },
  ib: {
    cls: 'bad',
    text: '跨节点 TP 的收益不保证：H800 上 AG-GEMM 强扩展在 1 节点为 1.31×–1.67×、2 节点 1.11×–1.76×，到 4 节点降到 0.61×–1.03×（相对 CuBLAS+NCCL）。论文解释是跨节点带宽低，分片后单卡 GEMM 太小，掩盖不了通信。',
  },
};

// ---- life-view pacing: same hand, different ground and road conditions -----
interface Pace {
  loop: number;
  pauseEvery: number;
  pauseLen: number;
}

const PACE: Record<Platform, Pace> = {
  h800: { loop: 2.4, pauseEvery: 0, pauseLen: 0 },
  pcie: { loop: 2.6, pauseEvery: 2, pauseLen: 0.15 },
  amd: { loop: 2.6, pauseEvery: 0, pauseLen: 0 },
  ib: { loop: 3.6, pauseEvery: 1, pauseLen: 0.35 },
};

interface Schedule {
  marks: number[];
  total: number;
}

function buildSchedule(pace: Pace): Schedule {
  const pauses = pace.pauseEvery > 0 ? Math.floor((TILES - 1) / pace.pauseEvery) : 0;
  const perTile = (pace.loop - pauses * pace.pauseLen) / TILES;
  const marks: number[] = [];
  let clock = 0;
  for (let i = 1; i <= TILES; i += 1) {
    clock += perTile;
    marks.push(clock);
    if (pace.pauseEvery > 0 && i % pace.pauseEvery === 0 && i < TILES) clock += pace.pauseLen;
  }
  return { marks, total: clock };
}

const SCHEDULES: Record<Platform, Schedule> = {
  h800: buildSchedule(PACE.h800),
  pcie: buildSchedule(PACE.pcie),
  amd: buildSchedule(PACE.amd),
  ib: buildSchedule(PACE.ib),
};

function tilesLaid(schedule: Schedule, elapsed: number): number {
  const cycle = ((elapsed % schedule.total) + schedule.total) % schedule.total;
  let laid = 0;
  while (laid < TILES && cycle >= schedule.marks[laid]) laid += 1;
  return laid;
}

function valueText(bar: BarSpec): string {
  return bar.high === undefined ? `${bar.low}×` : `${bar.low}×–${bar.high}×`;
}

export const M91PlatformChips: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ platform: Platform; entryAt: number }>({
    platform: 'h800',
    entryAt: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [platform, setPlatform] = useState<Platform>('h800');
  const [showProtocol, setShowProtocol] = useState(true);
  const [feedback, setFeedback] = useState<OnState>(FEEDBACK.h800);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { platform: Platform; entryAt: number }, now: number, tSec: number): void => {
      const spec = PLATFORMS[s.platform];
      dTileGround(ctx, W, H);

      // ---- life view: the same hand on a different ground material ----------
      ctx.fillStyle = spec.ground;
      ctx.fillRect(GX, GY, GW, GH);
      ctx.strokeStyle = KIT.darkEnv;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(GX, GY + GH);
      ctx.lineTo(GX + GW, GY + GH);
      ctx.stroke();

      const schedule = SCHEDULES[s.platform];
      const laid = tilesLaid(schedule, tSec);
      dGrid(
        ctx,
        GRID_X,
        GRID_Y,
        6,
        3,
        CELL,
        {
          stateAt: (col: number, row: number): TileState =>
            row * 6 + col < laid ? 'done' : 'idle',
        },
        tSec
      );
      const doneIdx = Math.min(laid, TILES - 1);
      const handX = GRID_X + (doneIdx % 6) * (CELL + 2) + CELL / 2;
      const handY = GRID_Y + Math.floor(doneIdx / 6) * (CELL + 2) - 10;
      dHand(ctx, handX, handY, tSec, KIT.text);
      dBucket(ctx, 62, GY + GH - 8);

      // ---- technical view: reported speedups for this platform -------------
      const bars = spec.bars;
      const logAxis = bars.some((bar) => bar.log === true);
      const axisMin = logAxis ? 0.5 : 0;
      const rawMax = Math.max(...bars.map((bar) => (bar.high === undefined ? bar.low : bar.high)));
      const axisMax = logAxis ? 20 : rawMax * 1.1;
      const posOf = (value: number): number => {
        const v = clamp(value, axisMin, axisMax);
        const frac = logAxis
          ? Math.log(v / axisMin) / Math.log(axisMax / axisMin)
          : (v - axisMin) / (axisMax - axisMin);
        return TRACK_X + frac * TRACK_W;
      };

      const entry = s.entryAt <= 0 ? 1 : easeOutCubic(clamp((now - s.entryAt) / 500, 0, 1));
      const baseX = posOf(1);

      // 1x baseline: dashed datum across the whole bar zone
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = KIT.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(baseX, BAR_Y0 - 6);
      ctx.lineTo(baseX, BAR_Y0 + BAR_ZONE_H + 6);
      ctx.stroke();
      ctx.restore();

      const groupH = bars.length * ROW_H + (bars.length - 1) * ROW_GAP;
      const top = BAR_Y0 + (BAR_ZONE_H - groupH) / 2;

      bars.forEach((bar, index) => {
        const y = top + index * (ROW_H + ROW_GAP);
        const trueHigh = bar.high === undefined ? bar.low : bar.high;
        const lowX = lerp(baseX, posOf(bar.low), entry);
        const highX = lerp(baseX, posOf(trueHigh), entry);
        const crosses = bar.low < 1 && trueHigh >= 1;

        // empty track (kit bar with a zero fill keeps the shared look)
        dBar(ctx, TRACK_X, y, TRACK_W, ROW_H, 0.001, KIT.border);

        if (bar.low >= 1 && !crosses) {
          dBar(ctx, baseX, y, Math.max(2, lowX - baseX), ROW_H, 1, KIT.success);
          if (bar.high !== undefined) {
            ctx.globalAlpha = 0.45;
            dBar(ctx, lowX, y, Math.max(2, highX - lowX), ROW_H, 1, KIT.success);
            ctx.globalAlpha = 1;
          }
        } else if (crosses) {
          dBar(ctx, baseX, y, Math.max(2, highX - baseX), ROW_H, 1, KIT.success);
          dBar(ctx, lowX, y, Math.max(2, baseX - lowX), ROW_H, 1, KIT.failure);
          ctx.strokeStyle = KIT.emphasis;
          ctx.lineWidth = 3;
          ctx.strokeRect(lowX - 1.5, y - 1.5, Math.max(4, highX - lowX + 3), ROW_H + 3);
        } else {
          dBar(ctx, lowX, y, Math.max(2, baseX - lowX), ROW_H, 1, KIT.failure);
        }

        // bare value at the bar end (never a prefixed expression)
        const endX = Math.max(lowX, highX);
        ctx.fillStyle = KIT.text;
        ctx.font = '600 14px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(bar.high === undefined ? `${bar.low}` : `${bar.low}–${bar.high}`, endX + 10, y + ROW_H / 2 + 5);
      });

      // axis: bare scale numbers only
      ctx.fillStyle = KIT.muted;
      ctx.font = '500 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      const axisY = BAR_Y0 + BAR_ZONE_H + 20;
      ctx.textAlign = 'left';
      ctx.fillText(logAxis ? '0.5' : '0', TRACK_X - 2, axisY);
      ctx.textAlign = 'center';
      ctx.fillText('1', baseX, axisY);
      ctx.textAlign = 'right';
      ctx.fillText(logAxis ? '20' : axisMax.toFixed(1), TRACK_X + TRACK_W + 4, axisY);
      ctx.textAlign = 'left';

      dLabel(ctx, spec.canvasName, TRACK_X, 34, KIT.text);
      dLabel(ctx, '×', 1036, 34, KIT.muted, 'right');
      dLegend(
        ctx,
        [
          { color: KIT.border, text: '基线 1×' },
          { color: KIT.success, text: '收益' },
          { color: KIT.failure, text: '损失' },
        ],
        TRACK_X,
        266
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(stateRef.current, 0, 0);
    canvas.classList.add('is-ready');

    const tick = (now: number): void => {
      render(stateRef.current, now, now / 1000);
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

  const spec = PLATFORMS[platform];

  const onPickPlatform = (next: Platform): void => {
    stateRef.current.platform = next;
    stateRef.current.entryAt = performance.now();
    setPlatform(next);
    setFeedback(FEEDBACK[next]);
  };

  const onToggleProtocol = (): void => {
    setShowProtocol((previous) => !previous);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          {spec.chip} <span className="val">{spec.headline}</span>
        </label>
        <div className="chip-row">
          {PLATFORM_ORDER.map((item) => (
            <button
              key={item}
              type="button"
              className={item === platform ? 'chip selected' : 'chip'}
              aria-pressed={item === platform}
              onClick={() => onPickPlatform(item)}
            >
              {PLATFORMS[item].chip}
            </button>
          ))}
          <button
            type="button"
            className={showProtocol ? 'chip selected' : 'chip'}
            aria-pressed={showProtocol}
            onClick={onToggleProtocol}
          >
            显示协议
          </button>
        </div>
      </div>
      {showProtocol ? (
        <table className="paper">
          <thead>
            <tr>
              <th>指标</th>
              <th>数值（单位 ×，越大越好）</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {spec.bars.map((bar) => (
              <tr key={bar.label}>
                <td>{bar.label}</td>
                <td>{valueText(bar)}</td>
                <td>{bar.note}</td>
              </tr>
            ))}
            <tr>
              <td>协议</td>
              <td colSpan={2}>{spec.protocol}</td>
            </tr>
          </tbody>
        </table>
      ) : null}
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M91PlatformChips;
