import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 放大倍数不是越高越好：点五组配置芯片之一，三根指标条在 0.6 秒内过渡，
// 数值与 F1 名次同步更新。数值取自论文在 TCGA-Invasion 上的精确率 / 召回 / F1。

const W = 1080;
const H = 280;

const BAR_W = 90;
const BAR_GAP = 60;
const BAR_X0 = 70;
const BASE_Y = 250;
const FULL_H = 190;

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

function easeOut(t: number) {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

type MagKey = 'm5' | 'm10' | 'm20' | 'm510' | 'm51020';

interface MagSpec {
  label: string;
  prec: number;
  rec: number;
  f1: number;
  fb: string;
  cls: string;
}

const MAG: Record<MagKey, MagSpec> = {
  m5: {
    label: '5×',
    prec: 68.66,
    rec: 69.61,
    f1: 69.13,
    fb: '只有 5× 时召回 69.61，覆盖够了但把握不足。',
    cls: '',
  },
  m10: {
    label: '10×',
    prec: 61.12,
    rec: 64.71,
    f1: 62.86,
    fb: '只用 10× 时三项都偏低，F1 只有 62.86。',
    cls: '',
  },
  m20: {
    label: '20×',
    prec: 65.62,
    rec: 56.86,
    f1: 60.93,
    fb: '只有 20× 时召回掉到 56.86，细看反而漏掉了整片区域。',
    cls: 'bad',
  },
  m510: {
    label: '5×+10×',
    prec: 67.65,
    rec: 75.82,
    f1: 71.5,
    fb: '67.65 / 75.82 / 71.50——论文里 F1 最高的一组。',
    cls: 'good',
  },
  m51020: {
    label: '5×+10×+20×',
    prec: 66.67,
    rec: 71.57,
    f1: 69.03,
    fb: '5×+10×+20× 的 F1 是 69.03，比 5×+10× 低——多取一层不一定更好。',
    cls: '',
  },
};

const ORDER: MagKey[] = ['m5', 'm10', 'm20', 'm510', 'm51020'];
const RANK: MagKey[] = ['m510', 'm5', 'm51020', 'm10', 'm20'];
const BEST_F1 = 71.5;

export const M62: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    mag: MagKey;
    from: [number, number, number];
    anim: [number, number, number];
    t0: number | null;
  }>({
    mag: 'm510',
    from: [MAG.m510.prec, MAG.m510.rec, MAG.m510.f1],
    anim: [MAG.m510.prec, MAG.m510.rec, MAG.m510.f1],
    t0: null,
  });
  const rafRef = useRef<number | null>(null);
  const [mag, setMag] = useState<MagKey>('m510');
  const [feedback, setFeedback] = useState({ text: MAG.m510.fb, cls: MAG.m510.cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const paint = (now: number) => {
      const st = stateRef.current;
      const spec = MAG[st.mag];
      const target = [spec.prec, spec.rec, spec.f1];
      if (st.t0 === null) st.t0 = now;
      const e = easeOut((now - st.t0) / 600);
      const a0 = st.from[0] + (target[0] - st.from[0]) * e;
      const a1 = st.from[1] + (target[1] - st.from[1]) * e;
      const a2 = st.from[2] + (target[2] - st.from[2]) * e;
      st.anim = [a0, a1, a2];

      clearScene(ctx, W, H);
      drawBoard(ctx, 16, 40, 588, 216, 0.28);

      // 三条刻度线
      ctx.strokeStyle = COL.edge;
      ctx.lineWidth = 1;
      [0, 50, 100].forEach((v) => {
        const y = BASE_Y - (v / 100) * FULL_H;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(520, y);
        ctx.stroke();
      });
      ctx.save();
      ctx.fillStyle = COL.muted;
      ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      [0, 50, 100].forEach((v) => {
        ctx.fillText(String(v), 32, BASE_Y - (v / 100) * FULL_H);
      });
      ctx.restore();

      // 三根指标条
      const vals = [a0, a1, a2];
      const barColor = st.mag === 'm510' ? COL.good : COL.guide;
      vals.forEach((v, i) => {
        const x = BAR_X0 + i * (BAR_W + BAR_GAP);
        const h = (clamp(v, 0, 100) / 100) * FULL_H;
        ctx.fillStyle = barColor;
        roundRect(ctx, x, BASE_Y - h, BAR_W, h, 6);
        ctx.fill();
        if (st.mag === 'm510') {
          ctx.strokeStyle = barColor;
          ctx.lineWidth = 2;
          roundRect(ctx, x, BASE_Y - h, BAR_W, h, 6);
          ctx.stroke();
        }
        ctx.save();
        ctx.fillStyle = COL.text;
        ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(v.toFixed(2), x + BAR_W / 2, BASE_Y - h - 12);
        ctx.restore();
      });

      // 当前配置名称（名次改由页面读数区呈现，画面内只保留配置名与条形）
      drawSceneLabel(ctx, spec.label, 660, 96, false);
      ctx.save();
      ctx.fillStyle = 'rgba(215,222,234,0.65)';
      roundRect(ctx, 660, 178, 380, 20, 7);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = COL.guide;
      roundRect(ctx, 660, 178, Math.max(8, (a2 / 100) * 380), 20, 7);
      ctx.fill();
      ctx.save();
      ctx.strokeStyle = COL.good;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(660 + (BEST_F1 / 100) * 380, 172);
      ctx.lineTo(660 + (BEST_F1 / 100) * 380, 204);
      ctx.stroke();
      ctx.restore();

      drawLegend(
        ctx,
        [
          { label: '精确率', color: barColor },
          { label: '召回', color: barColor },
          { label: 'F1', color: barColor },
        ],
        70,
        268
      );
    };

    const tick = (now: number) => {
      paint(now);
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

  const pick = (m: MagKey) => {
    const st = stateRef.current;
    st.from = [st.anim[0], st.anim[1], st.anim[2]];
    st.t0 = null;
    st.mag = m;
    setMag(m);
    setFeedback({ text: MAG[m].fb, cls: MAG[m].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ORDER.map((m) => (
          <button
            key={m}
            className={`chip ${mag === m ? 'selected' : ''}`}
            onClick={() => pick(m)}
          >
            {MAG[m].label}
          </button>
        ))}
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">F1 名次（五组配置中）</div>
          <div className="v">{RANK.indexOf(mag) + 1} / 5</div>
        </div>
        <div className="metric">
          <div className="l">F1</div>
          <div className="v">{MAG[mag].f1.toFixed(2)}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M62;
