import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 同一张切片，四种找法：点四个芯片之一切换观察目标，
// 高亮格分布、区域数与放大倍数同时变化。点高亮格可把绿色标记挪到那一格上。

const W = 1080;
const H = 280;
const COLS = 12;
const ROWS = 6;
const CW = 50;
const CH = 34;
const GX = 24;
const GY = 52;

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

type Goal = 'pan' | 'ccrcc' | 'nuclear' | 'invasion';

interface GoalSpec {
  label: string;
  regions: number;
  mag: string;
  cells: number[];
  fb: string;
  cls: string;
}

const SPEC: Record<Goal, GoalSpec> = {
  pan: {
    label: '泛癌筛查',
    regions: 8,
    mag: '10× / 20×',
    cells: [3, 15, 27, 38, 44, 55, 62, 69],
    fb: '不预设目标，先取 3 个 10× 最像块、2 个 10× 随机块、3 个 20× 最像块，共 8 个。',
    cls: '',
  },
  ccrcc: {
    label: '透明细胞',
    regions: 6,
    mag: '10× / 20×',
    cells: [26, 27, 28, 38, 39, 40],
    fb: '换成实体级定位：只取与「透明细胞」原型最像的前几块。',
    cls: '',
  },
  nuclear: {
    label: '核分级',
    regions: 5,
    mag: '20×',
    cells: [8, 21, 34, 47, 58],
    fb: '核分级按 1–4 级分别有原型，取每类 20× 的前 5 块，并配上参考图一起看。',
    cls: '',
  },
  invasion: {
    label: '侵袭检测',
    regions: 10,
    mag: '5× / 10×',
    cells: [14, 15, 16, 17, 18, 50, 51, 52, 53, 54],
    fb: '侵袭取 5× 与 10× 各前 5 块；论文的消融显示这两个倍数搭配最平衡。',
    cls: 'good',
  },
};

const ORDER: Goal[] = ['pan', 'ccrcc', 'nuclear', 'invasion'];

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ goal: Goal; picked: number | null }>({ goal: 'pan', picked: null });
  const rafRef = useRef<number | null>(null);
  const [goal, setGoal] = useState<Goal>('pan');
  const [feedback, setFeedback] = useState({ text: SPEC.pan.fb, cls: SPEC.pan.cls });

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
      const spec = SPEC[st.goal];
      const selected = st.picked === null ? spec.cells[0] : st.picked;
      clearScene(ctx, W, H);
      drawBoard(ctx, 12, 40, 616, 226, 0.28);

      // 切片底格
      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          const x = GX + c * CW;
          const y = GY + r * CH;
          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = COL.face;
          ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
          ctx.restore();
          ctx.strokeStyle = COL.edge;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1, y + 1, CW - 2, CH - 2);
        }
      }

      // 目标类高亮格
      spec.cells.forEach((idx) => {
        if (idx === selected) return;
        const c = idx % COLS;
        const r = Math.floor(idx / COLS);
        const x = GX + c * CW;
        const y = GY + r * CH;
        ctx.save();
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = COL.guide;
        ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
        ctx.restore();
        ctx.strokeStyle = COL.guide;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, CW - 2, CH - 2);
      });

      // 被选中的格：实心绿加粗描边
      const sc = selected % COLS;
      const sr = Math.floor(selected / COLS);
      const sx = GX + sc * CW;
      const sy = GY + sr * CH;
      ctx.fillStyle = COL.good;
      ctx.fillRect(sx + 1, sy + 1, CW - 2, CH - 2);
      ctx.strokeStyle = COL.good;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, CW - 2, CH - 2);

      // 信息区：区域数条与放大倍数
      drawSceneLabel(ctx, '区域数', 712, 44, false);
      const trackX = 712;
      const trackW = 328;
      ctx.save();
      ctx.fillStyle = 'rgba(215,222,234,0.65)';
      roundRect(ctx, trackX, 58, trackW, 24, 8);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = COL.edge;
      ctx.lineWidth = 1;
      roundRect(ctx, trackX, 58, trackW, 24, 8);
      ctx.stroke();
      const fillW = (trackW * clamp(spec.regions, 0, 20)) / 20;
      ctx.fillStyle = COL.guide;
      roundRect(ctx, trackX, 58, Math.max(6, fillW), 24, 8);
      ctx.fill();
      drawSceneLabel(ctx, String(spec.regions), trackX + fillW + 14, 78, false);

      drawSceneLabel(ctx, '放大倍数', 712, 138, false);
      drawSceneLabel(ctx, spec.mag, 712, 176, false);
      drawLegend(
        ctx,
        [
          { label: '目标类', color: COL.guide },
          { label: '选中块', color: COL.good },
          { label: '其他格', color: COL.edge },
        ],
        712,
        250
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

  const pick = (g: Goal) => {
    stateRef.current.goal = g;
    stateRef.current.picked = null;
    setGoal(g);
    setFeedback({ text: SPEC[g].fb, cls: SPEC[g].cls });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const c = Math.floor((x - GX) / CW);
    const r = Math.floor((y - GY) / CH);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
    const idx = r * COLS + c;
    if (SPEC[stateRef.current.goal].cells.indexOf(idx) >= 0) {
      stateRef.current.picked = idx;
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {ORDER.map((g) => (
          <button
            key={g}
            className={`chip ${goal === g ? 'selected' : ''}`}
            onClick={() => pick(g)}
          >
            {SPEC[g].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M51;
