import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  KIT,
  dTileGround,
  dTile,
  dRule,
  dHand,
  dBucket,
  dLabel,
  dLegend,
  type TileState,
} from './ditron-theme-kit';

// §4 module 4.1 — non-divisible shapes. N is cut into ⌈N / B⌉ tiles; when N is not a
// multiple of B the last tile is narrower (裁边砖) and process boundaries can land
// inside a tile (跨 rank 砖). The paper's move is to permute those cross-rank tiles to
// the far left so they are computed and transferred first.

const W = 1080;
const H = 280;
const STRIP_X = 48;
const STRIP_Y = 150;
const STRIP_W = 984;
const STRIP_H = 56;
const RULER_Y = 236;
const N_MIN = 1000;
const N_MAX = 8192;

type BlockSize = 128 | 256;
type RankCount = 8 | 16 | 32;
type Layout = 'original' | 'permuted';

interface Sim {
  seqLen: number;
  blockSize: BlockSize;
  rankCount: RankCount;
  layout: Layout;
  dragX: number | null;
  dragging: boolean;
  /** performance.now() deadline of the one-shot emphasis pulse after a permutation */
  emphasisUntil: number;
}

interface Feedback {
  text: string;
  cls: string;
}

interface StripMetrics {
  tileCount: number;
  gap: number;
  cellW: number;
  edgeW: number;
  edgeIndex: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const rest = x % y;
    x = y;
    y = rest;
  }
  return x === 0 ? 1 : x;
}

/** Tile geometry of the strip: shared by the renderer and by the drag hit test. */
function stripMetrics(seqLen: number, blockSize: BlockSize, layout: Layout): StripMetrics {
  const tileCount = Math.ceil(seqLen / blockSize);
  const gap = tileCount > 32 ? 1 : tileCount > 16 ? 2 : 4;
  const cellW = (STRIP_W - (tileCount - 1) * gap) / tileCount;
  const remainder = seqLen % blockSize;
  const edgeW = remainder === 0 ? cellW : Math.max(8, cellW * (remainder / blockSize));
  return { tileCount, gap, cellW, edgeW, edgeIndex: layout === 'permuted' ? 0 : tileCount - 1 };
}

interface BoundaryMark {
  /** boundary position in tile units (element-level split of the dimension) */
  pos: number;
  /** how deep the boundary sits inside its tile, 0 < depth <= 0.5 */
  depth: number;
}

/** Process boundaries expressed in tile units; only the ones inside a tile qualify. */
function boundaryMarks(seqLen: number, blockSize: BlockSize, rankCount: RankCount): BoundaryMark[] {
  const tileCount = Math.ceil(seqLen / blockSize);
  const marks: BoundaryMark[] = [];
  for (let k = 1; k < rankCount; k += 1) {
    const pos = (k * seqLen) / (rankCount * blockSize);
    if (pos <= 0 || pos >= tileCount) continue;
    const frac = pos - Math.floor(pos);
    if (frac > 0.02 && frac < 0.98) marks.push({ pos, depth: Math.min(frac, 1 - frac) });
  }
  return marks;
}

/** 跨 rank 边界数（示意）：由切分规则推导；论文只给 8/16/32 GPU 的图，未给出数值。 */
function crossRankCount(seqLen: number, blockSize: BlockSize, rankCount: RankCount): number {
  if (seqLen % blockSize === 0) return 0;
  const span = blockSize / gcd(seqLen, blockSize);
  const limit = rankCount - 1 - Math.floor((rankCount - 1) / span);
  return Math.min(limit, boundaryMarks(seqLen, blockSize, rankCount).length);
}

function feedbackFor(seqLen: number, blockSize: BlockSize, layout: Layout): Feedback {
  const remainder = seqLen % blockSize;
  if (remainder === 0) {
    return {
      text: `N=${seqLen} 恰好被 B=${blockSize} 整除，没有裁边砖，也没有跨 rank 砖。`,
      cls: 'good',
    };
  }
  if (layout === 'permuted') {
    return {
      text: '跨界砖已排到最左侧，会最先被计算、最先被传输；论文对 8/16/32 GPU 都给出这种排法（论文只给图，未给数值）。',
      cls: '',
    };
  }
  return {
    text: `N=${seqLen} 不能被 B=${blockSize} 整除，余数 ${remainder}：末砖只有 ${remainder} 宽，且跨 rank 共用，排在最后会拖慢长途通信。`,
    cls: 'bad',
  };
}

export const M41TileSplit: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const simRef = useRef<Sim>({
    seqLen: 1024,
    blockSize: 256,
    rankCount: 8,
    layout: 'original',
    dragX: null,
    dragging: false,
    emphasisUntil: 0,
  });

  const [seqLen, setSeqLen] = useState(1024);
  const [blockSize, setBlockSize] = useState<BlockSize>(256);
  const [rankCount, setRankCount] = useState<RankCount>(8);
  const [layout, setLayout] = useState<Layout>('original');
  const [dragging, setDragging] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor(1024, 256, 'original'));

  const tileCount = Math.ceil(seqLen / blockSize);
  const remainder = seqLen % blockSize;
  const isPerfect = remainder === 0;
  const crossRankTiles = crossRankCount(seqLen, blockSize, rankCount);
  const canDrag = !isPerfect && layout === 'original';

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

    /** One strip tile: dTile scaled horizontally so a tile can be as wide as the strip. */
    const drawRectTile = (
      x: number,
      y: number,
      w: number,
      h: number,
      state: TileState,
      t: number
    ): void => {
      c.save();
      c.translate(x, y);
      c.scale(w / h, 1);
      dTile(c, 0, 0, h, state, t);
      c.restore();
    };

    const render = (s: Sim, t: number): void => {
      const m = stripMetrics(s.seqLen, s.blockSize, s.layout);
      const rem = s.seqLen % s.blockSize;
      const perfect = rem === 0;
      const crossRank = crossRankCount(s.seqLen, s.blockSize, s.rankCount);
      const pulsing = s.emphasisUntil > performance.now();

      dTileGround(c, W, H);

      // ---- upper-left: the hand with the cutting knife, held above the strip --
      dRule(c, 56, 118, 344, 118, KIT.support);
      const drop = perfect ? 0 : 10 + 26 * (rem / s.blockSize);
      dHand(c, 196, 88 + drop, t, perfect ? KIT.muted : KIT.support);
      dBucket(c, 318, 136);

      // ---- the tile strip -----------------------------------------------------
      for (let i = 0; i < m.tileCount; i += 1) {
        const isEdge = !perfect && i === m.edgeIndex;
        const w = isEdge ? m.edgeW : m.cellW;
        const x = STRIP_X + i * (m.cellW + m.gap);
        drawRectTile(x, STRIP_Y, w, STRIP_H, isEdge ? 'current' : 'idle', t);
        if (isEdge && s.layout === 'permuted') {
          c.strokeStyle = KIT.emphasis;
          c.lineWidth = pulsing ? 5 : 3;
          c.strokeRect(x - 2, STRIP_Y - 2, w + 4, STRIP_H + 4);
        }
      }
      c.strokeStyle = KIT.border;
      c.lineWidth = 1;
      c.strokeRect(STRIP_X - 4, STRIP_Y - 4, STRIP_W + 8, STRIP_H + 8);

      // ---- process boundaries: the ones that cut through a tile are marked ----
      boundaryMarks(s.seqLen, s.blockSize, s.rankCount)
        .sort((a, b) => b.depth - a.depth)
        .slice(0, crossRank)
        .forEach((cut) => {
          const tileIdx = Math.floor(cut.pos);
          const inner = cut.pos - tileIdx;
          const x = STRIP_X + tileIdx * (m.cellW + m.gap) + inner * m.cellW;
          dRule(c, x, STRIP_Y - 12, x, STRIP_Y + STRIP_H + 12, KIT.support);
          c.fillStyle = KIT.failure;
          c.beginPath();
          c.arc(x, STRIP_Y + STRIP_H / 2, 3, 0, Math.PI * 2);
          c.fill();
        });

      // ---- drag reference line ------------------------------------------------
      if (s.dragging && s.dragX !== null) {
        c.strokeStyle = KIT.emphasis;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(s.dragX, STRIP_Y - 18);
        c.lineTo(s.dragX, STRIP_Y + STRIP_H + 18);
        c.stroke();
      }

      // ---- ruler under the strip (bare ticks, no numbers) ---------------------
      c.strokeStyle = KIT.border;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(STRIP_X, RULER_Y);
      c.lineTo(STRIP_X + STRIP_W, RULER_Y);
      c.stroke();
      for (let i = 0; i <= m.tileCount; i += 1) {
        const x = STRIP_X + i * (m.cellW + m.gap) - m.gap / 2;
        c.beginPath();
        c.moveTo(x, RULER_Y);
        c.lineTo(x, RULER_Y + (i % 4 === 0 ? 12 : 7));
        c.stroke();
      }

      // ---- labels (max 2) + legend (max 3) -----------------------------------
      dLabel(c, `N ${s.seqLen}`, 360, 34, KIT.text);
      dLabel(c, `B ${s.blockSize}`, 520, 34, KIT.muted);
      dLegend(
        c,
        [
          { color: KIT.tileFace, text: '齐全砖' },
          { color: KIT.emphasis, text: '裁边砖' },
          { color: KIT.failure, text: '跨 rank' },
        ],
        STRIP_X,
        226
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(simRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (now: number): void => {
      render(simRef.current, now / 1000);
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

  const toIntrinsicX = (e: React.PointerEvent<HTMLCanvasElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    return ((e.clientX - rect.left) * W) / rect.width;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const s = simRef.current;
    if (s.layout !== 'original' || s.seqLen % s.blockSize === 0) return;
    const m = stripMetrics(s.seqLen, s.blockSize, s.layout);
    const edgeX = STRIP_X + m.edgeIndex * (m.cellW + m.gap);
    const x = toIntrinsicX(e);
    if (x < edgeX - 10 || x > edgeX + m.edgeW + 10) return;
    s.dragging = true;
    s.dragX = x;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const s = simRef.current;
    if (!s.dragging) return;
    const x = clamp(toIntrinsicX(e), STRIP_X, STRIP_X + STRIP_W);
    s.dragX = x;
    if (x < STRIP_X + STRIP_W / 2) {
      s.layout = 'permuted';
      s.dragging = false;
      s.dragX = null;
      s.emphasisUntil = performance.now() + 400;
      setLayout('permuted');
      setDragging(false);
      setFeedback(feedbackFor(s.seqLen, s.blockSize, 'permuted'));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const s = simRef.current;
    if (!s.dragging) return;
    s.dragging = false;
    s.dragX = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onSeqLen = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = Math.round(clamp(Number(e.target.value), N_MIN, N_MAX));
    const s = simRef.current;
    s.seqLen = v;
    setSeqLen(v);
    setFeedback(feedbackFor(v, s.blockSize, s.layout));
  };

  const onBlockSize = (b: BlockSize): void => {
    const s = simRef.current;
    s.blockSize = b;
    s.layout = 'original';
    setBlockSize(b);
    setLayout('original');
    setFeedback(feedbackFor(s.seqLen, b, 'original'));
  };

  const onRankCount = (n: RankCount): void => {
    const s = simRef.current;
    s.rankCount = n;
    s.layout = 'original';
    setRankCount(n);
    setLayout('original');
    setFeedback(feedbackFor(s.seqLen, s.blockSize, 'original'));
  };

  const onPermute = (): void => {
    const s = simRef.current;
    s.layout = 'permuted';
    s.dragging = false;
    s.dragX = null;
    s.emphasisUntil = performance.now() + 400;
    setLayout('permuted');
    setDragging(false);
    setFeedback(feedbackFor(s.seqLen, s.blockSize, 'permuted'));
  };

  const onReset = (): void => {
    const s = simRef.current;
    s.layout = 'original';
    s.dragging = false;
    s.dragX = null;
    setLayout('original');
    setDragging(false);
    setFeedback(feedbackFor(s.seqLen, s.blockSize, 'original'));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: canDrag ? (dragging ? 'grabbing' : 'grab') : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label>
          序列长度 N <span className="val">{seqLen}</span>
        </label>
        <input type="range" min={N_MIN} max={N_MAX} step={1} value={seqLen} onChange={onSeqLen} />
        <label>
          tile 数 <span className="val">{tileCount}</span>
        </label>
        <label>
          余数 r <span className="val">{remainder}</span>
        </label>
        <label>
          跨 rank 边界（示意） <span className="val">{crossRankTiles}</span>
        </label>
      </div>
      <div className="chip-row">
        <button
          type="button"
          className={`chip${blockSize === 128 ? ' selected' : ''}`}
          aria-pressed={blockSize === 128}
          onClick={() => onBlockSize(128)}
        >
          砖边长 B = 128
        </button>
        <button
          type="button"
          className={`chip${blockSize === 256 ? ' selected' : ''}`}
          aria-pressed={blockSize === 256}
          onClick={() => onBlockSize(256)}
        >
          砖边长 B = 256
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
        <button
          type="button"
          className={`chip${rankCount === 32 ? ' selected' : ''}`}
          aria-pressed={rankCount === 32}
          onClick={() => onRankCount(32)}
        >
          32 进程
        </button>
        <button
          type="button"
          className="tiny"
          onClick={onPermute}
          disabled={isPerfect || layout === 'permuted'}
        >
          把边砖排到最左
        </button>
        <button type="button" className="tiny ghost" onClick={onReset} disabled={layout === 'original'}>
          复原
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41TileSplit;
