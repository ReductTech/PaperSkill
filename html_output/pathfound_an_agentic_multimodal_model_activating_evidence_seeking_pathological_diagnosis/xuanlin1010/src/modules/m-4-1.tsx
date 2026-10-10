import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 4.1 列了清单以后，诊断反而更容易错（可点击热点）
// 主导操作：点击三个模型卡片之一，三条轨迹绘出该模型的三次数值，反馈句更新。

const W = 1080;
const H = 280;

type CaseIdx = 0 | 1 | 2 | null;

type CaseRow = {
  name: string;
  initialBacc: number;
  ddxBacc: number;
  finalBacc: number;
};

// 数据来自论文 p.12 Table 4（TCGA-RCC，证据寻求协议，平衡准确率，越高越好）。
const CASES: CaseRow[] = [
  { name: 'PathFound', initialBacc: 49.58, ddxBacc: 95.63, finalBacc: 92.28 },
  { name: 'Qwen3-VL', initialBacc: 35.08, ddxBacc: 92.61, finalBacc: 44.85 },
  { name: 'InternVL3.5', initialBacc: 29.17, ddxBacc: 83.05, finalBacc: 54.82 },
];

const TRACK_COLORS = ['#27446e', '#7c3aed', '#228d5c'];

type Box = { x: number; y: number; w: number; h: number };
type CardBox = { cx: number; cy: number; w: number; h: number };
type TrackBox = { x: number; baseline: number; maxH: number };

function layoutFor(narrow: boolean) {
  if (narrow) {
    const cards: CardBox[] = [
      { cx: 218, cy: 62, w: 380, h: 66 },
      { cx: 218, cy: 140, w: 380, h: 66 },
      { cx: 218, cy: 218, w: 380, h: 66 },
    ];
    const hotspots: Box[] = cards.map((c) => ({
      x: c.cx - c.w / 2,
      y: c.cy - c.h / 2,
      w: c.w,
      h: c.h,
    }));
    return {
      cards,
      hotspots,
      tracks: [
        { x: 520, baseline: 250, maxH: 150 },
        { x: 680, baseline: 250, maxH: 150 },
        { x: 840, baseline: 250, maxH: 150 },
      ] as TrackBox[],
      trackW: 60,
      legend: { x: 30, y: 274 },
      stacked: true,
    };
  }
  const cards: CardBox[] = [
    { cx: 200, cy: 112, w: 170, h: 100 },
    { cx: 540, cy: 112, w: 170, h: 100 },
    { cx: 880, cy: 112, w: 170, h: 100 },
  ];
  const hotspots: Box[] = [200, 540, 880].map((cx) => ({ x: cx - 90, y: 60, w: 180, h: 110 }));
  return {
    cards,
    hotspots,
    tracks: [
      { x: 320, baseline: 250, maxH: 60 },
      { x: 540, baseline: 250, maxH: 60 },
      { x: 760, baseline: 250, maxH: 60 },
    ] as TrackBox[],
    trackW: 80,
    legend: { x: 30, y: 272 },
    stacked: false,
  };
}

const idle = { text: '点击任一处病例。', cls: '' };

const feedbackFor = (idx: CaseIdx) => {
  if (idx === null) return idle;
  if (idx === 0) {
    return { text: '鉴别清单命中率 95.63%，最终诊断只有 92.28%——清单准，不等于结论准。', cls: '' };
  }
  const row = CASES[idx];
  return {
    text: `鉴别看起来 ${row.ddxBacc.toFixed(2)}%，最终只有 ${row.finalBacc.toFixed(2)}%。清单越长，虚高越明显。`,
    cls: 'bad',
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

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ idx: CaseIdx; narrow: boolean }>({ idx: null, narrow: false });
  const [caseIdx, setCaseIdx] = useState<CaseIdx>(null);
  const [narrow, setNarrow] = useState(false);
  const [feedback, setFeedback] = useState(idle);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (idx: CaseIdx, isNarrow: boolean, now: number) => {
      const L = layoutFor(isNarrow);
      clearScene(ctx, W, H);

      for (let i = 0; i < 3; i += 1) {
        const c = L.cards[i];
        const sel = idx === i;
        const x = c.cx - c.w / 2;
        const y = c.cy - c.h / 2;

        ctx.save();
        ctx.fillStyle = sel ? 'rgba(184, 201, 167, 0.55)' : 'rgba(184, 201, 167, 0.3)';
        roundRectPath(ctx, x, y, c.w, c.h, 12);
        ctx.fill();
        ctx.strokeStyle = sel ? '#f07e47' : '#68778f';
        ctx.lineWidth = sel ? 3 + 1.5 * (0.5 + 0.5 * Math.sin(now / 240)) : 2;
        roundRectPath(ctx, x, y, c.w, c.h, 12);
        ctx.stroke();
        ctx.restore();

        drawPiece(ctx, L.stacked ? 44 : c.cx - 36, L.stacked ? c.cy - 22 : c.cy - 38, L.stacked ? 60 : 72, L.stacked ? 40 : 44, {
          fill: 'rgba(238, 243, 230, 0.9)',
          stroke: sel ? '#f07e47' : '#76906a',
          lines: 2,
          lineColor: sel ? '#f07e47' : '#76906a',
          nub: false,
        });

        ctx.save();
        ctx.fillStyle = sel ? '#21324a' : '#68778f';
        ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = L.stacked ? 'left' : 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(
          CASES[i].name,
          L.stacked ? 122 : c.cx,
          L.stacked ? c.cy + 8 : c.cy + 46
        );
        ctx.restore();
      }

      for (let i = 0; i < 3; i += 1) {
        const t = L.tracks[i];
        const x = t.x - L.trackW / 2;
        const top = t.baseline - t.maxH;

        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 2;
        roundRectPath(ctx, x, top, L.trackW, t.maxH, 8);
        ctx.stroke();
        ctx.restore();

        if (idx !== null) {
          const value = i === 0 ? CASES[idx].initialBacc : i === 1 ? CASES[idx].ddxBacc : CASES[idx].finalBacc;
          const barH = clamp(value / 100, 0, 1) * t.maxH;
          ctx.save();
          ctx.fillStyle = TRACK_COLORS[i];
          roundRectPath(ctx, x, t.baseline - barH, L.trackW, Math.max(5, barH), 8);
          ctx.fill();
          ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.fillStyle = '#21324a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(value.toFixed(2), t.x, t.baseline - barH - 10);
          ctx.restore();
        }
      }

      drawLegend(
        ctx,
        [
          { color: '#27446e', text: '初始假设' },
          { color: '#7c3aed', text: '鉴别清单' },
          { color: '#228d5c', text: '最终诊断' },
        ],
        L.legend.x,
        L.legend.y
      );
    };

    const tick = (now: number) => {
      render(stateRef.current.idx, stateRef.current.narrow, now);
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
      const isNarrow = width > 0 && width < 900;
      if (stateRef.current.narrow === isNarrow) return;
      stateRef.current.narrow = isNarrow;
      setNarrow(isNarrow);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const select = (idx: 0 | 1 | 2) => {
    stateRef.current.idx = idx;
    setCaseIdx(idx);
    setFeedback(feedbackFor(idx));
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = W / (rect.width || W);
    const sy = H / (rect.height || H);
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top) * sy;
    const L = layoutFor(stateRef.current.narrow);
    for (let i = 0; i < 3; i += 1) {
      const box = L.hotspots[i];
      if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
        select(i as 0 | 1 | 2);
        return;
      }
    }
  };

  const row = caseIdx === null ? null : CASES[caseIdx];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onClick}
      />
      <div className="chip-row">
        {CASES.map((c, i) => (
          <button
            key={c.name}
            className={`chip ${caseIdx === i ? 'selected' : ''}`}
            onClick={() => select(i as 0 | 1 | 2)}
          >
            {['病例一', '病例二', '病例三'][i]}
          </button>
        ))}
      </div>
      <div className="metrics">
        <span className="metric">
          初始假设 <span className="val">{row ? row.initialBacc.toFixed(2) : '—'}</span>
        </span>
        <span className="metric">
          鉴别清单 <span className="val">{row ? row.ddxBacc.toFixed(2) : '—'}</span>
        </span>
        <span className="metric">
          最终诊断 <span className="val">{row ? row.finalBacc.toFixed(2) : '—'}</span>
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41;
