import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 2.1 把每一片归到最像的图样（拖动探索）
// 主导操作：拖动片形标记靠近四张图样卡之一，松手后的落点决定归属。
// 即时反馈：四条相似度条、最像的卡的高亮描边、反馈句三者同帧更新。

const W = 1080;
const H = 280;
const CARD_NAMES = ['肿瘤区', '正常区', '透明细胞', '乳头状细胞'];
const NORMAL_X = [170, 350, 530, 710];
const NORMAL_Y = [67, 67, 67, 67];
const NARROW_X = [300, 620, 300, 620];
const NARROW_Y = [48, 48, 108, 108];
const PIECE_W = 62;
const PIECE_H = 54;
const START_X = 440;
const START_Y = 216;
const IDLE = { text: '还没比过，四条相似度都是空的。', cls: '' };

type M21State = {
  dragX: number;
  dragY: number;
  dropX: number;
  dragging: boolean;
  locked: boolean;
  compared: boolean;
  lockIdx: number;
  narrow: boolean;
};

type PieceOpts = {
  fill?: string;
  stroke?: string;
  lines?: number;
  lineColor?: string;
  lineWidth?: number;
  nub?: boolean;
  glow?: boolean;
};

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  const top = Math.round(h * 0.5);
  ctx.fillStyle = 'rgba(184, 201, 167, 0.42)';
  ctx.fillRect(0, top, w, h - top);
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, top + 0.5);
  ctx.lineTo(w, top + 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#b8c9a7';
  roundRectPath(ctx, x, y, w, h, Math.min(12, h / 2));
  ctx.fill();
  ctx.globalAlpha = Math.min(1, alpha + 0.35);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: PieceOpts = {}
) {
  const fill = opts.fill || '#dfe7d2';
  const stroke = opts.stroke || '#76906a';
  const lineColor = opts.lineColor || stroke;
  const lineWidth = opts.lineWidth || 2;
  const lines = opts.lines === undefined ? 2 : opts.lines;
  ctx.save();
  if (opts.glow) {
    ctx.shadowColor = 'rgba(34, 141, 92, 0.5)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = fill;
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= lines; i += 1) {
    const ly = y + (h * i) / (lines + 1);
    ctx.beginPath();
    ctx.moveTo(x + 7, ly);
    ctx.lineTo(x + w - 7, ly);
    ctx.stroke();
  }
  if (opts.nub !== false) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x + w, y + h / 2, 6, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawPieceBack(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#e7e9e3';
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = '#eef3e6';
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1.5;
  const limit = Math.min(w, h) / 2 - 4;
  for (let i = 1; i <= lines; i += 1) {
    const inset = 5 + i * 6;
    if (inset > limit) break;
    roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawJoint(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ok: boolean
) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.setLineDash(ok ? [] : [8, 6]);
  ctx.strokeStyle = ok ? '#228d5c' : '#c43f52';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(11, 11);
  ctx.lineTo(26, 26);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted?: boolean
) {
  ctx.save();
  ctx.fillStyle = muted ? '#68778f' : '#21324a';
  ctx.font = (muted ? '18px' : '22px') + ' "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; text: string }[],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (const item of items) {
    ctx.fillStyle = item.color;
    roundRectPath(ctx, cx, y - 12, 14, 14, 3);
    ctx.fill();
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#68778f';
    ctx.fillText(item.text, cx + 20, y);
    cx += 20 + ctx.measureText(item.text).width + 26;
  }
  ctx.restore();
}

const centersX = (narrow: boolean) => (narrow ? NARROW_X : NORMAL_X);
const centersY = (narrow: boolean) => (narrow ? NARROW_Y : NORMAL_Y);
const cardSize = (narrow: boolean) => (narrow ? { w: 190, h: 52 } : { w: 130, h: 86 });

const scoresFor = (x: number, narrow: boolean) =>
  centersX(narrow).map((c) => clamp(1 - Math.abs(x - c) / 260, 0, 1));

const argmaxOf = (scores: number[]) => {
  let best = 0;
  for (let i = 1; i < scores.length; i += 1) {
    if (scores[i] > scores[best]) best = i;
  }
  return best;
};

const snapPos = (idx: number, narrow: boolean) => ({
  x: centersX(narrow)[idx],
  y: narrow ? 200 : 136,
});

const feedbackFor = (x: number, narrow: boolean) => {
  const scores = scoresFor(x, narrow);
  const idx = argmaxOf(scores);
  const best = scores[idx];
  if (best < 0.45) return { text: '离哪张卡都远，这种块没有明确归属。', cls: 'bad' };
  if (best < 0.75) return { text: `归属是「${CARD_NAMES[idx]}」，但差距不大，容易误判。`, cls: '' };
  return { text: `这一片明确归到「${CARD_NAMES[idx]}」。`, cls: 'good' };
};

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<M21State>({
    dragX: START_X,
    dragY: START_Y,
    dropX: START_X,
    dragging: false,
    locked: false,
    compared: false,
    lockIdx: 0,
    narrow: false,
  });

  const [dragX, setDragX] = useState(START_X);
  const [dragY, setDragY] = useState(START_Y);
  const [dropX, setDropX] = useState(START_X);
  const [dragging, setDragging] = useState(false);
  const [locked, setLocked] = useState(false);
  const [compared, setCompared] = useState(false);
  const [lockIdx, setLockIdx] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const [feedback, setFeedback] = useState(IDLE);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: M21State) => {
      const xs = centersX(s.narrow);
      const ys = centersY(s.narrow);
      const size = cardSize(s.narrow);
      const scores = scoresFor(s.dropX, s.narrow);
      const hi = s.compared ? argmaxOf(scores) : -1;

      clearScene(ctx, W, H);
      drawBoard(ctx, 40, 150, 800, 100, 0.55);

      for (let i = 0; i < 4; i += 1) {
        drawCard(ctx, xs[i] - size.w / 2, ys[i] - size.h / 2, size.w, size.h, 3, '#76906a');
        ctx.save();
        ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = CARD_NAMES[i];
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = '#eef3e6';
        roundRectPath(ctx, xs[i] - tw / 2 - 7, ys[i] - 16, tw + 14, 32, 6);
        ctx.fill();
        ctx.fillStyle = '#21324a';
        ctx.fillText(label, xs[i], ys[i]);
        ctx.restore();
      }

      if (hi >= 0 && s.locked) {
        ctx.save();
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(xs[hi], ys[hi] + size.h / 2);
        ctx.lineTo(xs[hi], s.dragY - PIECE_H / 2);
        ctx.stroke();
        ctx.restore();
      }

      drawPiece(ctx, s.dragX - PIECE_W / 2, s.dragY - PIECE_H / 2, PIECE_W, PIECE_H, {
        fill: s.locked ? '#e4f1e6' : '#fbe6d8',
        stroke: s.locked ? '#228d5c' : '#f07e47',
        lines: 2,
        lineColor: s.locked ? '#228d5c' : '#92400e',
        lineWidth: s.locked ? 3 : 2,
        glow: s.locked,
      });

      for (let i = 0; i < 4; i += 1) {
        const yTop = 46 + i * 51;
        ctx.save();
        if (!s.compared) {
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = '#d7deea';
          ctx.lineWidth = 2;
          roundRectPath(ctx, 860, yTop, 144, 22, 5);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#d7deea';
          roundRectPath(ctx, 860, yTop, 144, 22, 5);
          ctx.fill();
          ctx.fillStyle = i === hi ? '#27446e' : '#b8c9a7';
          roundRectPath(ctx, 860, yTop, Math.max(3, scores[i] * 144), 22, 5);
          ctx.fill();
          ctx.fillStyle = i === hi ? '#21324a' : '#68778f';
          ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(scores[i].toFixed(2), 1012, yTop + 11);
        }
        ctx.restore();
      }

      if (hi >= 0) {
        ctx.save();
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 3;
        roundRectPath(
          ctx,
          xs[hi] - size.w / 2 - 4,
          ys[hi] - size.h / 2 - 4,
          size.w + 8,
          size.h + 8,
          12
        );
        ctx.stroke();
        ctx.restore();
      }

      drawSceneLabel(ctx, '图样卡', 24, 30, true);
      drawSceneLabel(ctx, '相似度', 862, 30, true);
      drawLegend(
        ctx,
        [
          { color: '#f07e47', text: '拖动片' },
          { color: '#27446e', text: '最像的卡' },
          { color: '#228d5c', text: '纹理对齐' },
        ],
        60,
        270
      );
    };

    const tick = () => {
      render(stateRef.current);
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

  useEffect(() => {
    const measure = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.getBoundingClientRect().width;
      const isNarrow = width > 0 && width < 760;
      const s = stateRef.current;
      if (s.narrow === isNarrow) return;
      s.narrow = isNarrow;
      setNarrow(isNarrow);
      if (s.compared) {
        s.lockIdx = argmaxOf(scoresFor(s.dropX, isNarrow));
        if (s.locked) {
          const target = snapPos(s.lockIdx, isNarrow);
          s.dragX = target.x;
          s.dragY = target.y;
          setDragX(target.x);
          setDragY(target.y);
        }
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const localPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = W / (rect.width || W);
    const sy = H / (rect.height || H);
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = localPoint(e);
    if (!p || p.y < 148) return;
    const s = stateRef.current;
    const x = clamp(p.x, 60, 820);
    const y = clamp(p.y, 180, 222);
    s.dragging = true;
    s.locked = false;
    s.compared = true;
    s.dragX = x;
    s.dragY = y;
    s.dropX = x;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 指针捕获不可用时仍可拖动，只是移出画面后不再跟随。
    }
    setDragging(true);
    setLocked(false);
    setCompared(true);
    setDragX(x);
    setDragY(y);
    setDropX(x);
    setFeedback(feedbackFor(x, s.narrow));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const p = localPoint(e);
    if (!p) return;
    const x = clamp(p.x, 60, 820);
    const y = clamp(p.y, 180, 222);
    s.dragX = x;
    s.dragY = y;
    s.dropX = x;
    setDragX(x);
    setDragY(y);
    setDropX(x);
    setFeedback(feedbackFor(x, s.narrow));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const p = localPoint(e);
    if (p) {
      s.dragX = clamp(p.x, 60, 820);
      s.dragY = clamp(p.y, 180, 222);
      s.dropX = s.dragX;
    }
    s.dragging = false;
    const fb = feedbackFor(s.dropX, s.narrow);
    const idx = argmaxOf(scoresFor(s.dropX, s.narrow));
    const target = snapPos(idx, s.narrow);
    s.locked = true;
    s.lockIdx = idx;
    s.dragX = target.x;
    s.dragY = target.y;
    setDragging(false);
    setLocked(true);
    setLockIdx(idx);
    setDragX(target.x);
    setDragY(target.y);
    setDropX(s.dropX);
    setFeedback(fb);
  };

  const navigate = (dir: number) => {
    const s = stateRef.current;
    const xs = centersX(s.narrow);
    const cur = s.compared ? argmaxOf(scoresFor(s.dropX, s.narrow)) : dir > 0 ? -1 : 4;
    const next = clamp(cur + dir, 0, 3);
    const target = snapPos(next, s.narrow);
    s.compared = true;
    s.locked = true;
    s.lockIdx = next;
    s.dropX = xs[next];
    s.dragX = target.x;
    s.dragY = target.y;
    setCompared(true);
    setLocked(true);
    setLockIdx(next);
    setDropX(xs[next]);
    setDragX(target.x);
    setDragY(target.y);
    setFeedback(feedbackFor(xs[next], s.narrow));
  };

  const reset = () => {
    const s = stateRef.current;
    s.dragging = false;
    s.locked = false;
    s.compared = false;
    s.lockIdx = 0;
    s.dragX = START_X;
    s.dragY = START_Y;
    s.dropX = START_X;
    setDragging(false);
    setLocked(false);
    setCompared(false);
    setLockIdx(0);
    setDragX(START_X);
    setDragY(START_Y);
    setDropX(START_X);
    setFeedback(IDLE);
  };

  const view = scoresFor(dropX, narrow);
  const viewIdx = argmaxOf(view);
  const viewBest = compared ? view[viewIdx] : null;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="chip-row">
        <button className="chip" onClick={() => navigate(-1)}>
          上一张卡
        </button>
        <button className="chip" onClick={() => navigate(1)}>
          下一张卡
        </button>
        <button className="chip" onClick={reset}>
          重来
        </button>
      </div>
      <div className="metrics">
        <span className="metric">
          最大相似度 <span className="val">{viewBest === null ? '—' : viewBest.toFixed(2)}</span>
        </span>
        <span className="metric">
          归属 <span className="val">{compared ? CARD_NAMES[viewIdx] : '—'}</span>
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M21;
