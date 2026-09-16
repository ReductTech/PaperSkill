import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, dTileGround, dTimeline, dBar, dLabel, dLegend } from './ditron-theme-kit';

// §3 module 3.2 — four rank×time lanes. The re-ordering direction is decided by the
// operator's data flow: AG+GEMM needs remote data (gather mode fetches as early as
// possible), GEMM+RS must send its results out (scatter mode computes the furthest
// destination tiles first). A mismatched pair is never hidden: its fetch/send events
// turn red and are pushed to the end of the timeline, with the reason in the feedback.

const W = 1080;
const H = 280;
const LANE_X = 72;
const LANE_Y = 44;
const LANE_W = 900;
const LANE_H = 150;
const LANE_ROWS = 4;
const BAR_X = 72;
const BAR_Y = 200;
const BAR_W = 900;
const BAR_H = 20;
const LEGEND_Y = 246;
const PERIOD = 3.2;
/** longest schedule in the model (mismatched), used to normalise the completion bar */
const MAX_COMPLETION = 0.896;

type Op = 'ag-gemm' | 'gemm-rs';
type Mode = 'gather' | 'scatter';

interface Sim {
  op: Op;
  mode: Mode;
  /** performance.now() at mount; only drives the sweeping playhead */
  t0: number;
}

interface Seg {
  from: number;
  to: number;
  kind: 'compute' | 'comm';
  /** remote fetch event (gather) */
  remote?: boolean;
  /** furthest-destination tiles (scatter) */
  far?: boolean;
}

interface Schedule {
  matched: boolean;
  completion: number;
  segs: Seg[];
}

interface Feedback {
  text: string;
  cls: string;
}

function isMatched(op: Op, mode: Mode): boolean {
  return (op === 'ag-gemm') === (mode === 'gather');
}

function scheduleFor(op: Op, mode: Mode): Schedule {
  const matched = isMatched(op, mode);
  if (op === 'ag-gemm') {
    if (mode === 'gather') {
      return {
        matched,
        completion: 0.56,
        segs: [
          { from: 0, to: 0.22, kind: 'comm', remote: true },
          { from: 0.22, to: 0.56, kind: 'compute' },
        ],
      };
    }
    // AG+GEMM + 分发模式：取数被推迟到最后，计算被迫分两段
    return {
      matched,
      completion: MAX_COMPLETION,
      segs: [
        { from: 0, to: 0.336, kind: 'compute' },
        { from: 0.336, to: 0.556, kind: 'comm', remote: true },
        { from: 0.556, to: 0.896, kind: 'compute' },
      ],
    };
  }
  if (mode === 'scatter') {
    return {
      matched,
      completion: 0.56,
      segs: [
        { from: 0, to: 0.34, kind: 'compute', far: true },
        { from: 0.34, to: 0.56, kind: 'comm' },
      ],
    };
  }
  // GEMM+RS + 收集模式：长途发送被拖到最后
  return {
    matched,
    completion: MAX_COMPLETION,
    segs: [
      { from: 0, to: 0.34, kind: 'compute' },
      { from: 0.34, to: 0.556, kind: 'comm' },
      { from: 0.556, to: 0.896, kind: 'comm', far: true },
    ],
  };
}

function feedbackFor(op: Op, mode: Mode): Feedback {
  if (!isMatched(op, mode)) {
    return op === 'ag-gemm'
      ? {
          text: 'AG+GEMM 的计算依赖远端数据，应该用收集模式；分发模式会把取数推迟到最后，反而更慢。',
          cls: 'bad',
        }
      : {
          text: 'GEMM-RS 的结果要先发出去，应该用分发模式；收集模式会让长途发送等到最后。',
          cls: 'bad',
        };
  }
  return mode === 'gather'
    ? {
        text: '收集模式：尽早发起远端取数请求，把本地 HBM 当作远端内存的缓存，计算紧跟数据到达。',
        cls: '',
      }
    : {
        text: '分发模式：优先计算目的地最远节点的砖块，长途通信在数据可用的那一刻就立即起飞。',
        cls: 'good',
      };
}

export const M32GatherScatter: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const simRef = useRef<Sim>({ op: 'ag-gemm', mode: 'gather', t0: 0 });

  const [op, setOp] = useState<Op>('ag-gemm');
  const [mode, setMode] = useState<Mode>('gather');
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor('ag-gemm', 'gather'));

  const matched = isMatched(op, mode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    if (!ctx) return;
    const c: CanvasRenderingContext2D = ctx;

    const arrowLeft = (x: number, y: number, len: number, color: string): void => {
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - len, y);
      c.stroke();
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(x - len - 8, y);
      c.lineTo(x - len + 2, y - 5);
      c.lineTo(x - len + 2, y + 5);
      c.closePath();
      c.fill();
    };

    const render = (s: Sim, t: number): void => {
      const sched = scheduleFor(s.op, s.mode);
      const phase = (t % PERIOD) / PERIOD;
      const commColor = sched.matched ? KIT.auxiliary : KIT.failure;
      const remoteColor = sched.matched ? KIT.support : KIT.failure;
      const farColor = sched.matched ? KIT.emphasis : KIT.failure;

      dTileGround(c, W, H);

      const laneH = dTimeline(c, LANE_X, LANE_Y, LANE_W, LANE_H, LANE_ROWS);
      for (let r = 0; r < LANE_ROWS; r += 1) {
        const y = LANE_Y + r * laneH + 6;
        const barH = laneH - 12;
        sched.segs.forEach((sg) => {
          const x1 = LANE_X + sg.from * LANE_W;
          const x2 = LANE_X + sg.to * LANE_W;
          const reached = phase >= sg.to;
          c.globalAlpha = reached ? 1 : 0.55;
          c.fillStyle = sg.kind === 'compute' ? KIT.guidance : commColor;
          c.fillRect(x1, y, Math.max(3, x2 - x1), barH);
          c.globalAlpha = 1;
          if (sg.remote) {
            // 远端取数：从右侧指向泳道左侧的箭头
            for (let i = 0; i < 3; i += 1) {
              const ax = x2 - 10 - i * 18 - r * 4;
              if (ax - 26 > x1) arrowLeft(ax, y + barH / 2, 14, remoteColor);
            }
          }
          if (sg.far) {
            // 目的地最远的砖：每 rank 2 个实心小方块
            c.fillStyle = farColor;
            c.fillRect(x1 + 6, y + barH / 2 - 3, 6, 6);
            c.fillRect(x1 + 18, y + barH / 2 - 3, 6, 6);
          }
        });
      }

      // sweeping playhead: the events it has passed are drawn at full strength
      c.strokeStyle = KIT.emphasis;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(LANE_X + phase * LANE_W, LANE_Y);
      c.lineTo(LANE_X + phase * LANE_W, LANE_Y + LANE_H);
      c.stroke();

      // lane numbers (bare values)
      c.fillStyle = KIT.muted;
      c.font = '500 12px "Segoe UI", "Microsoft YaHei", sans-serif';
      c.textAlign = 'right';
      for (let r = 0; r < LANE_ROWS; r += 1) {
        c.fillText(String(r), LANE_X - 8, LANE_Y + r * laneH + laneH / 2 + 4);
      }
      c.textAlign = 'left';

      // completion bar (normalised; bare number at the bar end)
      const frac = sched.completion / MAX_COMPLETION;
      dBar(c, BAR_X, BAR_Y, BAR_W, BAR_H, frac, sched.matched ? KIT.success : KIT.failure);
      c.fillStyle = KIT.text;
      c.font = '600 15px "Segoe UI", "Microsoft YaHei", sans-serif';
      c.fillText(sched.matched ? '1.0' : '1.6', BAR_X + frac * BAR_W + 8, BAR_Y + BAR_H - 5);

      // labels (max 2)
      dLabel(c, s.op === 'ag-gemm' ? 'AG+GEMM' : 'GEMM-RS', 24, 30, KIT.text);
      dLabel(
        c,
        s.mode === 'gather' ? '收集' : '分发',
        W - 24,
        30,
        sched.matched ? (s.mode === 'gather' ? KIT.guidance : KIT.success) : KIT.failure,
        'right'
      );
      dLegend(
        c,
        [
          { color: KIT.guidance, text: '计算' },
          { color: KIT.auxiliary, text: '通信' },
          { color: KIT.support, text: '远端' },
        ],
        LANE_X,
        LEGEND_Y
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(simRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (now: number): void => {
      const s = simRef.current;
      if (!s.t0) s.t0 = now;
      render(s, (now - s.t0) / 1000);
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

  const onOp = (next: Op): void => {
    simRef.current.op = next;
    setOp(next);
    setFeedback(feedbackFor(next, simRef.current.mode));
  };

  const onMode = (next: Mode): void => {
    simRef.current.mode = next;
    setMode(next);
    setFeedback(feedbackFor(simRef.current.op, next));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span>算子</span>
        <button
          type="button"
          className={`chip${op === 'ag-gemm' ? ' selected' : ''}`}
          aria-pressed={op === 'ag-gemm'}
          onClick={() => onOp('ag-gemm')}
        >
          AG+GEMM
        </button>
        <button
          type="button"
          className={`chip${op === 'gemm-rs' ? ' selected' : ''}`}
          aria-pressed={op === 'gemm-rs'}
          onClick={() => onOp('gemm-rs')}
        >
          GEMM-RS
        </button>
        <span>模式</span>
        <button
          type="button"
          className={`chip${mode === 'gather' ? ' selected' : ''}`}
          aria-pressed={mode === 'gather'}
          onClick={() => onMode('gather')}
        >
          收集模式
        </button>
        <button
          type="button"
          className={`chip${mode === 'scatter' ? ' selected' : ''}`}
          aria-pressed={mode === 'scatter'}
          onClick={() => onMode('scatter')}
        >
          分发模式
        </button>
        <label>
          相对完成（示意） <span className="val">{matched ? '1.0×' : '1.6×'}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M32GatherScatter;
