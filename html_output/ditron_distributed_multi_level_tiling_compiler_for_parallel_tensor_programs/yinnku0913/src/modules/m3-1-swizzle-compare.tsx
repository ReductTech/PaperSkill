import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  KIT,
  dTileGround,
  dTile,
  dTimeline,
  dLabel,
  dLegend,
  type TileState,
} from './ditron-theme-kit';

// §3 module 3.1 — two equal 520×280 panels on ONE shared time base.
// Left panel: no swizzle. Every rank walks column 0,1,2,… but column c only becomes
// computable once rank c has produced it, so ranks start one after another and the
// rankCount columns take rankCount + (rankCount − 1) steps.
// Right panel: rank-aware offset (rank r starts at tile r and wraps), so all ranks
// compute from step 0 and finish together after rankCount steps.
// One requestAnimationFrame loop renders both canvases and one startTime drives them.

const W = 520;
const H = 280;
const HEAT_X = 72;
const HEAT_Y = 46;
const HEAT_W = 424;
const HEAT_H = 144;
const TL_X = 72;
const TL_Y = 214;
const TL_W = 424;
const TL_H = 32;
const LEGEND_Y = 205;

type Phase = 'idle' | 'running' | 'done';
type RankCount = 8 | 16;

interface Sim {
  rankCount: RankCount;
  phase: Phase;
  /** shared by both panels: set once when「开始对比」is pressed */
  startTime: number;
  /** seconds since startTime, or the final value when phase === 'done' */
  elapsed: number;
}

interface Feedback {
  text: string;
  cls: string;
}

const FB_IDLE: Feedback = {
  text: '无 swizzle 时，所有进程都从 tile 0 起步，而 tile 0 的数据在进程 0 上，其余进程全部阻塞。',
  cls: 'bad',
};
const FB_RUNNING: Feedback = {
  text: '对比进行中：左侧还在等第 0 列的数据，右侧各进程已经各自开始计算本地就绪的砖块。',
  cls: '',
};
const FB_DONE: Feedback = {
  text: '有 swizzle 时进程 r 从 tile r 起步，首块数据本地就绪，初始阻塞消失，GEMM 与 ReduceScatter 得以重叠。',
  cls: 'good',
};

/** Seconds per tile step, shared by both panels so the two timelines are comparable. */
const TILE_STEP = 0.3;
const TILE_STEP_REDUCED = 0.14;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Steps needed until the slowest (no-swizzle) panel is completely laid. */
function totalSteps(rankCount: number): number {
  return rankCount * 2 - 1;
}

/** Tiles already computed across all ranks at `steps` tile-steps. */
function countTiles(steps: number, rankCount: number, swizzleOn: boolean): number {
  let sum = 0;
  for (let r = 0; r < rankCount; r += 1) {
    const local = steps - (swizzleOn ? 0 : r);
    sum += clamp(Math.floor(local), 0, rankCount);
  }
  return sum;
}

export const M31SwizzleCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const simRef = useRef<Sim>({ rankCount: 16, phase: 'idle', startTime: 0, elapsed: 0 });
  const countRef = useRef({ left: 0, right: 0 });

  const [rankCount, setRankCount] = useState<RankCount>(16);
  const [phase, setPhase] = useState<Phase>('idle');
  const [counts, setCounts] = useState({ left: 0, right: 0 });
  const [feedback, setFeedback] = useState<Feedback>(FB_IDLE);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    let lctx: CanvasRenderingContext2D | null = null;
    let rctx: CanvasRenderingContext2D | null = null;
    try {
      lctx = setupCanvas(left, W, H);
      rctx = setupCanvas(right, W, H);
    } catch {
      return;
    }
    if (!lctx || !rctx) return;
    const lc: CanvasRenderingContext2D = lctx;
    const rc: CanvasRenderingContext2D = rctx;
    const step = prefersReducedMotion() ? TILE_STEP_REDUCED : TILE_STEP;

    /** One heat-map cell: dTile scaled horizontally so the rank×tile grid fits the panel. */
    const drawCell = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      state: TileState,
      t: number
    ): void => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(w / h, 1);
      dTile(ctx, 0, 0, h, state, t);
      ctx.restore();
      if (state === 'blocked') {
        // the stall keeps breathing so the eye lands on the blocked ranks
        ctx.save();
        ctx.globalAlpha = 0.3 + 0.3 * Math.sin((t / 0.6) * Math.PI * 2);
        ctx.strokeStyle = KIT.failure;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        ctx.restore();
      }
    };

    const renderPanel = (
      ctx: CanvasRenderingContext2D,
      swizzleOn: boolean,
      s: Sim,
      t: number
    ): void => {
      const n = s.rankCount;
      const cellW = HEAT_W / n;
      const cellH = HEAT_H / n;
      const span = totalSteps(n) * step;
      const steps = clamp(s.elapsed / step, 0, totalSteps(n));

      dTileGround(ctx, W, H);

      // ---- rank × tile heat map (rows = ranks, columns = tiles) -------------
      for (let r = 0; r < n; r += 1) {
        const local = steps - (swizzleOn ? 0 : r);
        const done = Math.floor(local);
        for (let c = 0; c < n; c += 1) {
          let state: TileState = 'idle';
          if (s.phase === 'idle') {
            // before「开始对比」both panels show one untouched grid; the stall is
            // described by the feedback instead of being drawn ahead of time
            state = 'idle';
          } else if (local >= n) {
            state = 'done';
          } else if (local < 0) {
            state = c === 0 ? 'blocked' : 'idle';
          } else {
            const order = swizzleOn ? (c - r + n) % n : c;
            state = order < done ? 'done' : order === done ? 'current' : 'idle';
          }
          drawCell(ctx, HEAT_X + c * cellW, HEAT_Y + r * cellH, cellW, cellH, state, t);
        }
      }
      ctx.strokeStyle = KIT.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(HEAT_X - 4, HEAT_Y - 4, HEAT_W + 8, HEAT_H + 8);

      // ---- swizzle side: the diagonal of start points ----------------------
      if (swizzleOn) {
        ctx.strokeStyle = KIT.emphasis;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let r = 0; r < n; r += 1) {
          const cx = HEAT_X + (r + 0.5) * cellW;
          const cy = HEAT_Y + (r + 0.5) * cellH;
          if (r === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        for (let r = 0; r < n; r += 1) {
          ctx.fillStyle = KIT.emphasis;
          ctx.beginPath();
          ctx.arc(HEAT_X + (r + 0.5) * cellW, HEAT_Y + (r + 0.5) * cellH, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---- rank × time strip under the panel (2 lanes, shared time base) ---
      const laneH = dTimeline(ctx, TL_X, TL_Y, TL_W, TL_H, 2);
      const laneRanks = [0, n - 1];
      laneRanks.forEach((r, i) => {
        if (s.phase === 'idle') return;
        const y = TL_Y + i * laneH + 3;
        const barH = laneH - 6;
        const wait = swizzleOn ? 0 : r * step;
        const work = n * step;
        const waitEnd = (wait / span) * TL_W;
        const workW = (work / span) * TL_W;
        if (wait > 0) {
          ctx.fillStyle = KIT.failure;
          ctx.fillRect(TL_X + 1, y, Math.max(2, waitEnd - 1), barH);
        }
        ctx.fillStyle = KIT.border;
        ctx.fillRect(TL_X + waitEnd, y, workW, barH);
        const p = clamp((s.elapsed - wait) / work, 0, 1);
        ctx.fillStyle = p >= 1 ? KIT.success : KIT.guidance;
        ctx.fillRect(TL_X + waitEnd, y, workW * p, barH);
      });
      ctx.fillStyle = KIT.muted;
      ctx.font = '500 12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      laneRanks.forEach((r, i) => {
        ctx.fillText(String(r), TL_X - 6, TL_Y + i * laneH + laneH / 2 + 4);
      });
      ctx.textAlign = 'left';

      // ---- labels (max 2) + legend (max 3) --------------------------------
      dLabel(ctx, swizzleOn ? '有 swizzle' : '无 swizzle', 20, 30, swizzleOn ? KIT.success : KIT.failure);
      dLabel(ctx, `${n} 进程`, W - 20, 30, KIT.muted, 'right');
      dLegend(
        ctx,
        [
          { color: KIT.failure, text: '等待' },
          { color: KIT.success, text: '已就绪' },
        ],
        HEAT_X,
        LEGEND_Y
      );
    };

    // first frame at mount: never a blank box while off-screen
    renderPanel(lc, false, simRef.current, 0);
    renderPanel(rc, true, simRef.current, 0);
    left.classList.add('is-ready');
    right.classList.add('is-ready');

    const tick = (now: number): void => {
      const s = simRef.current;
      if (s.phase === 'running') {
        s.elapsed = Math.max(0, (now - s.startTime) / 1000);
        const span = totalSteps(s.rankCount) * step;
        if (s.elapsed >= span) {
          s.elapsed = span;
          s.phase = 'done';
          setPhase('done');
          setFeedback(FB_DONE);
        }
      }
      const t = now / 1000;
      renderPanel(lc, false, s, t);
      renderPanel(rc, true, s, t);

      const steps = s.elapsed / step;
      const leftDone = countTiles(steps, s.rankCount, false);
      const rightDone = countTiles(steps, s.rankCount, true);
      if (leftDone !== countRef.current.left || rightDone !== countRef.current.right) {
        countRef.current = { left: leftDone, right: rightDone };
        setCounts({ left: leftDone, right: rightDone });
      }

      if (!left.classList.contains('is-ready')) left.classList.add('is-ready');
      if (!right.classList.contains('is-ready')) right.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnectLeft = observeCanvas(left, start, stop);
    const disconnectRight = observeCanvas(right, start, stop);
    return () => {
      stop();
      disconnectLeft();
      disconnectRight();
    };
  }, []);

  const onStart = (): void => {
    const s = simRef.current;
    s.phase = 'running';
    s.startTime = performance.now();
    s.elapsed = 0;
    countRef.current = { left: 0, right: 0 };
    setPhase('running');
    setCounts({ left: 0, right: 0 });
    setFeedback(FB_RUNNING);
  };

  const onRankCount = (n: RankCount): void => {
    const s = simRef.current;
    s.rankCount = n;
    s.phase = 'idle';
    s.startTime = 0;
    s.elapsed = 0;
    countRef.current = { left: 0, right: 0 };
    setRankCount(n);
    setPhase('idle');
    setCounts({ left: 0, right: 0 });
    setFeedback(FB_IDLE);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        <div style={{ flex: '0 0 auto' }}>
          <canvas id={`cv-${chapterId}-${moduleId}-l`} ref={leftRef} width={W} height={H} />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <canvas id={`cv-${chapterId}-${moduleId}-r`} ref={rightRef} width={W} height={H} />
        </div>
      </div>
      <div className="ctrl">
        <button type="button" className="chip" onClick={onStart} disabled={phase === 'running'}>
          {phase === 'done' ? '再对比一次' : '开始对比'}
        </button>
        <button
          type="button"
          className={`chip${rankCount === 8 ? ' selected' : ''}`}
          aria-pressed={rankCount === 8}
          onClick={() => onRankCount(8)}
        >
          8 进程
        </button>
        <button
          type="button"
          className={`chip${rankCount === 16 ? ' selected' : ''}`}
          aria-pressed={rankCount === 16}
          onClick={() => onRankCount(16)}
        >
          16 进程
        </button>
        <label>
          完成砖数 无 swizzle <span className="val">{counts.left}</span> / 有 swizzle{' '}
          <span className="val">{counts.right}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M31SwizzleCompare;
