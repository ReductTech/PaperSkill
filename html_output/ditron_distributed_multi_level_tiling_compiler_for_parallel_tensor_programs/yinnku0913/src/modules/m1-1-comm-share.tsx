import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  KIT,
  dTileGround,
  dGrid,
  dHand,
  dRule,
  dBucket,
  dTimeline,
  dBar,
  dLabel,
  dLegend,
} from './ditron-theme-kit';

// §1 module 1.1 — one slider (「通信占比」) drives two linked views at once:
//   left  : the life metaphor — a hand laying tiles that stalls when the mortar is late
//   right : the technical timeline — compute / communication / stall on one serial axis
// The reference situation is a non-overlapping schedule (CuBLAS+NCCL-style): the
// iteration is T_compute + T_comm, so a higher communication share means more idle
// compute time. Only `commShare` moves any geometry; the clock only breathes.

const W = 1080;
const H = 280;

const COLS = 8;
const ROWS = 4;
const TILES = COLS * ROWS; // 32 tiles = the whole room
const CELL = 44;
const GAP = 2;
const GRID_X = 48;
const GRID_Y = 50;

// named canvas regions from the module spec
const LIFE = { x: 24, y: 32, w: 516, h: 216 };
const TECH = { x: 572, y: 32, w: 484, h: 216 };

const TL_X = TECH.x + 24; // 596
const TL_Y = TECH.y + 28; // 60
const TL_W = TECH.w - 48; // 436
const TL_H = 88;
const BAR_Y = TL_Y + TL_H + 40;
const BAR_W = TL_W - 44;

type Cls = '' | 'good' | 'bad';
type Phase = 'idle' | 'running';

interface CommState {
  commShare: number;
  phase: Phase;
}

/** Learner-facing tier of the communication share (20%–80% is the paper's quoted range). */
function tierColor(commShare: number): string {
  if (commShare > 50) return KIT.failure;
  if (commShare >= 20) return KIT.guidance;
  return KIT.success;
}

function feedbackFor(commShare: number): { text: string; cls: Cls } {
  if (commShare > 50) {
    return {
      text: `通信占比 ${commShare}%，空等明显：算力在等通信，端到端时间近似为计算加通信。`,
      cls: 'bad',
    };
  }
  if (commShare >= 20) {
    return {
      text: `通信占比 ${commShare}%，空等开始挤压有效算力，重叠的收益还没拿到。`,
      cls: '',
    };
  }
  return {
    text: `通信占比 ${commShare}%，通信几乎被计算盖住，空等很少。`,
    cls: 'good',
  };
}

export const M11CommShare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef(0);
  const stateRef = useRef<CommState>({ commShare: 45, phase: 'idle' });
  const [commShare, setCommShare] = useState(45);
  const [feedback, setFeedback] = useState<{ text: string; cls: Cls }>(feedbackFor(45));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // bare values only — never "值 = …" inside the Canvas
    const bare = (
      text: string,
      x: number,
      y: number,
      color: string,
      align: CanvasTextAlign = 'left'
    ) => {
      ctx.fillStyle = color;
      ctx.font = '600 14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
      ctx.textAlign = 'left';
    };

    const render = (state: CommState, time: number) => {
      const stallFrac = clamp((state.commShare - 20) / 60, 0, 1);
      const doneTiles = Math.floor(TILES * (1 - stallFrac));
      const stallTiles = TILES - doneTiles;
      const handLift = 6 + 14 * stallFrac;
      const tier = tierColor(state.commShare);
      const computeShare = 100 - state.commShare;
      const scale = TL_W / 100;

      dTileGround(ctx, W, H);

      // ---- life panel: the hand lays tiles until the mortar stops arriving ----
      dRule(ctx, LIFE.x + 12, LIFE.y + LIFE.h - 8, LIFE.x + LIFE.w - 12, LIFE.y + LIFE.h - 8, KIT.support);
      dGrid(
        ctx,
        GRID_X,
        GRID_Y,
        COLS,
        ROWS,
        CELL,
        {
          gap: GAP,
          stateAt: (col, row) => (row * COLS + col < TILES - stallTiles ? 'done' : 'blocked'),
        },
        time
      );

      const gapIndex = Math.min(doneTiles, TILES - 1);
      const gapCol = gapIndex % COLS;
      const gapRow = Math.floor(gapIndex / COLS);
      const handX = GRID_X + gapCol * (CELL + GAP) + CELL / 2;
      const handY = GRID_Y + gapRow * (CELL + GAP) - handLift - 16;
      // breathing bob only: 3.2 s period while idle, it never moves a single tile
      dHand(ctx, handX, handY, state.phase === 'idle' ? time * 0.9 : time * 2, tier);
      dBucket(ctx, LIFE.x + LIFE.w - 30, LIFE.y + LIFE.h - 8);
      dLabel(ctx, '已铺', GRID_X, GRID_Y - 12, KIT.text);

      // ---- technical panel: serial compute / communication / stall -----------
      const laneH = dTimeline(ctx, TL_X, TL_Y, TL_W, TL_H, 2);
      const pad = 5;
      const segH = laneH - pad * 2;
      const computeW = computeShare * scale;
      const commW = state.commShare * scale;
      const stallW = stallFrac * state.commShare * scale;

      dBar(ctx, TL_X, TL_Y + pad, computeW, segH, 1, KIT.guidance);
      if (stallW > 0) {
        dBar(ctx, TL_X + computeW, TL_Y + pad, stallW, segH, 1, KIT.failure);
      }
      dBar(ctx, TL_X + computeW, TL_Y + laneH + pad, commW, segH, 1, KIT.auxiliary);

      dLabel(ctx, '空等', TL_X, BAR_Y - 10, tier);
      dBar(ctx, TL_X, BAR_Y, BAR_W, 22, stallFrac, tier);
      bare(`${Math.round(stallFrac * 100)}%`, TL_X + TL_W, BAR_Y + 16, KIT.muted, 'right');

      dLegend(
        ctx,
        [
          { color: KIT.guidance, text: '计算' },
          { color: KIT.auxiliary, text: '通信' },
          { color: KIT.failure, text: '空等' },
        ],
        LIFE.x,
        LIFE.y + LIFE.h + 18
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (now: number) => {
      if (!t0Ref.current) t0Ref.current = now;
      render(stateRef.current, (now - t0Ref.current) / 1000);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    stateRef.current.commShare = next;
    setCommShare(next);
    setFeedback(feedbackFor(next));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          通信占比 <span className="val">{commShare}%</span>
        </label>
        <input type="range" min={0} max={80} step={5} value={commShare} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M11CommShare;
