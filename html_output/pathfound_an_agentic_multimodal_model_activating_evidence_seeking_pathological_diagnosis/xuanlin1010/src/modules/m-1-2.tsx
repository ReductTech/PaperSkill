import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.2：回头看一次的分岔。
// 主导操作：按一次「开始比较」，左右两条同步轨迹同时推进；用芯片切换数据集。

const W = 1080;
const H = 280;
const DURATION = 1600; // ms，t 由 0 到 1

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

function drawValue(
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

function drawScaleNumber(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number): void {
  ctx.save();
  ctx.fillStyle = MUTED;
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, cx, y);
  ctx.restore();
}

type DS = 'rcc' | 'prad' | 'inv';
type Phase = 'idle' | 'running' | 'done';

// 真实数字：p.10 Table 2 的 OP 列与 ES 列（RCC 用平衡准确率，前列腺与侵袭用准确率）
const DATA: Record<DS, { op: number; es: number }> = {
  rcc: { op: 59.24, es: 92.28 },
  prad: { op: 84.56, es: 92.17 },
  inv: { op: 69.57, es: 81.64 },
};

const PANELS = [
  { x: 24, y: 24, w: 504, h: 224, label: '不回头', color: RED },
  { x: 552, y: 24, w: 504, h: 224, label: '回头补看', color: GREEN },
];
const TRACK_Y = 196;
const TRACK_LEN = 424;
const TICKS = [0, 20, 40, 60, 80, 100];

type Scene = { dataset: DS; t: number };

export const M12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ dataset: DS; t: number; phase: Phase; startedAt: number }>({
    dataset: 'rcc',
    t: 0,
    phase: 'idle',
    startedAt: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [dataset, setDataset] = useState<DS>('rcc');
  const [phase, setPhase] = useState<Phase>('idle');
  const [switched, setSwitched] = useState(false);

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
      const d = DATA[s.dataset];
      const leftEnd = d.op;
      // 右侧在同一份初始信息上前进到论文报告的取证后数值；t 只决定轨迹画到哪里
      const rightEnd = d.op + (d.es - d.op) * clamp(s.t, 0, 1);

      for (let p = 0; p < PANELS.length; p += 1) {
        const panel = PANELS[p];
        drawBoard(ctx, panel.x, panel.y, panel.w, panel.h, 1);
        drawSceneLabel(ctx, panel.label, panel.x + 16, panel.y + 28, false);

        const x0 = panel.x + 48;
        const valueAt = (v: number) => x0 + (clamp(v, 0, 100) / 100) * TRACK_LEN;

        // 0–100 的横向刻度
        for (let i = 0; i < TICKS.length; i += 1) {
          const tx = valueAt(TICKS[i]);
          ctx.save();
          ctx.strokeStyle = LINE;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tx, TRACK_Y - 10);
          ctx.lineTo(tx, TRACK_Y + 10);
          ctx.stroke();
          ctx.restore();
          drawScaleNumber(ctx, String(TICKS[i]), tx, TRACK_Y + 30);
        }

        // 已走过的轨迹线：左红右绿，同一起点、同一刻度
        const end = p === 0 ? leftEnd : rightEnd;
        ctx.save();
        ctx.strokeStyle = panel.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(valueAt(0), TRACK_Y);
        ctx.lineTo(valueAt(end), TRACK_Y);
        ctx.stroke();
        ctx.restore();

        // 起点
        const sx = valueAt(d.op);
        ctx.save();
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, TRACK_Y - 16);
        ctx.lineTo(sx, TRACK_Y + 16);
        ctx.stroke();
        ctx.restore();

        // 片形标记
        const mx = valueAt(end);
        ctx.save();
        ctx.strokeStyle = panel.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx, TRACK_Y - 13);
        ctx.lineTo(mx, TRACK_Y);
        ctx.stroke();
        ctx.restore();
        drawPiece(ctx, mx - 20, TRACK_Y - 43, 40, 30, {
          face: '#ffffff',
          edge: panel.color,
          texture: panel.color,
          bars: [0.5],
        });

        // 终点数值：左侧停在一次读片的分数，右侧停在取证后的分数
        if (p === 0) {
          drawValue(ctx, d.op.toFixed(2), valueAt(d.op), TRACK_Y - 56, INK);
        } else {
          drawValue(ctx, d.es.toFixed(2), valueAt(d.es), TRACK_Y - 56, s.t >= 1 ? GREEN : MUTED);
        }
      }

      drawLegend(
        ctx,
        [
          { label: '不回头', color: RED },
          { label: '回头补看', color: GREEN },
          { label: '起点', color: BLUE },
        ],
        372,
        270
      );
    };

    const tick = () => {
      const s = stateRef.current;
      if (s.phase === 'running') {
        const u = clamp((performance.now() - s.startedAt) / DURATION, 0, 1);
        s.t = u;
        if (u >= 1) {
          s.phase = 'done';
          setPhase('done');
        }
      }
      render(s);
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

  const startCompare = () => {
    stateRef.current.t = 0;
    stateRef.current.startedAt = performance.now();
    stateRef.current.phase = 'running';
    setPhase('running');
  };

  const pick = (d: DS) => {
    stateRef.current.dataset = d;
    stateRef.current.t = 0;
    stateRef.current.phase = 'idle';
    setDataset(d);
    setPhase('idle');
    setSwitched(true);
  };

  const info = DATA[dataset];
  const feedback =
    phase === 'done'
      ? {
          text: `同一份初始信息，回头补看一次就把结论从 ${info.op.toFixed(2)} 抬到 ${info.es.toFixed(2)}。`,
          cls: 'good',
        }
      : switched
      ? { text: '数据集换了，但方向一致：取证后的分数都更高。', cls: 'good' }
      : { text: '两侧的初始信息完全一样。', cls: '' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={startCompare} disabled={phase === 'running'}>
          {phase === 'done' ? '再看一次' : '开始比较'}
        </button>
        <div className="chip-row">
          <button className={`chip ${dataset === 'rcc' ? 'selected' : ''}`} onClick={() => pick('rcc')}>
            TCGA-RCC
          </button>
          <button className={`chip ${dataset === 'prad' ? 'selected' : ''}`} onClick={() => pick('prad')}>
            TCGA-PRAD
          </button>
          <button className={`chip ${dataset === 'inv' ? 'selected' : ''}`} onClick={() => pick('inv')}>
            TCGA-Invasion
          </button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M12;
