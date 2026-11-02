import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawItem,
  drawBox,
  drawList,
  drawThread,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/roomKit';

// Module 2.1 — click one of four marker boxes, then one of four list lines.
// One thread connects them and shows the word-region alignment score; the score band
// picks the colour (>= 0.8 green / 0.4-0.8 blue / < 0.4 red).

const W = 1080;
const H = 280;

const ITEMS = [
  { x: 50, y: 110, w: 40, h: 52, kind: 'bottle' as const },
  { x: 180, y: 110, w: 40, h: 52, kind: 'bottle' as const },
  { x: 300, y: 114, w: 44, h: 44, kind: 'cup' as const },
  { x: 430, y: 110, w: 50, h: 52, kind: 'frame' as const },
];

const LINES = ['两个注射器', '小药瓶', '那块表', '窗外的景'];

// Illustrative 4x4 score table: high on the diagonal, plus one off-diagonal high score
// (two different objects both match the same line).
const SCORE = [
  [0.86, 0.31, 0.12, 0.55],
  [0.22, 0.91, 0.18, 0.47],
  [0.15, 0.27, 0.83, 0.62],
  [0.11, 0.74, 0.21, 0.38],
];

const LX = 660;
const LY = 40;
const LW = 360;
const LH = 170;
const ROW_H = (LH - 14) / 4;
const rowCenter = (i: number) => LY + 8 + i * ROW_H + ROW_H / 2;

const cx = (i: number) => ITEMS[i].x + ITEMS[i].w / 2;
const cy = (i: number) => ITEMS[i].y + ITEMS[i].h / 2;
const bw = (i: number) => ITEMS[i].w + 18;

const bandColor = (s: number) => (s >= 0.8 ? COLORS.thread : s >= 0.4 ? COLORS.box : COLORS.warn);
const bandClass = (s: number) => (s >= 0.8 ? 'good' : s >= 0.4 ? '' : 'bad');

function bandText(s: number): string {
  if (s >= 0.8) return `这一圈和这一行对得很准：对齐分 ${s.toFixed(2)}。`;
  if (s >= 0.4) return `对得上一半：${s.toFixed(2)}，还不足以判定。`;
  return `明显不是这一行：${s.toFixed(2)}。`;
}

// Point on the same cubic used by drawThread.
function threadPoint(t: number, a: [number, number], b: [number, number]): [number, number] {
  const c1x = (a[0] + b[0]) / 2;
  const c2x = c1x;
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b[0],
    u * u * u * a[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t * t * t * b[1],
  ];
}

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [pair, setPair] = useState({ box: 0, line: 0 });
  const stateRef = useRef({ box: 0, line: 0 });
  const [feedback, setFeedback] = useState({
    text: '点一个圈、再点一行，看它们对不上的分数。',
    cls: '',
  });

  const score = SCORE[pair.box][pair.line];

  const pick = (box: number, line: number) => {
    stateRef.current = { box, line };
    setPair({ box, line });
    const s = SCORE[box][line];
    setFeedback({ text: bandText(s), cls: bandClass(s) });
  };

  const { ref } = useCanvas<{ box: number; line: number }>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      drawLabel(ctx, '点圈', 46, 84, { color: COLORS.muted, size: 13 });
      drawLabel(ctx, '点行', 652, 30, { color: COLORS.muted, size: 13 });

      // the clutter
      ITEMS.forEach((it) => {
        drawItem(ctx, it.x, it.y, it.w, it.h, { kind: it.kind });
      });

      // four marker boxes; the chosen one is orange and heavier
      ITEMS.forEach((_, i) => {
        const on = s.box === i;
        drawBox(ctx, cx(i), cy(i), bw(i), ITEMS[i].h + 18, {
          color: on ? COLORS.accent : COLORS.box,
          weight: on ? 3 : 2,
        });
        if (on) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx(i) - bw(i) / 2, cy(i) - (ITEMS[i].h + 18) / 2, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.accent;
          ctx.fill();
          ctx.restore();
        }
      });

      // the list, with the chosen line highlighted
      drawList(ctx, LX, LY, LW, LH, { lines: 4, active: s.line, labels: LINES });

      // the thread + alignment score between the chosen box and the chosen line
      const from: [number, number] = [cx(s.box) + bw(s.box) / 2 + 2, cy(s.box)];
      const to: [number, number] = [LX + 6, rowCenter(s.line)];
      const val = SCORE[s.box][s.line];
      const color = bandColor(val);

      drawThread(ctx, from, to, { active: val >= 0.4, muted: val < 0.4 });
      ctx.save();
      ctx.fillStyle = color;
      for (let k = 1; k <= 7; k += 1) {
        const pt = threadPoint(k / 8, from, to);
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - 10];
      ctx.save();
      ctx.beginPath();
      ctx.arc(mid[0], mid[1], 17, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.room;
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, val.toFixed(2), mid[0], mid[1] + 6, {
        color: COLORS.room,
        size: 15,
        align: 'center',
        bold: true,
      });

      drawLegend(ctx, LX, 246, [
        { color: COLORS.thread, text: '对得上' },
        { color: COLORS.box, text: '一半' },
        { color: COLORS.warn, text: '不是' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;

    for (let i = 0; i < ITEMS.length; i += 1) {
      if (Math.abs(x - cx(i)) <= 40 && Math.abs(y - cy(i)) <= 38) {
        pick(i, stateRef.current.line);
        return;
      }
    }
    if (x >= LX && x <= LX + LW) {
      for (let i = 0; i < 4; i += 1) {
        const top = LY + 8 + i * ROW_H;
        if (y >= top && y <= top + ROW_H) {
          pick(stateRef.current.box, i);
          return;
        }
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onPointerDown={onPointer}
        style={{ cursor: 'crosshair' }}
        aria-label="点击一个圈、再点击一行，查看对齐分"
      />
      <div className="ctrl">
        <span>
          圈 <span className="val">{pair.box + 1}</span> 行{' '}
          <span className="val">{pair.line + 1}</span>
        </span>
        <button
          type="button"
          className="chip"
          onClick={() => {
            pick(0, 0);
          }}
        >
          重置
        </button>
        <span className="val">{score.toFixed(2)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
