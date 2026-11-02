import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawHandbook,
  drawLabel,
  drawLegend,
  drawList,
  drawMeter,
  useCanvas,
} from '../lib/roomKit';

const W = 1080;
const H = 280;
const STEPS = 3;
const COVERED = [0.18, 0.26, 1];
const MISSED = [82, 74, 0];

interface Ch1State {
  step: number;
}

const INITIAL_FEEDBACK = { text: '背手册：只能认手册里写死的类别。', cls: '' };

function feedbackFor(step: number): { text: string; cls: string } {
  if (step === 0) {
    return { text: '背手册：只能认手册里写死的类别，罕见概念直接漏掉。', cls: 'bad' };
  }
  if (step === 1) {
    return { text: '多加几页手册：类别多一点，但还是封闭的。', cls: '' };
  }
  return { text: '换一张清单：词表不再封闭，写什么就能找什么。', cls: 'good' };
}

export const Ch1Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch1State>({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(INITIAL_FEEDBACK);

  const { ref } = useCanvas<Ch1State>((ctx, _time, s) => {
    clearScene(ctx, W, H);

    // Left scene: a closed handbook, a thicker handbook, then a written list.
    if (s.step < 2) {
      const scale = s.step === 0 ? 2.0 : 2.1;
      const pages = s.step === 0 ? 2 : 4;
      ctx.save();
      for (let i = pages; i >= 1; i -= 1) {
        const ox = 8 + i * 4;
        const oy = 4 + i * 3;
        ctx.beginPath();
        ctx.rect(300 - 26 * scale + ox, 128 - 34 * scale + oy, 52 * scale, 68 * scale);
        ctx.fillStyle = COLORS.paper;
        ctx.fill();
        ctx.strokeStyle = COLORS.rule;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
      drawHandbook(ctx, 300, 128, scale, { closed: true });
    } else {
      drawList(ctx, 140, 44, 320, 178, { lines: 10 });
    }

    // Right panel: coverage bar plus a missed-count indicator.
    drawMeter(ctx, 640, 126, 380, 26, COVERED[s.step], { label: '覆盖' });
    const missed = MISSED[s.step];
    drawLabel(ctx, '漏检', 640, 72, {
      color: missed > 0 ? COLORS.muted : COLORS.thread,
      size: 15,
      bold: true,
    });
    if (missed > 0) {
      const dots = Math.min(4, Math.ceil(missed / 20));
      ctx.save();
      for (let i = 0; i < dots; i += 1) {
        ctx.beginPath();
        ctx.arc(704 + i * 28, 66, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.warn;
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(704, 66, 8, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.thread;
      ctx.fill();
      ctx.restore();
    }

    drawLegend(ctx, 640, 244, [
      { color: COLORS.muted, text: '手册' },
      { color: COLORS.thread, text: '覆盖' },
      { color: COLORS.warn, text: '漏检' },
    ]);
  }, W, H, stateRef);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(STEPS - 1, next));
    stateRef.current.step = clamped;
    setStep(clamped);
    setFeedback(feedbackFor(clamped));
  };

  const reset = () => {
    stateRef.current.step = 0;
    setStep(0);
    setFeedback(INITIAL_FEEDBACK);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button type="button" className="chip" onClick={() => go(step - 1)} disabled={step === 0}>
            上一步
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => go(step + 1)}
            disabled={step === STEPS - 1}
          >
            下一步
          </button>
          <button type="button" className="chip" onClick={reset}>
            重置
          </button>
        </div>
        <span className="val">{step + 1} / {STEPS}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
