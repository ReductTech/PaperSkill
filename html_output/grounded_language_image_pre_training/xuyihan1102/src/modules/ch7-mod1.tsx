import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawItem,
  drawNote,
  drawPerson,
  drawMeter,
  drawList,
  drawLegend,
  useCanvas,
} from '../lib/roomKit';

// Module 7.1 — self-training. One operation (step) walks the four teacher->student
// stages: sticky notes accumulate on the clutter and the two statistics grow.

const W = 1080;
const H = 280;

const STAGE_TEXT = [
  '先训老师：只用人工标注的检测与 grounding 数据。',
  '老师给 24M 网络图文对打框，留下 7810 万个高置信伪框。',
  '伪框覆盖 5840 万个不同名词短语：词表被撑开了。',
  '学生在这 24M 上训练，总量 27M——而且可能比老师更强。',
];

const NOTES_PER_ITEM = [0, 1, 3, 4];
const BOXES = [0, 78.1, 78.1, 78.1];
const PHRASES = [0, 0, 58.4, 58.4];

const KINDS: Array<'bottle' | 'box' | 'cup' | 'plant' | 'frame'> = [
  'bottle',
  'box',
  'cup',
  'plant',
  'frame',
  'box',
];
const ITEM_Y = 116;
const ITEM_W = 46;
const ITEM_H = 54;

interface S {
  step: number;
}

const draw = (ctx: CanvasRenderingContext2D, _time: number, s: S): void => {
  clearScene(ctx, W, H);
  const perItem = NOTES_PER_ITEM[s.step];

  // The teacher's list: some lines still have no match and stay struck through.
  drawList(ctx, 96, 112, 100, 60, { lines: 3, active: 0, struck: 2 });

  // The people: teacher always, student only once the pseudo boxes exist.
  drawPerson(ctx, 62, 158, 1.0, { role: 'teacher' });
  if (s.step >= 3) drawPerson(ctx, 118, 236, 0.85, { role: 'student' });

  // The clutter, with sticky notes left by the teacher.
  for (let i = 0; i < 6; i += 1) {
    const x = 248 + i * 58;
    drawItem(ctx, x, ITEM_Y, ITEM_W, ITEM_H, { kind: KINDS[i], highlight: perItem > 0 });
    for (let n = 0; n < perItem; n += 1) {
      drawNote(ctx, x + 22 + n * 4, ITEM_Y + 10 - n * 7);
    }
  }

  // Two statistics: pseudo boxes and covered phrases.
  drawMeter(ctx, 700, 88, 300, 22, BOXES[s.step] / 100, { label: '伪框' });
  drawMeter(ctx, 700, 168, 300, 22, PHRASES[s.step] / 100, { label: '短语' });

  ctx.save();
  ctx.font = '600 20px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'right';
  ctx.fillText(`${BOXES[s.step].toFixed(1)}M`, 1000, 80);
  ctx.fillText(`${PHRASES[s.step].toFixed(1)}M`, 1000, 160);
  ctx.restore();

  drawLegend(ctx, 250, 198, [
    { color: COLORS.tag, text: '便利贴' },
    { color: COLORS.aux, text: '老师' },
    { color: COLORS.ink, text: '学生' },
  ]);
};

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STAGE_TEXT[0], cls: '' });
  const stateRef = useRef<S>({ step: 0 });
  const { ref } = useCanvas(draw, W, H, stateRef);

  const apply = (nextStep: number) => {
    const s = Math.max(0, Math.min(3, nextStep));
    stateRef.current = { step: s };
    setStep(s);
    setFeedback({ text: STAGE_TEXT[s], cls: s === 3 ? 'good' : '' });
  };

  const notes = NOTES_PER_ITEM[step] * 6;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        aria-label="老师给杂物贴便利贴，伪框与短语两个统计随之增长"
      />
      <div className="ctrl">
        <button type="button" className="tiny ghost" onClick={() => apply(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button type="button" className="tiny" onClick={() => apply(step + 1)} disabled={step === 3}>
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => apply(0)}>
          重置
        </button>
        <span className="val">
          {notes} 张 · {BOXES[step].toFixed(1)}M
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
