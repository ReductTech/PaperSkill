import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawBeam,
  drawDesks,
  drawGlance,
  drawKid,
  drawLabel,
  drawLegend,
  drawRoster,
  useCanvas,
} from '../lib/classKit';

const W = 1080;
const H = 280;
const NAMES = ['小明', '小红', '小刚'];

const BOOK_X = 30;
const BOOK_Y = 50;
const BOOK_W = 180;
const BOOK_H = 150;
const ROW_H = (BOOK_H - 10) / 3;

const DESK_X = 300;
const DESK_Y = 55;
const DESK_W = 270;
const DESK_H = 150;
const KID_Y = 138;

const GRID_X = 700;
const GRID_Y = 58;
const CELL = 20;
const GAP = 16;

const kidX = (c: number): number => DESK_X + (c + 0.5) * (DESK_W / 3);
const rowY = (i: number): number => BOOK_Y + 6 + i * ROW_H + ROW_H * 0.58;

type Dir = 'one' | 'two';
type ViewState = { dir: Dir; kid: number };
type Fb = { text: string; cls: string };

const TWO: Fb = { text: '双向：孩子桌上的信息回流，册子上那一行更准了。', cls: '' };
const ONE: Fb = { text: '单向：名字只影响看哪里，自己不会更新。', cls: 'bad' };

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<ViewState>({ dir: 'two', kid: 0 });
  const [dir, setDir] = useState<Dir>('two');
  const [kid, setKid] = useState(0);
  const [fb, setFb] = useState<Fb>(TWO);
  const update = dir === 'two' ? 0.18 + kid * 0.04 : 0;

  const setDirection = (d: Dir) => {
    stateRef.current = { dir: d, kid: stateRef.current.kid };
    setDir(d);
    setFb(d === 'two' ? TWO : ONE);
  };

  const pickKid = (k: number) => {
    stateRef.current = { dir: stateRef.current.dir, kid: k };
    setKid(k);
    setFb(stateRef.current.dir === 'two' ? TWO : ONE);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (x >= DESK_X && x <= DESK_X + DESK_W && y >= DESK_Y - 25 && y <= DESK_Y + DESK_H) {
      const col = Math.floor((x - DESK_X) / (DESK_W / 3));
      if (col >= 0 && col < 3) pickKid(col);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, _time: number, st: ViewState) => {
    clearScene(ctx, W, H);
    const two = st.dir === 'two';

    // Thin divider between the classroom scene and the patch panel.
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(660, 40);
    ctx.lineTo(660, 228);
    ctx.stroke();
    ctx.restore();

    drawDesks(ctx, DESK_X, DESK_Y, DESK_W, DESK_H, {
      rows: 1,
      cols: 3,
      highlight: [{ r: 0, c: st.kid }],
    });
    for (let c = 0; c < 3; c += 1) {
      drawKid(ctx, kidX(c), KID_Y, 1.3, {
        kind: c === st.kid ? 'look' : 'sit',
        highlight: c === st.kid,
      });
    }
    drawRoster(ctx, BOOK_X, BOOK_Y, BOOK_W, BOOK_H, {
      lines: 3,
      labels: NAMES,
      active: st.kid,
    });

    // Text -> image is always on: the name decides where the teacher looks.
    drawBeam(ctx, [BOOK_X + BOOK_W, rowY(st.kid) - 4], [kidX(st.kid), KID_Y - 20], {
      active: true,
    });
    // Image -> text is the half being switched; grey and dashed in one-way mode.
    drawGlance(ctx, [kidX(st.kid) + 16, KID_Y + 20], [BOOK_X + BOOK_W, rowY(st.kid) + 10], {
      active: two,
    });

    // 3 scales x 3x3 patches = 27 pooled patch tokens.
    for (let layer = 0; layer < 3; layer += 1) {
      const gx = GRID_X + layer * (3 * CELL + GAP);
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          const hot = r === 1 && c === st.kid;
          ctx.fillStyle = two
            ? hot
              ? 'rgba(109,91,208,0.62)'
              : 'rgba(109,91,208,0.18)'
            : hot
            ? 'rgba(159,179,168,0.30)'
            : 'rgba(159,179,168,0.10)';
          ctx.fillRect(gx + c * CELL, GRID_Y + r * CELL, CELL - 2, CELL - 2);
          ctx.strokeStyle = two
            ? hot
              ? COLORS.back
              : 'rgba(109,91,208,0.5)'
            : hot
            ? COLORS.chalkDim
            : 'rgba(159,179,168,0.45)';
          ctx.lineWidth = hot ? 2 : 1;
          ctx.strokeRect(gx + c * CELL, GRID_Y + r * CELL, CELL - 2, CELL - 2);
        }
      }
    }
    drawLabel(ctx, '27 格', GRID_X, GRID_Y + 3 * CELL + 20, {
      color: COLORS.chalkDim,
      size: 13,
    });

    // How much the pooled patches write back into the word vector.
    const barX = 700;
    const barY = 168;
    const barW = 300;
    const barH = 20;
    ctx.fillStyle = 'rgba(61,83,71,0.85)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = two ? COLORS.back : COLORS.muted;
    ctx.fillRect(barX + 1.5, barY + 1.5, (barW - 3) * (update / 0.3), barH - 3);
    drawLabel(ctx, '更新量', barX, barY + barH + 16, { color: COLORS.chalkDim, size: 13 });

    drawLegend(ctx, 40, 262, [
      { color: COLORS.back, text: '双向回流' },
      { color: COLORS.book, text: '名字→座位' },
      { color: COLORS.muted, text: '单向关闭' },
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
        <label>方向</label>
        <button
          type="button"
          className={`chip${dir === 'one' ? ' selected' : ''}`}
          onClick={() => setDirection('one')}
          aria-pressed={dir === 'one'}
        >
          只有文本→图像
        </button>
        <button
          type="button"
          className={`chip${dir === 'two' ? ' selected' : ''}`}
          onClick={() => setDirection('two')}
          aria-pressed={dir === 'two'}
        >
          双向
        </button>
        <label>
          回流 <span className="val">+{update.toFixed(2)}</span>
        </label>
      </div>
      <div className="ctrl">
        <label>点一个孩子</label>
        {NAMES.map((n, i) => (
          <button
            key={n}
            type="button"
            className={`chip${i === kid ? ' selected' : ''}`}
            onClick={() => pickKid(i)}
            aria-pressed={i === kid}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch6Mod1;
