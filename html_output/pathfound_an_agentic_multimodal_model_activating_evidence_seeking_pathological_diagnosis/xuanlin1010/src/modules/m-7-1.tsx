import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 答对了，排在第几位：在六个候选位上拖动橙色标记，改变正确诊断的位置；
// 每格的排序分、奖励条与数值随位置实时变化；格式芯片把整条奖励压到负值。

const W = 1080;
const H = 280;

const CELL_W = 106;
const CELL_H = 64;
const CELL_GAP = 8;
const CELL_X0 = 24;
const CELL_Y = 118;
const CELL_STEP = CELL_W + CELL_GAP;

const ALPHA = 2;
const N = 6;

let denom = 0;
for (let j = 0; j < N; j += 1) denom += Math.exp(-j / ALPHA);
const DENOM = denom;
const RD0 = 1 / DENOM;

const rdAt = (rank: number) => Math.exp(-(rank - 1) / ALPHA) / DENOM;

const BAR0_X = 898;
const BAR_PX_PER_UNIT = 236.7;
const barX = (v: number) => BAR0_X + v * BAR_PX_PER_UNIT;

type Ctx = CanvasRenderingContext2D;

const COL = {
  bg: '#f5f8f0',
  board: '#b8c9a7',
  boardDeep: '#76906a',
  wood: '#92400e',
  guide: '#27446e',
  good: '#228d5c',
  bad: '#c43f52',
  warm: '#f07e47',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  edge: '#d7deea',
  face: '#ffffff',
};

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, w, h);
}

function drawBoard(ctx: Ctx, x: number, y: number, w: number, h: number, alpha = 0.35) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COL.board;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COL.boardDeep;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
}

interface PieceOpts {
  fill?: string;
  edge?: string;
  texture?: string;
  lines?: number;
  nub?: boolean;
  alpha?: number;
}

function drawPiece(ctx: Ctx, x: number, y: number, w: number, h: number, opts: PieceOpts = {}) {
  const fill = opts.fill ?? COL.face;
  const edge = opts.edge ?? COL.edge;
  const lines = opts.lines ?? 2;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.strokeStyle = opts.texture ?? COL.boardDeep;
  ctx.lineWidth = 1;
  for (let i = 1; i <= lines; i += 1) {
    const yy = y + (h * i) / (lines + 1);
    ctx.beginPath();
    ctx.moveTo(x + 7, yy);
    ctx.lineTo(x + w - 7, yy);
    ctx.stroke();
  }
  if (opts.nub !== false) {
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.arc(x + w - 8, y + h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPieceBack(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#eef1ea';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = COL.edge;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.restore();
}

function drawCard(ctx: Ctx, x: number, y: number, w: number, h: number, lines: number, color: string) {
  ctx.save();
  ctx.fillStyle = COL.face;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w - 12, y);
  ctx.lineTo(x + w, y + 12);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  const cx = x + w / 2;
  const cy = y + h / 2;
  for (let i = 1; i <= lines; i += 1) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, (w / 2.7) * (i / lines), (h / 2.7) * (i / lines), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawJoint(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, ok: boolean) {
  ctx.save();
  ctx.strokeStyle = ok ? COL.good : COL.bad;
  ctx.lineWidth = 3;
  if (!ok) ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawNeedle(ctx: Ctx, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = COL.wood;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();
  ctx.strokeStyle = COL.guide;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(ctx: Ctx, text: string, x: number, y: number, muted = false) {
  ctx.save();
  ctx.fillStyle = muted ? COL.muted : COL.text;
  ctx.font = muted
    ? '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    : '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(ctx: Ctx, items: { label: string; color: string }[], x: number, y: number) {
  ctx.save();
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    roundRect(ctx, cx, y - 7, 14, 14, 4);
    ctx.fill();
    ctx.fillStyle = COL.muted;
    ctx.fillText(it.label, cx + 20, y + 1);
    cx += 20 + ctx.measureText(it.label).width + 22;
  });
  ctx.restore();
}

export const M71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ pos: number; fmtBad: boolean }>({ pos: 1, fmtBad: false });
  const dragRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [pos, setPos] = useState(1);
  const [fmtBad, setFmtBad] = useState(false);
  const [feedback, setFeedback] = useState({ text: '排在第一位：奖励最高。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const paint = () => {
      const st = stateRef.current;
      const p = clamp(Math.round(st.pos), 1, N);
      const rd = rdAt(p);
      const reward = st.fmtBad ? -0.5 : rd + 0.1;
      clearScene(ctx, W, H);
      drawBoard(ctx, 12, 60, 700, 190, 0.26);

      // 六格候选列表
      for (let i = 0; i < N; i += 1) {
        const x = CELL_X0 + i * CELL_STEP;
        const isRight = i === p - 1;
        if (isRight) {
          ctx.fillStyle = COL.good;
          roundRect(ctx, x, CELL_Y, CELL_W, CELL_H, 8);
          ctx.fill();
          ctx.strokeStyle = COL.good;
        } else {
          ctx.fillStyle = COL.face;
          roundRect(ctx, x, CELL_Y, CELL_W, CELL_H, 8);
          ctx.fill();
          ctx.strokeStyle = COL.guide;
        }
        ctx.lineWidth = 2;
        roundRect(ctx, x, CELL_Y, CELL_W, CELL_H, 8);
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = isRight ? '#ffffff' : COL.muted;
        ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), x + CELL_W / 2, CELL_Y + CELL_H / 2);
        ctx.restore();

        // 每格的排序分小条
        const w = (rdAt(i + 1) / RD0) * (CELL_W - 24);
        ctx.fillStyle = COL.aux;
        roundRect(ctx, x + 12, 194, Math.max(3, w), 8, 4);
        ctx.fill();
      }

      // 橙色标记：指向正确诊断所在的那一格
      const cx = CELL_X0 + (p - 1) * CELL_STEP + CELL_W / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 11, 98);
      ctx.lineTo(cx + 11, 98);
      ctx.lineTo(cx, 114);
      ctx.closePath();
      ctx.fillStyle = COL.warm;
      ctx.fill();
      ctx.strokeStyle = COL.text;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 奖励条：正段绿、负段红
      ctx.strokeStyle = COL.edge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(748, 170);
      ctx.lineTo(1050, 170);
      ctx.stroke();
      const xv = barX(reward);
      ctx.fillStyle = reward >= 0 ? COL.good : COL.bad;
      roundRect(ctx, Math.min(BAR0_X, xv), 157, Math.max(3, Math.abs(xv - BAR0_X)), 26, 6);
      ctx.fill();
      ctx.save();
      ctx.fillStyle = COL.muted;
      ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      [-0.5, 0, 0.5].forEach((v) => {
        ctx.fillText(String(v), barX(v), 198);
      });
      ctx.restore();
      ctx.save();
      ctx.fillStyle = COL.text;
      ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(reward.toFixed(3), (BAR0_X + xv) / 2, 148);
      ctx.restore();

      drawSceneLabel(ctx, '鉴别列表', 24, 52, false);
      drawSceneLabel(ctx, '本次奖励', 740, 52, false);
      drawLegend(
        ctx,
        [
          { label: '正确项', color: COL.good },
          { label: '排序分', color: COL.aux },
          { label: '负奖励', color: COL.bad },
        ],
        740,
        240
      );
    };

    const tick = () => {
      paint();
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

  const apply = (next: number, bad: boolean) => {
    const v = clamp(Math.round(next), 1, N);
    stateRef.current.pos = v;
    stateRef.current.fmtBad = bad;
    setPos(v);
    setFmtBad(bad);
    if (bad) {
      setFeedback({
        text: '只要格式不合格，整条奖励直接变成负的——格式是硬门槛。',
        cls: 'bad',
      });
    } else if (v === 1) {
      setFeedback({ text: '排在第一位：奖励最高。', cls: 'good' });
    } else if (v === N) {
      setFeedback({ text: '排在最后一位，奖励已经很低。', cls: '' });
    } else {
      setFeedback({ text: '往后每一格，得分按指数衰减。', cls: '' });
    }
  };

  const posFromEvent = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    return clamp(Math.floor((x - CELL_X0) / CELL_STEP) + 1, 1, N);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    apply(posFromEvent(e.clientX), stateRef.current.fmtBad);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    apply(posFromEvent(e.clientX), stateRef.current.fmtBad);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

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
      <div className="ctrl">
        <label>
          正确诊断的位置 <span className="val">{pos}</span>
        </label>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          value={pos}
          onChange={(e) => apply(Number(e.target.value), stateRef.current.fmtBad)}
        />
      </div>
      <div className="chip-row">
        <button
          className={`chip ${fmtBad ? '' : 'selected'}`}
          onClick={() => apply(stateRef.current.pos, false)}
        >
          格式合格
        </button>
        <button
          className={`chip ${fmtBad ? 'selected' : ''}`}
          onClick={() => apply(stateRef.current.pos, true)}
        >
          格式有误
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M71;
