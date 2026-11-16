import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawBeam,
  drawDesks,
  drawKid,
  drawLabel,
  drawLegend,
  drawMeter,
  drawName,
  useCanvas,
  clamp,
} from '../lib/classKit';

// Module 5.1 — text-guided CSPLayer (T→I).
// One dominant operation: drag the name chip onto one of the four desk columns
// (pointer or arrow keys); a chip pair switches text guidance on/off.
// Canvas, .feedback and the .val readout all come from the same {col, guide} state.

const W = 1080;
const H = 280;

const SCENE_X = 56;
const SCENE_Y = 64;
const SCENE_W = 540;
const SCENE_H = 176;
const COL_W = SCENE_W / 4;
const CHIP_W = 70;
const CHIP_H = 24;
const NAME = '小明';

// Illustrative per-column channel gate values (0-1); no guidance flattens them.
const GATES: number[][] = [
  [0.88, 0.46, 0.62],
  [0.72, 0.9, 0.41],
  [0.55, 0.68, 0.87],
  [0.8, 0.38, 0.7],
];

interface SceneState {
  col: number;
  guide: boolean;
  drag: boolean;
  px: number;
  py: number;
}

const gateValues = (col: number, guide: boolean): number[] =>
  guide ? GATES[col] : [0.45, 0.45, 0.45];

const scoreOf = (col: number, guide: boolean): number => (guide ? 0.7 + 0.04 * col : 0.46);

function chipRect(s: SceneState): { x: number; y: number; w: number; h: number } {
  const restX = SCENE_X + s.col * COL_W + COL_W / 2 - CHIP_W / 2;
  return {
    x: s.drag ? s.px - CHIP_W / 2 : restX,
    y: s.drag ? s.py - CHIP_H / 2 : 26,
    w: CHIP_W,
    h: CHIP_H,
  };
}

const colAt = (x: number): number => clamp(Math.floor((x - SCENE_X) / COL_W), 0, 3);

/** One channel gate: a flat amber bar, flattened to grey without text guidance. */
function drawGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  v: number,
  active: boolean
): void {
  ctx.save();
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = active ? 0.9 : 0.55;
  ctx.fillStyle = active ? COLORS.book : COLORS.muted;
  ctx.fillRect(x + 1.5, y + 1.5, Math.max(0, (w - 3) * clamp(v, 0, 1)), h - 3);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [col, setCol] = useState(1);
  const [guide, setGuide] = useState(true);
  const [drag, setDrag] = useState(false);
  const stateRef = useRef<SceneState>({ col: 1, guide: true, drag: false, px: 0, py: 0 });

  const draw = (ctx: CanvasRenderingContext2D, time: number, s: SceneState): void => {
    clearScene(ctx, W, H);

    // right-hand measurement panel
    ctx.save();
    ctx.fillStyle = COLORS.board2;
    ctx.fillRect(640, 36, 416, 212);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(640, 36, 416, 212);
    ctx.restore();

    // the classroom
    drawDesks(ctx, SCENE_X, SCENE_Y, SCENE_W, SCENE_H, {
      rows: 2,
      cols: 4,
      highlightCol: s.guide ? s.col : undefined,
    });
    for (let r = 0; r < 2; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        drawKid(ctx, SCENE_X + c * COL_W + COL_W / 2, SCENE_Y + r * 88 + 50, 1.2, {
          kind: s.guide && c === s.col ? 'hand' : 'sit',
          highlight: s.guide && c === s.col,
        });
      }
    }

    // name chip -> column beam
    const chip = chipRect(s);
    const targetX = SCENE_X + s.col * COL_W + COL_W / 2;
    // the name's light shaft falls across that one column
    ctx.save();
    ctx.globalAlpha = s.guide ? 0.16 : 0.06;
    ctx.fillStyle = s.guide ? COLORS.book : COLORS.muted;
    ctx.beginPath();
    ctx.moveTo(chip.x + CHIP_W / 2, chip.y + CHIP_H);
    ctx.lineTo(targetX - COL_W * 0.3, SCENE_Y + SCENE_H);
    ctx.lineTo(targetX + COL_W * 0.3, SCENE_Y + SCENE_H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    drawBeam(ctx, [chip.x + CHIP_W / 2, chip.y + CHIP_H], [targetX, SCENE_Y + 8], {
      active: s.guide,
    });
    drawName(ctx, chip.x, chip.y, { text: NAME, active: s.drag });

    // panel: three channel gates + the resulting score
    drawLabel(ctx, '通道门', 668, 64, { color: COLORS.chalkDim, size: 13 });
    const gates = gateValues(s.col, s.guide);
    for (let i = 0; i < 3; i += 1) {
      drawGate(ctx, 668, 80 + i * 42, 290, 14, gates[i], s.guide);
    }
    drawMeter(ctx, 712, 202, 200, 16, scoreOf(s.col, s.guide), { muted: !s.guide });
    drawLabel(ctx, scoreOf(s.col, s.guide).toFixed(2), 926, 217, {
      color: s.guide ? COLORS.book : COLORS.muted,
      size: 15,
    });

    drawLegend(ctx, 56, 264, [
      { color: COLORS.book, text: '文本引导' },
      { color: COLORS.fast, text: '得分' },
      { color: COLORS.muted, text: '无引导' },
    ]);
  };

  const { ref } = useCanvas<SceneState>(draw, W, H, stateRef);

  const toScene = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = ref.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const applyCol = (next: number): void => {
    if (stateRef.current.col === next) return;
    stateRef.current.col = next;
    setCol(next);
  };

  const applyGuide = (next: boolean): void => {
    stateRef.current.guide = next;
    setGuide(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const p = toScene(e);
    if (!p) return;
    const chip = chipRect(stateRef.current);
    const hit =
      p.x >= chip.x - 10 && p.x <= chip.x + chip.w + 10 && p.y >= chip.y - 10 && p.y <= chip.y + chip.h + 10;
    if (!hit) return;
    stateRef.current.drag = true;
    stateRef.current.px = p.x;
    stateRef.current.py = p.y;
    setDrag(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety; dragging still works without it */
    }
    e.currentTarget.focus();
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const s = stateRef.current;
    if (!s.drag) return;
    const p = toScene(e);
    if (!p) return;
    s.px = clamp(p.x, 24, W - 24);
    s.py = clamp(p.y, 24, 150);
    if (p.x >= SCENE_X && p.x <= SCENE_X + SCENE_W) {
      applyCol(colAt(p.x));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const s = stateRef.current;
    if (!s.drag) return;
    s.drag = false;
    setDrag(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may already be released */
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>): void => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : 3;
    applyCol((stateRef.current.col + step) % 4);
  };

  const score = scoreOf(col, guide);
  const fb = guide
    ? {
        text: `名字照到第 ${col + 1} 列：那一列的特征被放大，得分 ${score.toFixed(2)}。`,
        cls: 'good',
      }
    : { text: '没有文本引导：所有列一视同仁，名字没用上。', cls: 'bad' };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        tabIndex={0}
        aria-label="把名字拖到四列课桌之一，切换文本引导"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl">
        <button
          type="button"
          className={`chip${guide ? '' : ' selected'}`}
          onClick={() => applyGuide(false)}
        >
          没有文本引导
        </button>
        <button
          type="button"
          className={`chip${guide ? ' selected' : ''}`}
          onClick={() => applyGuide(true)}
        >
          有文本引导
        </button>
        <span className="val">
          第 {col + 1} 列 · {score.toFixed(2)}
        </span>
        <span className="step-label">拖名字到某一列，或用方向键换列</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch5Mod1;
