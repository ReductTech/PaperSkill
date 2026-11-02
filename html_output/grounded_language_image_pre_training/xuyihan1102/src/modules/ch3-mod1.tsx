import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawBox,
  drawItem,
  drawLabel,
  drawLegend,
  drawList,
  drawMeter,
  drawThread,
  useCanvas,
} from '../lib/roomKit';

const W = 1080;
const H = 280;
const THRESHOLD = 0.7;

type Mode = 'fixed' | 'free';

interface Pos {
  x: number;
  y: number;
}

interface Ch3State {
  pos: Pos;
  mode: Mode;
  dragging: boolean;
  dragOffset: Pos;
}

interface UiState {
  score: number;
  mode: Mode;
}

const ROOM = { x: 46, y: 36, w: 548, h: 206 };
const BOX_W = 84;
const BOX_H = 96;
// The marker-frame centre plays inside an inset area, so the whole frame stays on canvas.
const PLAY = {
  x: ROOM.x + BOX_W / 2,
  y: ROOM.y + BOX_H / 2,
  w: ROOM.w - BOX_W,
  h: ROOM.h - BOX_H,
};
const TARGET = {
  x: (ROOM.x + 0.62 * ROOM.w - PLAY.x) / PLAY.w,
  y: (ROOM.y + 0.52 * ROOM.h - PLAY.y) / PLAY.h,
};
const PANEL = { x: 664, y: 32, w: 376, h: 216 };
const LIST = { x: 690, y: 44, w: 320, h: 64 };

const OBJECTS: Array<{
  kind: 'bottle' | 'box' | 'cup' | 'plant' | 'frame';
  x: number;
  y: number;
  w: number;
  h: number;
}> = [
  { kind: 'bottle', x: 0.15, y: 0.55, w: 36, h: 54 },
  { kind: 'cup', x: 0.3, y: 0.58, w: 40, h: 38 },
  { kind: 'box', x: 0.45, y: 0.63, w: 54, h: 46 },
  { kind: 'bottle', x: 0.62, y: 0.52, w: 46, h: 62 },
  { kind: 'plant', x: 0.78, y: 0.5, w: 48, h: 60 },
  { kind: 'frame', x: 0.89, y: 0.56, w: 38, h: 44 },
];

function alignmentScore(pos: Pos): number {
  const dist = Math.hypot(pos.x - TARGET.x, pos.y - TARGET.y);
  return clamp(1 - dist / 0.9, 0, 1);
}

function toCanvas(pos: Pos): Pos {
  return {
    x: PLAY.x + pos.x * PLAY.w,
    y: PLAY.y + pos.y * PLAY.h,
  };
}

function normalise(clientX: number, clientY: number, rect: DOMRect, offset: Pos): Pos {
  const px = ((clientX - rect.left) / rect.width) * W + offset.x;
  const py = ((clientY - rect.top) / rect.height) * H + offset.y;
  return {
    x: clamp((px - PLAY.x) / PLAY.w, 0, 1),
    y: clamp((py - PLAY.y) / PLAY.h, 0, 1),
  };
}

function hitFeedback(score: number): { text: string; cls: string } {
  if (score >= THRESHOLD) {
    return { text: `套住了：对齐分 ${score.toFixed(2)}，判定为这一行。`, cls: 'good' };
  }
  return { text: `还没套住：${score.toFixed(2)}，继续拖。`, cls: '' };
}

const INITIAL_POS: Pos = { x: 0.3, y: 0.5 };

export const Ch3Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch3State>({
    pos: { ...INITIAL_POS },
    mode: 'free',
    dragging: false,
    dragOffset: { x: 0, y: 0 },
  });
  const [ui, setUi] = useState<UiState>({ score: alignmentScore(INITIAL_POS), mode: 'free' });
  const [dragging, setDragging] = useState(false);
  const [feedback, setFeedback] = useState({ text: '拖动框，看分数怎么变。', cls: '' });

  const { ref } = useCanvas<Ch3State>((ctx, _time, s) => {
    clearScene(ctx, W, H);
    const score = alignmentScore(s.pos);
    const fixed = s.mode === 'fixed';
    const hit = score >= THRESHOLD;
    const bp = toCanvas(s.pos);

    // The clutter: one target bottle sits among unrelated objects.
    OBJECTS.forEach((o) => {
      const cx = ROOM.x + o.x * ROOM.w;
      const cy = ROOM.y + o.y * ROOM.h;
      drawItem(ctx, cx - o.w / 2, cy - o.h / 2, o.w, o.h, { kind: o.kind });
    });

    // Right-hand score panel.
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    drawBox(ctx, PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h / 2, PANEL.w, PANEL.h, {
      color: COLORS.rule,
      weight: 1.5,
    });

    drawList(ctx, LIST.x, LIST.y, LIST.w, LIST.h, {
      lines: 2,
      active: fixed ? undefined : 0,
    });

    const rowCenterY = LIST.y + 8 + ((LIST.h - 14) / 2) * 0.5;
    if (!fixed && hit) {
      drawThread(ctx, [bp.x + 42, bp.y], [LIST.x, rowCenterY], { active: true });
    }

    // Two score rows: the active list line and the best competing line.
    const alt = clamp(0.55 * (1 - score), 0.05, 0.55);
    drawMeter(ctx, 690, 116, 310, 14, score, { muted: fixed });
    drawMeter(ctx, 690, 136, 310, 12, alt, { muted: true });

    ctx.beginPath();
    ctx.arc(680, 123, 4, 0, Math.PI * 2);
    ctx.fillStyle = fixed ? COLORS.muted : COLORS.accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(680, 142, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.muted;
    ctx.fill();

    // Fixed vocabulary: the whole panel greys out and the verdict says the list is locked.
    if (fixed) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = COLORS.muted;
      ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      ctx.restore();
    }

    drawLabel(ctx, '对齐分', 690, 172, { color: COLORS.muted, size: 14 });
    const status = fixed ? '词表锁定' : hit ? '命中' : '继续';
    const statusColor = fixed ? COLORS.muted : hit ? COLORS.thread : COLORS.box;
    const pillW = fixed ? 100 : 64;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = statusColor;
    ctx.fillRect(690, 184, pillW, 24);
    ctx.restore();
    drawBox(ctx, 690 + pillW / 2, 196, pillW, 24, { color: statusColor, weight: 1.5 });
    drawLabel(ctx, status, 690 + pillW / 2, 202, {
      color: statusColor,
      size: 14,
      bold: true,
      align: 'center',
    });

    // The draggable marker frame.
    const boxColor = fixed ? COLORS.muted : hit ? COLORS.thread : COLORS.box;
    drawBox(ctx, bp.x, bp.y, BOX_W, BOX_H, { color: boxColor, weight: 3, dashed: fixed });
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = boxColor;
    ctx.fill();

    drawLegend(ctx, 46, 266, [
      { color: COLORS.box, text: '标记框' },
      { color: COLORS.thread, text: '对齐' },
      { color: COLORS.muted, text: '锁定' },
    ]);
  }, W, H, stateRef);

  const update = (pos: Pos) => {
    stateRef.current.pos = pos;
    const score = alignmentScore(pos);
    setUi({ score, mode: stateRef.current.mode });
    if (stateRef.current.mode === 'free') {
      setFeedback(hitFeedback(score));
    }
  };

  const changeMode = (mode: Mode) => {
    stateRef.current.mode = mode;
    const score = alignmentScore(stateRef.current.pos);
    setUi({ score, mode });
    if (mode === 'fixed') {
      setFeedback({
        text: '固定类别：只能在这 80 个里选，清单外的东西永远没有名字。',
        cls: 'bad',
      });
    } else {
      setFeedback(hitFeedback(score));
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const bp = toCanvas(stateRef.current.pos);
    if (Math.hypot(px - bp.x, py - bp.y) > 72) return;
    const offset = { x: bp.x - px, y: bp.y - py };
    stateRef.current.dragOffset = offset;
    e.currentTarget.setPointerCapture(e.pointerId);
    stateRef.current.dragging = true;
    setDragging(true);
    update(normalise(e.clientX, e.clientY, rect, offset));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    update(normalise(e.clientX, e.clientY, rect, stateRef.current.dragOffset));
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = false;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const delta = e.shiftKey ? 0.06 : 0.02;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -delta;
    else if (e.key === 'ArrowRight') dx = delta;
    else if (e.key === 'ArrowUp') dy = -delta;
    else if (e.key === 'ArrowDown') dy = delta;
    else return;
    e.preventDefault();
    const current = stateRef.current.pos;
    update({
      x: clamp(current.x + dx, 0, 1),
      y: clamp(current.y + dy, 0, 1),
    });
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        tabIndex={0}
        aria-label="拖动标记框，或用方向键移动"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          stateRef.current.dragging = false;
          setDragging(false);
        }}
        onKeyDown={onKeyDown}
        style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
      />
      <div className="ctrl">
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${ui.mode === 'fixed' ? 'selected' : ''}`}
            onClick={() => changeMode('fixed')}
          >
            固定 80 类
          </button>
          <button
            type="button"
            className={`chip ${ui.mode === 'free' ? 'selected' : ''}`}
            onClick={() => changeMode('free')}
          >
            自由提示
          </button>
        </div>
        <span className="val">对齐分 {ui.score.toFixed(2)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
