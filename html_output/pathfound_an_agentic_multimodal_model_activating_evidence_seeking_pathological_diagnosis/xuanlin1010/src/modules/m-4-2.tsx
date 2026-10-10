import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 4.2 两条补充通道各值多少（模式芯片 / 开关组合）
// 主导操作：切换「复查切片」「外部检查」两个开关，四种组合实时切换。
// 即时反馈：当前柱高在 0.6 秒内过渡、四行组合条的当前行高亮、反馈句更新。

const W = 1080;
const H = 280;

const COL_X = 140;
const COL_W = 100;
const BASE_Y = 250;
const COL_MAX = 210;

// 数据来自论文 p.12 Table 5（TCGA-RCC，证据寻求协议，平衡准确率，越高越好）。
const BACC: Record<string, number> = { '00': 59.24, '10': 82.81, '01': 88.15, '11': 92.28 };
const BASELINE = 59.24;
const PEAK = 92.28;

const ROWS: { look: boolean; test: boolean; value: number }[] = [
  { look: false, test: false, value: BACC['00'] },
  { look: true, test: false, value: BACC['10'] },
  { look: false, test: true, value: BACC['01'] },
  { look: true, test: true, value: BACC['11'] },
];

type M42State = {
  look: boolean;
  test: boolean;
  animV: number;
  from: number;
  to: number;
  t: number;
};

const keyOf = (look: boolean, test: boolean) => (look ? '1' : '0') + (test ? '1' : '0');

const feedbackFor = (look: boolean, test: boolean) => {
  if (!look && !test) return { text: '只有初始信息：59.24%。', cls: '' };
  if (look && !test) return { text: '只多看了一眼：82.81%，比基线高 23.57 个百分点。', cls: '' };
  if (!look && test) return { text: '只多了外部检查：88.15%，比基线高 28.91 个百分点。', cls: '' };
  return {
    text: '两条通道一起用才到 92.28%——峰值来自多模态证据的合并，不是单靠某一种。',
    cls: 'good',
  };
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
  items: { color: string; text: string; dash?: boolean }[],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (const item of items) {
    if (item.dash) {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, y - 5);
      ctx.lineTo(cx + 14, y - 5);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = item.color;
      roundRectPath(ctx, cx, y - 12, 14, 14, 3);
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = '#68778f';
    ctx.fillText(item.text, cx + 20, y);
    cx += 20 + ctx.measureText(item.text).width + 26;
  }
  ctx.restore();
}

export const M42: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<M42State>({
    look: false,
    test: false,
    animV: BASELINE,
    from: BASELINE,
    to: BASELINE,
    t: 1,
  });
  const [look, setLook] = useState(false);
  const [test, setTest] = useState(false);
  const [feedback, setFeedback] = useState(feedbackFor(false, false));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: M42State) => {
      const value = clamp(s.animV, 0, 100);
      const topY = BASE_Y - (value / 100) * COL_MAX;
      const baseY = BASE_Y - (BASELINE / 100) * COL_MAX;

      clearScene(ctx, W, H);
      drawBoard(ctx, COL_X, 40, COL_W, COL_MAX, 0.22);
      drawBoard(ctx, 636, 44, 420, 196, 0.25);

      ctx.save();
      ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let v = 0; v <= 100; v += 20) {
        const y = BASE_Y - (v / 100) * COL_MAX;
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(130, y);
        ctx.lineTo(COL_X, y);
        ctx.stroke();
        ctx.fillText(String(v), 124, y);
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = value >= PEAK - 0.01 ? '#228d5c' : '#27446e';
      roundRectPath(ctx, COL_X, topY, COL_W, Math.max(2, BASE_Y - topY), 6);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, baseY);
      ctx.lineTo(300, baseY);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(BASELINE.toFixed(2), 306, baseY);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.moveTo(COL_X + COL_W, topY);
      ctx.lineTo(COL_X + COL_W + 14, topY - 8);
      ctx.lineTo(COL_X + COL_W + 14, topY + 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#21324a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(value.toFixed(2), COL_X + COL_W / 2, topY - 12);
      ctx.restore();

      for (let i = 0; i < ROWS.length; i += 1) {
        const rowY = 60 + i * 48;
        const row = ROWS[i];
        const active = row.look === s.look && row.test === s.test;

        ctx.save();
        for (let k = 0; k < 2; k += 1) {
          const on = k === 0 ? row.look : row.test;
          const sx = 652 + k * 24;
          if (on) {
            ctx.fillStyle = '#27446e';
            roundRectPath(ctx, sx, rowY + 5, 14, 14, 3);
            ctx.fill();
          } else {
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = '#b8c9a7';
            ctx.lineWidth = 2;
            roundRectPath(ctx, sx, rowY + 5, 14, 14, 3);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        ctx.fillStyle = '#d7deea';
        roundRectPath(ctx, 700, rowY, 300, 24, 5);
        ctx.fill();
        ctx.fillStyle = row.value >= PEAK - 0.01 ? '#228d5c' : '#27446e';
        roundRectPath(ctx, 700, rowY, Math.max(4, (row.value / 100) * 300), 24, 5);
        ctx.fill();

        ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#21324a';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(row.value.toFixed(2), 1006, rowY + 12);

        if (active) {
          ctx.strokeStyle = '#f07e47';
          ctx.lineWidth = 3;
          roundRectPath(ctx, 644, rowY - 8, 402, 40, 10);
          ctx.stroke();
        }
        ctx.restore();
      }

      drawSceneLabel(ctx, '准确率', 40, 30, false);
      drawSceneLabel(ctx, '四种组合', 660, 30, false);
      drawLegend(
        ctx,
        [
          { color: '#68778f', text: '基线', dash: true },
          { color: '#228d5c', text: '峰值' },
          { color: '#f07e47', text: '当前组合' },
        ],
        60,
        270
      );
    };

    let last = 0;
    const tick = (now: number) => {
      const s = stateRef.current;
      const dt = last === 0 ? 16 : Math.min(64, now - last);
      last = now;
      if (s.t < 1) {
        s.t = Math.min(1, s.t + dt / 600);
        const eased = 1 - Math.pow(1 - s.t, 3);
        s.animV = s.from + (s.to - s.from) * eased;
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
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const toggle = (which: 'look' | 'test') => {
    const s = stateRef.current;
    const nextLook = which === 'look' ? !s.look : s.look;
    const nextTest = which === 'test' ? !s.test : s.test;
    s.look = nextLook;
    s.test = nextTest;
    s.from = s.animV;
    s.t = 0;
    s.to = BACC[keyOf(nextLook, nextTest)];
    setLook(nextLook);
    setTest(nextTest);
    setFeedback(feedbackFor(nextLook, nextTest));
  };

  const current = BACC[keyOf(look, test)];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${look ? 'selected' : ''}`} onClick={() => toggle('look')}>
          复查切片
        </button>
        <button className={`chip ${test ? 'selected' : ''}`} onClick={() => toggle('test')}>
          外部检查
        </button>
      </div>
      <div className="metrics">
        <span className="metric">
          当前组合准确率 <span className="val">{current.toFixed(2)}</span>
        </span>
        <span className="metric">
          基线 <span className="val">{BASELINE.toFixed(2)}</span>
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M42;
