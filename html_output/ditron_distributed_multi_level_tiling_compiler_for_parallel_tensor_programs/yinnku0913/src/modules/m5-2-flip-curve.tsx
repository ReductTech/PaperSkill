import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, dGrid, dHand, dLabel, dLegend, dRule, dTileGround } from './ditron-theme-kit';

// §5 module 2 — FFN 的翻转阈值.
// The paper gives no number between 2k and 128k, so the canvas draws nine discrete
// stops (the lengths the paper uses), a fixed 2k threshold line, and only the two
// reported points (Qwen3-32B FFN, 8 x H800, speedup over CuBLAS+NCCL, higher is
// better). Nothing is interpolated: every other stop stays an empty marker.

const W = 1080;
const H = 280;

type Mode = 'allreduce' | 'ag-rs';
type FeedbackCls = '' | 'good' | 'bad';

interface Feedback {
  text: string;
  cls: FeedbackCls;
}

interface FlipState {
  index: number;
  mode: Mode;
}

const STOPS: number[] = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
const THRESHOLD = 2048;
const THRESHOLD_INDEX = 2;
const TOP_INDEX = STOPS.length - 1;
const TOP_TOKENS = 131072;

const VALUE_ALLREDUCE_128K = 1.17;
const VALUE_AGRS_128K = 1.27;

const AXIS_X = 96;
const AXIS_W = 888;
const AXIS_Y = 192;
const STOP_PITCH = AXIS_W / (STOPS.length - 1);

const INITIAL_STATE: FlipState = { index: 0, mode: 'allreduce' };

function xFor(index: number): number {
  return AXIS_X + index * STOP_PITCH;
}

function valueY(value: number): number {
  return 160 - ((value - 1) / 0.4) * 100;
}

function feedbackFor(tokens: number, mode: Mode): Feedback {
  if (tokens === TOP_TOKENS) {
    return {
      text:
        '128k token 时（Qwen3-32B FFN，8×H800，相对 CuBLAS+NCCL 的加速，越大越好）：AG+RS 1.27× 优于 AllReduce 1.17×。',
      cls: 'good',
    };
  }
  if (tokens < THRESHOLD && mode === 'ag-rs') {
    return {
      text: `token 数 ${tokens} 低于 2k 阈值：FFN 的 GEMM 太短，掩盖不了 AG/RS 的通信，论文不推荐这样选。`,
      cls: 'bad',
    };
  }
  if (tokens < THRESHOLD) {
    return { text: `token 数 ${tokens} 低于 2k：GEMM 太短，论文推荐 AllReduce。`, cls: '' };
  }
  if (mode === 'allreduce') {
    return {
      text: `token 数 ${tokens} 已超过 2k，仍可用 AllReduce，但 128k 时只有 1.17×，低于 AG+RS 的 1.27×。`,
      cls: '',
    };
  }
  return {
    text: `token 数 ${tokens} 已超过 2k 阈值，AG+RS 开始占优；论文只报告了 128k 处的数值。`,
    cls: '',
  };
}

export const M52FlipCurve: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef(0);
  const stateRef = useRef<FlipState>(INITIAL_STATE);
  const [index, setIndex] = useState<number>(INITIAL_STATE.index);
  const [mode, setMode] = useState<Mode>(INITIAL_STATE.mode);
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor(STOPS[INITIAL_STATE.index], INITIAL_STATE.mode));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (state: FlipState, time: number) => {
      const t = time / 1000;
      const tokens = STOPS[state.index];
      const currentX = xFor(state.index);
      const thresholdX = xFor(THRESHOLD_INDEX);
      dTileGround(ctx, W, H);

      // two regimes: AllReduce left of 2k, AG+RS right of it
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = KIT.guidance;
      ctx.fillRect(AXIS_X, 52, thresholdX - AXIS_X, 140);
      ctx.fillStyle = KIT.success;
      ctx.fillRect(thresholdX, 52, AXIS_X + AXIS_W - thresholdX, 140);
      ctx.globalAlpha = 1;

      // token-length axis with one tick per discrete stop
      dRule(ctx, AXIS_X, AXIS_Y, AXIS_X + AXIS_W, AXIS_Y, KIT.border);
      ctx.strokeStyle = KIT.border;
      ctx.lineWidth = 1;
      STOPS.forEach((_stop, i) => {
        ctx.beginPath();
        ctx.moveTo(xFor(i), AXIS_Y - 6);
        ctx.lineTo(xFor(i), AXIS_Y + 6);
        ctx.stroke();
      });

      // the fixed 2k threshold line
      ctx.save();
      ctx.setLineDash([9, 7]);
      ctx.strokeStyle = KIT.emphasis;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(thresholdX, 44);
      ctx.lineTo(thresholdX, 200);
      ctx.stroke();
      ctx.restore();

      if (tokens === TOP_TOKENS) {
        // the only two points the paper reports
        const reported: number[] = [VALUE_ALLREDUCE_128K, VALUE_AGRS_128K];
        reported.forEach((value) => {
          const y = valueY(value);
          ctx.strokeStyle = KIT.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(currentX, y);
          ctx.lineTo(currentX, AXIS_Y);
          ctx.stroke();
          ctx.fillStyle = KIT.emphasis;
          ctx.beginPath();
          ctx.arc(currentX, y, 5, 0, Math.PI * 2);
          ctx.fill();
          dLabel(ctx, value.toFixed(2), currentX + 10, y + 5, KIT.text, 'left');
        });
      } else {
        // no reported value at this stop
        ctx.strokeStyle = KIT.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(currentX, 150, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currentX, 156);
        ctx.lineTo(currentX, AXIS_Y);
        ctx.stroke();
      }

      // nine stop tiles; the current one carries the chosen collective's colour
      dGrid(
        ctx,
        AXIS_X - 15,
        240,
        STOPS.length,
        1,
        30,
        {
          gap: STOP_PITCH - 30,
          frame: false,
          stateAt: (col: number) =>
            col === state.index ? (state.mode === 'allreduce' ? 'local' : 'done') : 'idle',
        },
        t
      );

      // the hand keeps its rhythm: below 2k it stalls once per cycle
      const cycle = t % 3.2;
      const handTime = tokens < THRESHOLD && cycle < 0.5 ? t - cycle : t;
      dHand(ctx, currentX, 226, handTime, KIT.text);

      dLabel(ctx, '512', AXIS_X, 214, KIT.muted, 'center');
      dLabel(ctx, '128k', AXIS_X + AXIS_W, 214, KIT.muted, 'center');
      dLegend(
        ctx,
        [
          { color: KIT.guidance, text: 'AllReduce' },
          { color: KIT.success, text: 'AG+RS' },
        ],
        620,
        214
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

  const apply = (next: FlipState) => {
    stateRef.current = next;
    setIndex(next.index);
    setMode(next.mode);
    setFeedback(feedbackFor(STOPS[next.index], next.mode));
  };

  const onSlide = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    apply({ index: next, mode: stateRef.current.mode });
  };

  const onModeClick = (next: Mode) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    apply({ index: stateRef.current.index, mode: next });
  };

  const onJumpTop = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    apply({ index: TOP_INDEX, mode: stateRef.current.mode });
  };

  const tokens = STOPS[index];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          token 长度 <span className="val">{tokens}</span>
        </label>
        <input type="range" min={0} max={TOP_INDEX} step={1} value={index} onChange={onSlide} />
      </div>
      <div className="chip-row">
        <button
          className={mode === 'allreduce' ? 'chip selected' : 'chip'}
          aria-pressed={mode === 'allreduce'}
          onClick={onModeClick('allreduce')}
        >
          全归约
        </button>
        <button
          className={mode === 'ag-rs' ? 'chip selected' : 'chip'}
          aria-pressed={mode === 'ag-rs'}
          onClick={onModeClick('ag-rs')}
        >
          AG+RS
        </button>
        <button className="chip" onClick={onJumpTop}>
          跳到 128k
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M52FlipCurve;
