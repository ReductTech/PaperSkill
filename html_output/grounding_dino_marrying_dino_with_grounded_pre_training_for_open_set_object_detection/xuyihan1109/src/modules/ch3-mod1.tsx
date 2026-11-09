import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawCard,
  drawFrame,
  drawLabel,
  drawLegend,
  drawLink,
  drawPitch,
  drawPlayer,
  useCanvas,
} from '../lib/pitchKit';

const W = 1080;
const H = 280;

type Side = 'card' | 'pitch';
type Dir = 'one' | 'two';
type Focus = 'card' | 'pitch' | 'link';

interface Ch3State {
  sel: Side;
  dir: Dir;
  focus: Focus;
}

const CARD = { x: 52, y: 72, w: 136, h: 160 };
const PITCH = { x: 306, y: 72, w: 300, h: 160 };
const CARD_R: [number, number] = [CARD.x + CARD.w, CARD.y + CARD.h / 2];
const PITCH_L: [number, number] = [PITCH.x - 4, PITCH.y + PITCH.h / 2];
const REV_FROM: [number, number] = [PITCH_L[0], PITCH_L[1] + 14];
const REV_TO: [number, number] = [CARD_R[0], CARD_R[1] + 14];

const PANEL = { x: 656, y: 56, w: 384, h: 196 };
const ROW_X = 676;
const ROW_W = 344;
const ROW_Y = [100, 152, 204];

const ATTN: Array<{ key: 'self' | 'i2t' | 't2i'; color: string; value: number; name: string }> = [
  { key: 'self', color: COLORS.box, value: 0.94, name: '自注意力' },
  { key: 'i2t', color: COLORS.fuse, value: 0.8, name: '图→文' },
  { key: 't2i', color: COLORS.confirm, value: 0.66, name: '文→图' },
];

const SPOTS = [
  { x: 0.18, y: 0.3 },
  { x: 0.5, y: 0.42 },
  { x: 0.8, y: 0.32 },
  { x: 0.3, y: 0.76 },
  { x: 0.66, y: 0.72 },
];

function feedbackFor(dir: Dir, focus: Focus): { text: string; cls: string } {
  if (dir === 'one') {
    return { text: '只单向：只有一边能看见另一边，对齐会偏。', cls: 'bad' };
  }
  if (focus === 'card') {
    return { text: '从卡片出发：每个词都会去看图上相关的位置。', cls: '' };
  }
  if (focus === 'pitch') {
    return { text: '从球场出发：每个位置也会回头看它对应的词。', cls: '' };
  }
  return { text: '双向：卡片的词和图上的位置互相更新。', cls: '' };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 1 | -1,
  color: string
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dir * 11, y - 5);
  ctx.lineTo(x - dir * 11, y + 5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export const Ch3Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch3State>({ sel: 'card', dir: 'two', focus: 'link' });
  const [ui, setUi] = useState<Ch3State>({ sel: 'card', dir: 'two', focus: 'link' });

  const { ref } = useCanvas<Ch3State>((ctx, time, s) => {
    clearScene(ctx, W, H);
    const two = s.dir === 'two';
    const pulse = 0.8 + 0.2 * Math.sin(time / 300);

    drawPitch(ctx, PITCH.x, PITCH.y, PITCH.w, PITCH.h, { rows: 2, cols: 3 });
    SPOTS.forEach((spot) => {
      drawPlayer(ctx, PITCH.x + spot.x * PITCH.w, PITCH.y + spot.y * PITCH.h, 1, {});
    });
    drawCard(ctx, CARD.x, CARD.y, CARD.w, CARD.h, {
      lines: 3,
      active: s.sel === 'card' ? 1 : undefined,
    });

    // The chosen hotspot wears the amber ring; the other one stays untouched.
    if (s.sel === 'card') {
      drawFrame(ctx, CARD.x + CARD.w / 2, CARD.y + CARD.h / 2, CARD.w + 18, CARD.h + 18, {
        color: COLORS.ring,
        weight: 3,
      });
    } else {
      drawFrame(ctx, PITCH.x + PITCH.w / 2, PITCH.y + PITCH.h / 2, PITCH.w + 18, PITCH.h + 18, {
        color: COLORS.ring,
        weight: 3,
      });
    }

    // Card -> pitch: the one direction that always exists.
    ctx.save();
    ctx.globalAlpha = two ? pulse : 1;
    drawLink(ctx, CARD_R, PITCH_L, { active: true });
    ctx.restore();
    drawArrow(ctx, PITCH_L[0], PITCH_L[1], 1, COLORS.fuse);

    const flow = (time % 1500) / 1500;
    ctx.save();
    ctx.fillStyle = COLORS.fuse;
    ctx.globalAlpha = two ? 0.9 : 0.55;
    ctx.beginPath();
    ctx.arc(
      CARD_R[0] + (PITCH_L[0] - CARD_R[0]) * flow,
      CARD_R[1] + (PITCH_L[1] - CARD_R[1]) * flow,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Pitch -> card: grey dashes once the mode is one-way.
    if (two) {
      ctx.save();
      ctx.globalAlpha = pulse;
      drawLink(ctx, REV_FROM, REV_TO, { active: true });
      ctx.restore();
      drawArrow(ctx, REV_TO[0], REV_TO[1], -1, COLORS.fuse);
      ctx.save();
      ctx.fillStyle = COLORS.fuse;
      ctx.beginPath();
      ctx.arc(
        REV_FROM[0] + (REV_TO[0] - REV_FROM[0]) * flow,
        REV_FROM[1] + (REV_TO[1] - REV_FROM[1]) * flow,
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    } else {
      drawLink(ctx, REV_FROM, REV_TO, { active: false });
      drawArrow(ctx, REV_TO[0], REV_TO[1], -1, COLORS.axis);
      const midX = (REV_FROM[0] + REV_TO[0]) / 2;
      ctx.save();
      ctx.strokeStyle = COLORS.bad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(midX - 5, REV_FROM[1] - 5);
      ctx.lineTo(midX + 5, REV_FROM[1] + 5);
      ctx.moveTo(midX + 5, REV_FROM[1] - 5);
      ctx.lineTo(midX - 5, REV_FROM[1] + 5);
      ctx.stroke();
      ctx.restore();
    }

    const endPoint = s.sel === 'card' ? CARD_R : PITCH_L;
    ctx.save();
    ctx.beginPath();
    ctx.arc(endPoint[0], endPoint[1], 5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ring;
    ctx.fill();
    ctx.restore();

    drawLabel(ctx, '卡片', CARD.x, CARD.y - 14, { color: COLORS.ink, size: 15, bold: true });
    drawLabel(ctx, '球场', PITCH.x, PITCH.y - 14, { color: COLORS.ink, size: 15, bold: true });

    // The layer's three attention operations.
    ctx.save();
    ctx.beginPath();
    ctx.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    ctx.fillStyle = COLORS.card;
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ATTN.forEach((row, i) => {
      const y = ROW_Y[i];
      const on = row.key !== 't2i' || two;
      const focused =
        (s.sel === 'card' && row.key === 't2i') || (s.sel === 'pitch' && row.key === 'i2t');

      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = COLORS.line;
      ctx.fillRect(ROW_X, y - 13, ROW_W, 18);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = on ? 0.9 : 0.28;
      ctx.fillStyle = on ? row.color : COLORS.muted;
      ctx.fillRect(ROW_X, y - 13, ROW_W * (on ? row.value : 0.1), 18);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ROW_X, y + 14);
      ctx.lineTo(ROW_X + ROW_W, y + 14);
      ctx.lineWidth = on ? 3 : 1.5;
      ctx.strokeStyle = on ? row.color : COLORS.axis;
      ctx.setLineDash(on ? [] : [6, 5]);
      ctx.stroke();
      ctx.restore();

      if (focused) {
        drawFrame(ctx, ROW_X + ROW_W / 2, y, ROW_W + 26, 44, {
          color: COLORS.ring,
          weight: 2.5,
        });
      }
    });

    drawLegend(
      ctx,
      PANEL.x,
      262,
      ATTN.map((row) => ({ color: row.color, text: row.name }))
    );
  }, W, H, stateRef);

  const pick = (side: Side) => {
    const next: Ch3State = { ...stateRef.current, sel: side, focus: side };
    stateRef.current = next;
    setUi(next);
  };

  const choose = (dir: Dir) => {
    const next: Ch3State = {
      ...stateRef.current,
      dir,
      focus: dir === 'two' ? 'link' : stateRef.current.focus,
    };
    stateRef.current = next;
    setUi(next);
  };

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    if (
      x >= CARD.x - 12 &&
      x <= CARD.x + CARD.w + 12 &&
      y >= CARD.y - 12 &&
      y <= CARD.y + CARD.h + 12
    ) {
      pick('card');
      return;
    }
    if (
      x >= PITCH.x - 12 &&
      x <= PITCH.x + PITCH.w + 12 &&
      y >= PITCH.y - 12 &&
      y <= PITCH.y + PITCH.h + 12
    ) {
      pick('pitch');
    }
  };

  const feedback = feedbackFor(ui.dir, ui.focus);

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${ui.sel === 'card' ? 'selected' : ''}`}
            onClick={() => pick('card')}
          >
            卡片
          </button>
          <button
            type="button"
            className={`chip ${ui.sel === 'pitch' ? 'selected' : ''}`}
            onClick={() => pick('pitch')}
          >
            球场
          </button>
        </div>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${ui.dir === 'one' ? 'selected' : ''}`}
            onClick={() => choose('one')}
          >
            单向
          </button>
          <button
            type="button"
            className={`chip ${ui.dir === 'two' ? 'selected' : ''}`}
            onClick={() => choose('two')}
          >
            双向
          </button>
        </div>
        <label>
          启用的注意力 <span className="val">{ui.dir === 'two' ? '3 / 3' : '2 / 3'}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
