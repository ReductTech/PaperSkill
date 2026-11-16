import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDesks,
  drawKid,
  drawLabel,
  drawLegend,
  drawRoster,
  useCanvas,
} from '../lib/classKit';

const W = 1080;
const H = 280;
const NAMES = ['小明', '小红', '小刚', '小美'];

// Illustrative 4x4 similarity matrix — NOT reported paper numbers.
// The diagonal is high; 小红 also scores 0.74 on seat 2, i.e. one name fits two children.
const SIM = [
  [0.86, 0.12, 0.12, 0.12],
  [0.12, 0.86, 0.74, 0.12],
  [0.12, 0.55, 0.86, 0.12],
  [0.12, 0.12, 0.12, 0.86],
];

const DESK_X = 30;
const DESK_Y = 70;
const DESK_W = 520;
const DESK_H = 150;
const KID_Y = 146;
const KID_SCALE = 1.35;

const BOOK_X = 700;
const BOOK_Y = 40;
const BOOK_W = 330;
const BOOK_H = 180;
const ROW_H = (BOOK_H - 10) / 4;

const seatX = (c: number): number => DESK_X + (c + 0.5) * (DESK_W / 4);
const rowY = (i: number): number => BOOK_Y + 6 + i * ROW_H + ROW_H * 0.58;

type PairState = { name: number; seat: number };
type Fb = { text: string; cls: string };

const INITIAL: Fb = { text: '点一行名字、再点一个座位，看相似度。', cls: '' };

function bandColor(sim: number): string {
  if (sim >= 0.8) return COLORS.fast;
  if (sim >= 0.4) return COLORS.name;
  return COLORS.bad;
}

function feedbackFor(sim: number): Fb {
  if (sim >= 0.8) return { text: '对上了：相似度 0.86，这一行就是他。', cls: 'good' };
  if (sim >= 0.4) {
    return {
      text: sim === 0.74 ? '有点像：0.74，还定不下来。' : '有点像：0.55，还定不下来。',
      cls: '',
    };
  }
  return { text: '不是他：0.12。', cls: 'bad' };
}

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<PairState>({ name: 0, seat: 0 });
  const [name, setName] = useState(0);
  const [seat, setSeat] = useState(0);
  const [fb, setFb] = useState<Fb>(INITIAL);
  const sim = SIM[name][seat];

  const pickName = (i: number) => {
    const s = stateRef.current.seat;
    stateRef.current = { name: i, seat: s };
    setName(i);
    setFb(feedbackFor(SIM[i][s]));
  };

  const pickSeat = (i: number) => {
    const n = stateRef.current.name;
    stateRef.current = { name: n, seat: i };
    setSeat(i);
    setFb(feedbackFor(SIM[n][i]));
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (x >= BOOK_X && x <= BOOK_X + BOOK_W && y >= BOOK_Y && y <= BOOK_Y + BOOK_H) {
      const row = Math.floor((y - BOOK_Y - 6) / ROW_H);
      if (row >= 0 && row < 4) pickName(row);
      return;
    }
    if (x >= DESK_X && x <= DESK_X + DESK_W && y >= DESK_Y - 20 && y <= DESK_Y + DESK_H) {
      const col = Math.floor((x - DESK_X) / (DESK_W / 4));
      if (col >= 0 && col < 4) pickSeat(col);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, _time: number, st: PairState) => {
    clearScene(ctx, W, H);
    const value = SIM[st.name][st.seat];
    const color = bandColor(value);
    const from: [number, number] = [BOOK_X, rowY(st.name)];
    const to: [number, number] = [seatX(st.seat), KID_Y - 18];

    drawDesks(ctx, DESK_X, DESK_Y, DESK_W, DESK_H, {
      rows: 1,
      cols: 4,
      highlight: [{ r: 0, c: st.seat }],
    });
    for (let c = 0; c < 4; c += 1) {
      drawKid(ctx, seatX(c), KID_Y, KID_SCALE, {
        kind: c === st.seat ? 'look' : 'sit',
        highlight: c === st.seat,
      });
    }
    drawRoster(ctx, BOOK_X, BOOK_Y, BOOK_W, BOOK_H, {
      lines: 4,
      labels: NAMES,
      active: st.name,
    });

    // The rival seat of the same name: this is what "one name fits two children" looks like.
    const rival =
      value >= 0.6 ? SIM[st.name].findIndex((v, i) => i !== st.seat && v >= 0.6) : -1;
    if (rival >= 0) {
      ctx.save();
      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = 'rgba(159,179,168,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(seatX(rival), KID_Y - 18);
      ctx.stroke();
      ctx.restore();
    }

    // Selected name -> selected seat, colored by the similarity band.
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
    const ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
    ctx.beginPath();
    ctx.moveTo(to[0], to[1]);
    ctx.lineTo(to[0] - 10 * Math.cos(ang - 0.4), to[1] - 10 * Math.sin(ang - 0.4));
    ctx.moveTo(to[0], to[1]);
    ctx.lineTo(to[0] - 10 * Math.cos(ang + 0.4), to[1] - 10 * Math.sin(ang + 0.4));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(from[0], from[1], 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    // Similarity readout sits in the gap between the desks and the book.
    const midY = (from[1] + to[1]) / 2;
    ctx.fillStyle = 'rgba(34,53,47,0.9)';
    ctx.fillRect(BOOK_X - 96, midY - 32, 80, 44);
    drawLabel(ctx, '相似度', BOOK_X - 18, midY - 12, {
      color: COLORS.chalkDim,
      size: 12,
      align: 'right',
    });
    drawLabel(ctx, value.toFixed(2), BOOK_X - 18, midY + 8, {
      color: COLORS.chalk,
      size: 17,
      align: 'right',
      bold: true,
    });

    drawLegend(ctx, 40, 262, [
      { color: COLORS.fast, text: '≥0.8 对上' },
      { color: COLORS.name, text: '0.4–0.8 有点像' },
      { color: COLORS.bad, text: '<0.4 不是' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <label>名字</label>
        {NAMES.map((n, i) => (
          <button
            key={n}
            type="button"
            className={`chip${i === name ? ' selected' : ''}`}
            onClick={() => pickName(i)}
            aria-pressed={i === name}
          >
            {n}
          </button>
        ))}
        <label>座位</label>
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            type="button"
            className={`chip${i === seat ? ' selected' : ''}`}
            onClick={() => pickSeat(i)}
            aria-pressed={i === seat}
          >
            {i + 1}
          </button>
        ))}
        <label>
          示意相似度 <span className="val">{sim.toFixed(2)}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch2Mod1;
