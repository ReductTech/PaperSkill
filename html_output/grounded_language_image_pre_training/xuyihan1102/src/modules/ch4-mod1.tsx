import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawList, drawLabel, drawLegend, useCanvas } from '../lib/roomKit';

// Module 4.1 — sub-word expansion. One operation (step) drives the list line, the word
// chips and the supervision grid; the sigmoid / softmax chip adds the [NoObj] column.

const W = 1080;
const H = 280;
const ROWS = 4;

const STAGE_TEXT = [
  '一个短语只占一列：这是理想情况。',
  '被切成 3 个词块：a / small / vial。',
  '监督扩到 3 列，三个词块都算正样本——这才对得上 N×M 的分数矩阵。',
];
const SOFTMAX_TEXT = '用多类交叉熵时，没匹配上的框都归到 [NoObj]。';

const GRID = { x: 660, y: 70, cw: 80, ch: 36, gx: 10, gy: 10 };

interface S {
  step: number;
  softmax: boolean;
}

const draw = (ctx: CanvasRenderingContext2D, time: number, s: S): void => {
  clearScene(ctx, W, H);
  const cols = s.step >= 2 ? 3 : 1;
  const total = cols + (s.softmax ? 1 : 0);
  const pulse = 0.5 + 0.5 * Math.sin(time / 620);

  // Left: the list line and its chips.
  drawLabel(ctx, '清单', 40, 34, { color: COLORS.muted });
  drawList(ctx, 40, 46, 380, 148, {
    lines: 4,
    active: 1,
    split: s.step >= 1 ? 1 : undefined,
    struck: 3,
  });

  // Right: supervision grid N x c -> N x M.
  drawLabel(ctx, '监督格', GRID.x, 34, { color: COLORS.muted });

  // Fan from the split line to the grid columns (only drawn once tokens exist).
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.tag;
  ctx.globalAlpha = s.step >= 1 ? 0.28 + 0.22 * pulse : 0;
  for (let c = 0; c < cols; c += 1) {
    const tx = GRID.x + c * (GRID.cw + GRID.gx) + GRID.cw / 2;
    const ty = GRID.y - 10;
    ctx.beginPath();
    ctx.moveTo(424, 100);
    ctx.bezierCurveTo(500, 100, tx - 78, ty, tx, ty);
    ctx.stroke();
  }
  ctx.restore();

  // Amber token ticks above every phrase-token column: one per word chip.
  for (let c = 0; c < cols; c += 1) {
    const cx = GRID.x + c * (GRID.cw + GRID.gx);
    ctx.save();
    ctx.globalAlpha = s.step >= 1 ? 0.5 + 0.45 * pulse : 0.32;
    ctx.fillStyle = COLORS.tag;
    ctx.fillRect(cx + 6, GRID.y - 8, GRID.cw - 12, 4);
    ctx.restore();
  }

  for (let r = 0; r < ROWS; r += 1) {
    const cy = GRID.y + r * (GRID.ch + GRID.gy);
    ctx.beginPath();
    ctx.arc(GRID.x - 16, cy + GRID.ch / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = r === 0 ? COLORS.thread : COLORS.axis;
    ctx.fill();

    for (let c = 0; c < total; c += 1) {
      const cx = GRID.x + c * (GRID.cw + GRID.gx);
      const isPhraseColumn = c < cols;
      const positive = isPhraseColumn && r === 0;
      const noObj = !isPhraseColumn;

      ctx.beginPath();
      ctx.rect(cx, cy, GRID.cw, GRID.ch);
      if (positive) ctx.fillStyle = 'rgba(47,125,79,0.32)';
      else if (noObj && r !== 0) ctx.fillStyle = 'rgba(59,110,165,0.20)';
      else ctx.fillStyle = 'rgba(123,135,148,0.10)';
      ctx.fill();
      ctx.lineWidth = positive ? 2.5 : 1.5;
      ctx.strokeStyle = positive ? COLORS.thread : noObj && r !== 0 ? COLORS.box : COLORS.rule;
      if (noObj) ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawLegend(ctx, GRID.x, 258, s.softmax
    ? [
        { color: COLORS.thread, text: '正样本' },
        { color: COLORS.muted, text: '负样本' },
        { color: COLORS.box, text: '[NoObj]' },
      ]
    : [
        { color: COLORS.thread, text: '正样本' },
        { color: COLORS.muted, text: '负样本' },
        { color: COLORS.tag, text: '词块' },
      ]);
};

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const [softmax, setSoftmax] = useState(false);
  const [feedback, setFeedback] = useState({ text: STAGE_TEXT[0], cls: '' });
  const stateRef = useRef<S>({ step: 0, softmax: false });
  const { ref } = useCanvas(draw, W, H, stateRef);

  const apply = (nextStep: number, nextSoftmax: boolean) => {
    const s = Math.max(0, Math.min(2, nextStep));
    stateRef.current = { step: s, softmax: nextSoftmax };
    setStep(s);
    setSoftmax(nextSoftmax);
    setFeedback(
      nextSoftmax
        ? { text: SOFTMAX_TEXT, cls: '' }
        : { text: STAGE_TEXT[s], cls: s === 2 ? 'good' : '' }
    );
  };

  const cols = step >= 2 ? 3 : 1;
  const total = cols + (softmax ? 1 : 0);
  const chips = step >= 1 ? 3 : 1;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        aria-label="一行描述被切成词块，监督格从一列扩到三列"
      />
      <div className="ctrl">
        <button type="button" className="tiny ghost" onClick={() => apply(step - 1, softmax)} disabled={step === 0}>
          上一步
        </button>
        <button type="button" className="tiny" onClick={() => apply(step + 1, softmax)} disabled={step === 2}>
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => apply(0, false)}>
          重置
        </button>
        <span className="val">
          {total} 列 · {chips} 块
        </span>
      </div>
      <div className="ctrl">
        <button
          type="button"
          className={softmax ? 'chip' : 'chip selected'}
          onClick={() => apply(step, false)}
        >
          sigmoid
        </button>
        <button
          type="button"
          className={softmax ? 'chip selected' : 'chip'}
          onClick={() => apply(step, true)}
        >
          softmax
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
