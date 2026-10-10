import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.1：一次读片只能押一个答案。
// 主导操作：拖动「片数」滑块决定能看几片，然后按「立刻作答」。

const W = 1080;
const H = 280;

// ===== 拼图复原主题：局部绘制助手（各章节同名同义） =====
const PAPER = '#f5f8f0';
const BOARD = '#b8c9a7';
const DEEP = '#76906a';
const WOOD = '#92400e';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const AUX = '#7c3aed';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

type PieceOpts = {
  face?: string;
  edge?: string;
  texture?: string;
  alpha?: number;
  bars?: number[];
  nub?: boolean;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
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

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = BOARD;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = DEEP;
  ctx.lineWidth = 2;
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
): void {
  const face = opts.face || '#ffffff';
  const edge = opts.edge || LINE;
  const texture = opts.texture || DEEP;
  const alpha = opts.alpha === undefined ? 1 : opts.alpha;
  const bars = opts.bars || [0.34, 0.62];
  const nub = opts.nub === undefined ? true : opts.nub;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = face;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (nub) {
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h, Math.min(w, h) * 0.1, Math.PI, 0);
    ctx.stroke();
  }
  ctx.strokeStyle = texture;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < bars.length; i += 1) {
    const by = y + h * bars[i];
    ctx.moveTo(x + w * 0.16, by);
    ctx.lineTo(x + w * 0.72 - i * w * 0.1, by);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPieceBack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.fillStyle = '#e7ebf2';
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#cfd6e2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.24, y + h * 0.3);
  ctx.lineTo(x + w * 0.76, y + h * 0.7);
  ctx.moveTo(x + w * 0.76, y + h * 0.3);
  ctx.lineTo(x + w * 0.24, y + h * 0.7);
  ctx.stroke();
  ctx.restore();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: number[],
  color: string
): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  for (let i = 0; i < lines.length; i += 1) {
    const ly = y + h * lines[i];
    ctx.moveTo(x + w * 0.16, ly);
    ctx.lineTo(x + w * 0.84, ly);
  }
  ctx.stroke();
  ctx.restore();
}

function drawJoint(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ok: boolean
): void {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if (ok) {
    ctx.strokeStyle = GREEN;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = RED;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1 + 6, y1 + 6);
    ctx.lineTo(x2 + 6, y2 + 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 12);
  ctx.lineTo(42, 30);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted: boolean
): void {
  ctx.save();
  ctx.fillStyle = muted ? MUTED : INK;
  ctx.font = muted
    ? '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    : '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  ctx.save();
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  const shown = items.slice(0, 3);
  for (let i = 0; i < shown.length; i += 1) {
    const item = shown[i];
    ctx.fillStyle = item.color;
    roundRect(ctx, cx, y - 7, 14, 14, 3);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.fillText(item.label, cx + 20, y);
    cx += 20 + ctx.measureText(item.label).width + 28;
  }
  ctx.restore();
}

function drawCenterLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, cx, y);
  ctx.restore();
}

// ===== 桌面：4×2 散片网格（左区）与整幅图轮廓（右区） =====
const GRID_X0 = 62;
const GRID_Y0 = 44;
const COLS = 4;
const ROWS = 2;
const CELL_W = 150;
const CELL_H = 105;
const INSET = 6;
const FRAME = { x: 766, y: 50, w: 260, h: 190 };
const INNER = [
  { x: 776, y: 60 },
  { x: 898, y: 60 },
  { x: 776, y: 147 },
  { x: 898, y: 147 },
];
const INNER_W = 118;
const INNER_H = 83;

// 判定规则是示意性的：把「正确答案」固定成第 3 片翻开时的图样，即片数 ≥ 3 记为命中。
// 这条规则只用来说明「信息不足只能押注」，不是论文里的任何数据或结论。
const HIT_FROM = 3;
const TOTAL = COLS * ROWS;

type Scene = { pieces: number; answered: boolean; correct: boolean };

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Scene>({ pieces: 1, answered: false, correct: false });
  const rafRef = useRef<number | null>(null);
  const [pieces, setPieces] = useState(1);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({ text: '只看到 1 片，几乎只能猜。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: Scene) => {
      clearScene(ctx, W, H);
      drawBoard(ctx, 24, 44, 676, 210, 1);

      // 背面片
      for (let i = 0; i < TOTAL; i += 1) {
        if (i < s.pieces) continue;
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        drawPieceBack(
          ctx,
          GRID_X0 + c * CELL_W + INSET,
          GRID_Y0 + r * CELL_H + INSET,
          CELL_W - INSET * 2,
          CELL_H - INSET * 2
        );
      }

      // 翻开的片：按索引从左上到右下依次翻开，带纹理线
      for (let i = 0; i < Math.min(s.pieces, TOTAL); i += 1) {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        drawPiece(
          ctx,
          GRID_X0 + c * CELL_W + INSET,
          GRID_Y0 + r * CELL_H + INSET,
          CELL_W - INSET * 2,
          CELL_H - INSET * 2,
          { face: '#ffffff', edge: DEEP, texture: DEEP, bars: [0.3, 0.56, 0.8] }
        );
      }

      // 中间的整幅图轮廓
      const outline = s.answered ? (s.correct ? GREEN : RED) : BLUE;
      const fill = s.answered
        ? s.correct
          ? 'rgba(34,141,92,0.12)'
          : 'rgba(196,63,82,0.12)'
        : 'rgba(39,68,110,0.06)';
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = fill;
      roundRect(ctx, FRAME.x, FRAME.y, FRAME.w, FRAME.h, 12);
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = s.answered ? 3 : 2;
      if (!s.answered) ctx.setLineDash([10, 8]);
      roundRect(ctx, FRAME.x, FRAME.y, FRAME.w, FRAME.h, 12);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < INNER.length; i += 1) {
        ctx.save();
        ctx.globalAlpha = s.answered ? 0.35 : 0.5;
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1;
        roundRect(ctx, INNER[i].x, INNER[i].y, INNER_W, INNER_H, 8);
        ctx.stroke();
        ctx.restore();
      }

      // 答案标记：形状 + 颜色双重线索
      if (s.answered) {
        const cx = FRAME.x + FRAME.w / 2;
        const cy = FRAME.y + FRAME.h / 2 - 6;
        ctx.save();
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        if (s.correct) {
          ctx.strokeStyle = GREEN;
          ctx.beginPath();
          ctx.moveTo(cx - 30, cy + 4);
          ctx.lineTo(cx - 8, cy + 26);
          ctx.lineTo(cx + 32, cy - 24);
          ctx.stroke();
        } else {
          ctx.strokeStyle = RED;
          ctx.beginPath();
          ctx.moveTo(cx - 24, cy - 24);
          ctx.lineTo(cx + 24, cy + 24);
          ctx.moveTo(cx + 24, cy - 24);
          ctx.lineTo(cx - 24, cy + 24);
          ctx.stroke();
        }
        ctx.restore();
        drawCenterLabel(ctx, s.correct ? '命中' : '未命中', FRAME.x + FRAME.w / 2, 264, outline);
      }

      drawSceneLabel(ctx, '散片', 28, 32, false);
      drawLegend(
        ctx,
        [
          { label: '已翻开', color: DEEP },
          { label: '未翻开', color: '#cfd6e2' },
          { label: '缺口', color: BLUE },
        ],
        28,
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
      if (!rafRef.current) {
        render(stateRef.current);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onPieces = (e: React.FormEvent<HTMLInputElement>) => {
    const v = clamp(Number((e.target as HTMLInputElement).value), 1, TOTAL);
    stateRef.current.pieces = v;
    stateRef.current.answered = false;
    stateRef.current.correct = false;
    setPieces(v);
    setAnswered(false);
    setFeedback(
      v <= 2
        ? { text: `只看到 ${v} 片，几乎只能猜。`, cls: '' }
        : { text: `目前看到 ${v} 片。`, cls: '' }
    );
  };

  const answer = () => {
    const p = stateRef.current.pieces;
    const ok = p >= HIT_FROM;
    stateRef.current.answered = true;
    stateRef.current.correct = ok;
    setAnswered(true);
    setFeedback(
      ok
        ? { text: `${p} 片刚好够。但这是运气，不是方法。`, cls: 'good' }
        : { text: `只有 ${p} 片，接缝对不上，你看不到整幅图。`, cls: 'bad' }
    );
  };

  const restart = () => {
    const p = stateRef.current.pieces;
    stateRef.current.answered = false;
    stateRef.current.correct = false;
    setAnswered(false);
    setFeedback(
      p <= 2
        ? { text: `只看到 ${p} 片，几乎只能猜。`, cls: '' }
        : { text: `目前看到 ${p} 片。`, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="metrics">
        <div className="metric">
          <div className="l">平衡准确率 · 一次读片 · TCGA-RCC</div>
          <div className="v">59.24</div>
        </div>
        <div className="metric">
          <div className="l">平衡准确率 · 一次读片 · GPT-5</div>
          <div className="v">38.34</div>
        </div>
      </div>
      <div className="ctrl">
        <label>
          片数 <span className="val">{pieces}</span>
        </label>
        <input
          type="range"
          min={1}
          max={TOTAL}
          step={1}
          value={pieces}
          onInput={onPieces}
          onChange={onPieces}
        />
        {answered ? (
          <button className="chip" onClick={restart}>
            重新开始
          </button>
        ) : (
          <button className="chip" onClick={answer}>
            立刻作答
          </button>
        )}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M11;
