import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  KIT,
  dTileGround,
  dGrid,
  dTile,
  dHand,
  dRule,
  dBucket,
  dTimeline,
  dLabel,
  dLegend,
} from './ditron-theme-kit';
import type { TileState } from './ditron-theme-kit';

// §7 Module 7.1 — three low-level optimisation switches + a straggler slider.
// Life metaphor: one hand lays a 12 × 2 course of tiles. With the D2D copy fusion
// switched off the hand stalls every third tile (red: launch jitter / late ranks);
// with all three optimisations on and no process behind, the pass becomes one
// deterministic, continuous green band. The two numbers in the detail region are
// relative illustration values derived from the switch state (the paper publishes
// no per-optimisation ablation), so they are labelled 相对示意 and are never
// presented as paper results.

const W = 1080;
const H = 280;
const COLS = 12;
const ROWS = 2;
const TILE_COUNT = COLS * ROWS;
const CELL = 60;
const GRID_X = 76;
const GRID_Y = 64;
const PAUSE_EVERY = 3;
const PAUSE_SECONDS = 0.4;
const REDUCED_PAUSE_SECONDS = 0.15;
const LL_PREFIX_PX = 14;
const BAND_Y = 232;
const BAND_H = 26;

interface OptState {
  optsLL: boolean;
  optsD2D: boolean;
  optsPCIe: boolean;
  straggler: number;
}

interface Derived {
  enabledCount: number;
  jitter: number;
  bandwidth: number;
}

interface Pass {
  laid: number;
  currentIndex: number;
  inPause: boolean;
  pausePhase: number;
  tilePhase: number;
}

type OptKey = 'optsLL' | 'optsD2D' | 'optsPCIe';

const CHIPS: { key: OptKey; label: string }[] = [
  { key: 'optsLL', label: '低延迟协议（LL）' },
  { key: 'optsD2D', label: 'D2D 拷贝融合' },
  { key: 'optsPCIe', label: 'PCIe 软件屏障' },
];

/** The two detail numbers are relative illustration values (0–3 switches, 0–3 late ranks). */
function derive(s: OptState): Derived {
  const enabledCount = (s.optsLL ? 1 : 0) + (s.optsD2D ? 1 : 0) + (s.optsPCIe ? 1 : 0);
  const jitter = clamp(4 + 4 * (3 - enabledCount) + 2 * s.straggler, 4, 24);
  const bandwidth = clamp(62 + 9 * enabledCount - 6 * s.straggler, 40, 96);
  return { enabledCount, jitter, bandwidth };
}

function feedbackFor(s: OptState, d: Derived): { text: string; cls: string } {
  if (d.enabledCount === 0) {
    return {
      text: '三项低层优化都关闭：经驱动或框架 API 的离散 D2D 拷贝带来启动抖动，铺砖节奏忽快忽慢，重叠的收益被吃掉。',
      cls: 'bad',
    };
  }
  if (d.enabledCount === 3 && s.straggler === 0) {
    return {
      text: '三项优化全部启用且没有进程落后：拷贝融合消除了驱动开销，节奏连续，抖动最小。',
      cls: 'good',
    };
  }
  if (d.enabledCount === 3) {
    return {
      text: `三项优化全部启用，但仍有 ${s.straggler} 个进程迟到，节奏带里还有可见停顿。`,
      cls: '',
    };
  }
  return {
    text: `已启用 ${d.enabledCount} 项优化：拷贝被融合进核内、资源调度变得确定，抖动在减小，但仍有 ${s.straggler} 个进程落后。`,
    cls: '',
  };
}

function pauseSeconds(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return PAUSE_SECONDS;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? REDUCED_PAUSE_SECONDS
    : PAUSE_SECONDS;
}

function unitSeconds(jitter: number): number {
  return 0.07 + 0.002 * jitter;
}

/** Deterministic per-tile wobble of ± jitter/4 px — a moving seam, never a flicker. */
function tileWobble(i: number, jitter: number): { dx: number; dy: number } {
  const r1 = Math.sin((i + 1) * 12.9898) * 43758.5453;
  const r2 = Math.sin((i + 1) * 78.233) * 12345.6789;
  const f1 = r1 - Math.floor(r1);
  const f2 = r2 - Math.floor(r2);
  return { dx: (f1 - 0.5) * jitter * 0.5, dy: (f2 - 0.5) * jitter * 0.5 };
}

/** Where the pass stands right now: laid tiles, the tile in hand, and any stall. */
function walkPass(s: OptState, jitter: number, time: number): Pass {
  const unit = unitSeconds(jitter);
  const pause = s.optsD2D ? 0 : pauseSeconds();
  const pauseGroups = s.optsD2D ? 0 : Math.floor((TILE_COUNT - 1) / PAUSE_EVERY);
  const pass = TILE_COUNT * unit + pauseGroups * pause;
  let rest = pass > 0 ? time % pass : 0;
  let laid = 0;
  for (let i = 0; i < TILE_COUNT; i += 1) {
    if (rest < unit) {
      return { laid, currentIndex: i, inPause: false, pausePhase: 0, tilePhase: rest / unit };
    }
    rest -= unit;
    laid = i + 1;
    if (!s.optsD2D && laid % PAUSE_EVERY === 0 && i < TILE_COUNT - 1) {
      if (rest < pause) {
        return {
          laid,
          currentIndex: i + 1,
          inPause: true,
          pausePhase: pause > 0 ? rest / pause : 1,
          tilePhase: 1,
        };
      }
      rest -= pause;
    }
  }
  return { laid: TILE_COUNT, currentIndex: TILE_COUNT - 1, inPause: false, pausePhase: 0, tilePhase: 1 };
}

export const M71LowLevelOpts: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OptState>({
    optsLL: false,
    optsD2D: false,
    optsPCIe: false,
    straggler: 1,
  });
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<OptState>(stateRef.current);

  const derived = derive(state);
  const fb = feedbackFor(state, derived);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: OptState, time: number): void => {
      const d = derive(s);
      const p = walkPass(s, d.jitter, time);
      const seam = d.jitter * 0.5;

      dTileGround(ctx, W, H);
      dRule(ctx, 64, 206, 1016, 206, KIT.support);

      // Base course: every slot is visible at the current seam pitch.
      dGrid(ctx, GRID_X, GRID_Y, COLS, ROWS, CELL, { gap: seam, frame: false }, time);

      // Laid tiles carry the seam jitter; with the LL protocol on, the first tile
      // of every group is laid noticeably earlier (blue prefix outline).
      for (let i = 0; i < p.laid && i < TILE_COUNT; i += 1) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const wob = tileWobble(i, d.jitter);
        const x = GRID_X + col * (CELL + seam) + wob.dx;
        const y = GRID_Y + row * (CELL + seam) + wob.dy;
        dTile(ctx, x, y, CELL, 'done', time);
        if (s.optsLL && i % PAUSE_EVERY === 0) {
          ctx.strokeStyle = KIT.guidance;
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 3, y - 3, CELL + 6, CELL + 6);
        }
      }

      // The tile in hand: red while the discrete copy stalls the pass.
      const inHand = p.currentIndex < TILE_COUNT && p.laid < TILE_COUNT;
      const curCol = clamp(p.currentIndex % COLS, 0, COLS - 1);
      const curRow = clamp(Math.floor(p.currentIndex / COLS), 0, ROWS - 1);
      const curX = GRID_X + curCol * (CELL + seam);
      const curY = GRID_Y + curRow * (CELL + seam);
      const handState: TileState = p.inPause ? 'blocked' : 'current';
      if (inHand) {
        dTile(ctx, curX, curY, CELL, handState, time);
      }

      const lift = p.inPause ? 12 : 0;
      const shake = p.inPause ? Math.sin(time * 18) * (d.jitter / 24) * 3 : 0;
      const approach = s.optsD2D ? easeOutCubic(clamp(p.tilePhase, 0, 1)) : 1;
      dHand(
        ctx,
        curX - 30 + shake,
        curY + CELL / 2 - lift - (1 - approach) * 14,
        time,
        p.inPause ? KIT.failure : KIT.text
      );

      dBucket(ctx, 100, 262);
      const mortar = d.enabledCount * 4;
      if (mortar > 0) {
        ctx.fillStyle = KIT.mortar;
        ctx.fillRect(89, 246 - mortar, 22, mortar);
      }

      // Rhythm band: one continuous green band, with a red stall after every third
      // tile as long as the D2D copy fusion is off. Stall length grows with jitter.
      dTimeline(ctx, 48, 226, 984, 38, 1);
      if (s.optsPCIe) dRule(ctx, 48, 264, 1032, 264, KIT.support);
      const pauseSlots = s.optsD2D ? 0 : (d.jitter / 24) * 2;
      const pauseGroups = s.optsD2D ? 0 : Math.floor((TILE_COUNT - 1) / PAUSE_EVERY);
      const slotW = 984 / (TILE_COUNT + pauseGroups * pauseSlots);
      let bx = 48;
      for (let i = 0; i < TILE_COUNT; i += 1) {
        ctx.fillStyle = KIT.success;
        ctx.fillRect(bx, BAND_Y, slotW, BAND_H);
        bx += slotW;
        if (!s.optsD2D && (i + 1) % PAUSE_EVERY === 0 && i < TILE_COUNT - 1) {
          if (s.optsLL) {
            ctx.fillStyle = KIT.guidance;
            ctx.fillRect(bx - LL_PREFIX_PX, BAND_Y, LL_PREFIX_PX, BAND_H);
          }
          ctx.fillStyle = KIT.failure;
          ctx.fillRect(bx, BAND_Y, slotW * pauseSlots, BAND_H);
          bx += slotW * pauseSlots;
        }
      }

      dLabel(ctx, `抖动 ${d.jitter}`, 76, 48, KIT.text);
      dLabel(ctx, `带宽 ${d.bandwidth}`, 250, 48, KIT.text);
      dLegend(
        ctx,
        [
          { color: KIT.success, text: '连续' },
          { color: KIT.failure, text: '停顿' },
        ],
        700,
        274
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      render(stateRef.current, (now - t0) / 1000);
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

  const onToggle = (key: OptKey) => (): void => {
    const cur = stateRef.current;
    const next: OptState = {
      optsLL: key === 'optsLL' ? !cur.optsLL : cur.optsLL,
      optsD2D: key === 'optsD2D' ? !cur.optsD2D : cur.optsD2D,
      optsPCIe: key === 'optsPCIe' ? !cur.optsPCIe : cur.optsPCIe,
      straggler: cur.straggler,
    };
    stateRef.current = next;
    setState(next);
  };

  const onStraggler = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const next: OptState = { ...stateRef.current, straggler: Number(e.target.value) };
    stateRef.current = next;
    setState(next);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
      />
      <div className="chip-row">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={state[c.key] ? 'chip selected' : 'chip'}
            aria-pressed={state[c.key]}
            onClick={onToggle(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          迟到程度 <span className="val">{state.straggler}</span>
        </label>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={state.straggler}
          onChange={onStraggler}
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">有效带宽（相对示意）</div>
          <div className="v">{derived.bandwidth}</div>
        </div>
        <div className="metric">
          <div className="l">抖动幅度（相对示意）</div>
          <div className="v">{derived.jitter}</div>
        </div>
        <div className="metric">
          <div className="l">已启用优化</div>
          <div className="v">{derived.enabledCount} / 3</div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M71LowLevelOpts;
