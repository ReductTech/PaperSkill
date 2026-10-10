import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 多拿几片真的会更准吗：拖动「取几片」滑块（1–10），
// 桌上的片数与右侧那条准确率折线同步变化；六片左右进入饱和区。
// 曲线为趋势示意，纵轴量级参照论文报告的初始鉴别诊断准确率。

const W = 1080;
const H = 280;

const PIECE_W = 54;
const PIECE_H = 38;
const PIECE_GAP = 6;
const PIECE_X0 = 26;
const PIECE_Y = 196;

const PLOT_X0 = 690;
const PLOT_X1 = 1040;
const PLOT_Y0 = 62;
const PLOT_Y1 = 250;
const ACC_MAX = 60;

const ACC = [22, 30, 36, 41, 44, 46, 46.5, 46.8, 47, 47.1];

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

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

const px = (count: number) => PLOT_X0 + ((clamp(count, 1, 10) - 1) / 9) * (PLOT_X1 - PLOT_X0);
const py = (acc: number) => PLOT_Y1 - (clamp(acc, 0, ACC_MAX) / ACC_MAX) * (PLOT_Y1 - PLOT_Y0);

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ count: number }>({ count: 1 });
  const rafRef = useRef<number | null>(null);
  const [count, setCount] = useState(1);
  const [feedback, setFeedback] = useState({ text: '才几片，图样还没看清。', cls: '' });

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
      const n = clamp(Math.round(stateRef.current.count), 1, 10);
      const acc = ACC[n - 1];
      clearScene(ctx, W, H);

      // 桌面
      drawBoard(ctx, 16, 40, 604, 216, 0.28);
      ctx.strokeStyle = COL.boardDeep;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(34, PIECE_Y + PIECE_H + 8);
      ctx.lineTo(612, PIECE_Y + PIECE_H + 8);
      ctx.stroke();
      for (let i = 0; i < n; i += 1) {
        drawPiece(ctx, PIECE_X0 + i * (PIECE_W + PIECE_GAP), PIECE_Y, PIECE_W, PIECE_H, {
          edge: i === n - 1 ? COL.guide : COL.edge,
        });
      }

      // 折线图：坐标轴与刻度
      ctx.save();
      ctx.fillStyle = 'rgba(104,119,143,0.12)';
      ctx.fillRect(px(6), PLOT_Y0, PLOT_X1 - px(6), PLOT_Y1 - PLOT_Y0);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = COL.muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(px(6), PLOT_Y0);
      ctx.lineTo(px(6), PLOT_Y1);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = COL.edge;
      ctx.lineWidth = 1;
      [0, 30, 60].forEach((v) => {
        ctx.beginPath();
        ctx.moveTo(PLOT_X0, py(v));
        ctx.lineTo(PLOT_X1, py(v));
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(PLOT_X0, PLOT_Y0);
      ctx.lineTo(PLOT_X0, PLOT_Y1);
      ctx.lineTo(PLOT_X1, PLOT_Y1);
      ctx.stroke();

      ctx.save();
      ctx.fillStyle = COL.muted;
      ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      [0, 30, 60].forEach((v) => {
        ctx.fillText(String(v), PLOT_X0 - 12, py(v));
      });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      [1, 5, 10].forEach((c) => {
        ctx.fillText(String(c), px(c), PLOT_Y1 + 22);
      });
      ctx.restore();

      // 已走过的折线段
      ctx.strokeStyle = COL.guide;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < n; i += 1) {
        const x = px(i + 1);
        const y = py(ACC[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 当前点与裸数字
      ctx.beginPath();
      ctx.fillStyle = COL.warm;
      ctx.arc(px(n), py(acc), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.text;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawSceneLabel(ctx, fmt(acc), n >= 8 ? px(n) - 62 : px(n) + 12, py(acc) - 10, false);

      drawSceneLabel(ctx, '桌面取片', 26, 32, false);
      drawSceneLabel(ctx, '初始鉴别准确率', 660, 32, false);
      drawLegend(
        ctx,
        [
          { label: '已取片', color: COL.edge },
          { label: '当前点', color: COL.warm },
          { label: '饱和区间', color: 'rgba(104,119,143,0.45)' },
        ],
        26,
        268
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = clamp(Math.round(Number(e.target.value)), 1, 10);
    stateRef.current.count = n;
    setCount(n);
    if (n <= 3) setFeedback({ text: '才几片，图样还没看清。', cls: '' });
    else if (n <= 5) setFeedback({ text: '继续加片还有收益，曲线在爬。', cls: '' });
    else if (n <= 8)
      setFeedback({
        text: '到六片左右就开始平了——再多加，准确率几乎不动，上下文成本却一直涨。',
        cls: 'good',
      });
    else setFeedback({ text: '平了以后再加，只是把上下文撑长。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          取几片 <span className="val">{count}</span>
        </label>
        <input type="range" min={1} max={10} step={1} value={count} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M61;
