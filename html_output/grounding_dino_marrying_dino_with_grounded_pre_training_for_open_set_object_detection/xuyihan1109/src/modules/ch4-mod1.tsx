import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPitch,
  drawPlayer,
  drawRing,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/pitchKit';

// Module 4.1 — language-guided query selection.
// One slider (thr) drives the canvas, the score list and the feedback zone.

const W = 1080;
const H = 280;

const GRID = { x: 40, y: 52, w: 600, h: 196 };
const ROWS = 4;
const COLS = 6;
const CW = GRID.w / COLS;
const CH = GRID.h / ROWS;

// 12 illustrative match scores (0.31–0.88), one per occupied token position.
const CELLS = [
  { r: 0, c: 1, s: 0.88 },
  { r: 0, c: 4, s: 0.82 },
  { r: 1, c: 0, s: 0.76 },
  { r: 1, c: 3, s: 0.71 },
  { r: 2, c: 1, s: 0.66 },
  { r: 2, c: 5, s: 0.58 },
  { r: 3, c: 3, s: 0.52 },
  { r: 0, c: 2, s: 0.47 },
  { r: 1, c: 5, s: 0.41 },
  { r: 2, c: 0, s: 0.38 },
  { r: 3, c: 1, s: 0.34 },
  { r: 3, c: 4, s: 0.31 },
];
const SCORES = CELLS.map((c) => c.s).sort((a, b) => b - a);
const TOP_N = 8;

const AXIS = { x: 700, w: 280, top: 78, row: 22 };

function zone(thr: number): { text: string; cls: string } {
  const kept = SCORES.filter((s) => s > thr).length;
  const shown = thr.toFixed(2);
  if (kept > TOP_N) {
    return {
      text: `阈值 ${shown}：圈了 ${kept} 个，太多——decoder 看不过来，也更容易圈错。`,
      cls: 'bad',
    };
  }
  if (kept >= 4) {
    return { text: `阈值 ${shown}：圈中 ${kept} 个位置，规模合适。`, cls: 'good' };
  }
  return { text: `阈值 ${shown}：只圈了 ${kept} 个，可能漏掉真正的人。`, cls: '' };
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ thr: 0.55 });
  const [thr, setThr] = useState(0.55);
  const feedback = zone(thr);

  const draw = (ctx: CanvasRenderingContext2D, time: number, s: { thr: number }) => {
    clearScene(ctx, W, H, '先圈苗子');
    const keptCells = CELLS.filter((c) => c.s > s.thr);
    drawPitch(ctx, GRID.x, GRID.y, GRID.w, GRID.h, {
      rows: ROWS,
      cols: COLS,
      highlight: keptCells.map((c) => ({ r: c.r, c: c.c })),
    });
    CELLS.forEach((c) => {
      const cx = GRID.x + (c.c + 0.5) * CW;
      const cy = GRID.y + (c.r + 0.5) * CH;
      const on = c.s > s.thr;
      drawPlayer(ctx, cx, cy, 0.95, { dim: !on, kind: c.r === 2 ? 'run' : 'stand' });
      if (on) {
        drawRing(ctx, cx, cy, 16 + Math.sin(time / 420 + c.c) * 0.7, {
          color: COLORS.ring,
          weight: 3,
        });
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.ring;
        ctx.fill();
        ctx.restore();
      }
    });

    // score list on the right: the top 8 positions, threshold as a vertical reference line
    drawLabel(ctx, 'Nq=900', AXIS.x, 64, { size: 13, color: COLORS.muted });
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(AXIS.x, AXIS.top - 14);
    ctx.lineTo(AXIS.x, AXIS.top + (TOP_N - 1) * AXIS.row + 20);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const top = SCORES.slice(0, TOP_N);
    top.forEach((v, i) => {
      const y = AXIS.top + i * AXIS.row;
      const on = v > s.thr;
      ctx.save();
      ctx.globalAlpha = on ? 1 : 0.4;
      ctx.beginPath();
      ctx.rect(AXIS.x + 2, y, Math.max(3, v * AXIS.w), 12);
      ctx.fillStyle = on ? COLORS.ring : COLORS.muted;
      ctx.fill();
      ctx.restore();
      drawLabel(ctx, v.toFixed(2), AXIS.x + AXIS.w + 6, y + 11, {
        size: 12,
        color: on ? COLORS.ink : COLORS.muted,
      });
    });

    // threshold reference line across the bars
    const tx = AXIS.x + 2 + s.thr * AXIS.w;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tx, AXIS.top - 14);
    ctx.lineTo(tx, AXIS.top + (TOP_N - 1) * AXIS.row + 20);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COLORS.box;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    drawLegend(ctx, 40, 266, [
      { color: COLORS.ring, text: '圈中' },
      { color: COLORS.muted, text: '未中' },
      { color: COLORS.box, text: '阈值线' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.thr = v;
    setThr(v);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          阈值 <span className="val">{thr.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.2}
          max={0.9}
          step={0.01}
          value={thr}
          onChange={onChange}
          aria-label="分数阈值"
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
