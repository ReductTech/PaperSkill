import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawCard,
  drawLabel,
  drawLegend,
  drawMeter,
  drawPitch,
  drawPlayer,
  drawRing,
  drawRoster,
  useCanvas,
} from '../lib/pitchKit';

const W = 1080;
const H = 280;
const TOTAL = 6;
const HIT = [3, 6];
const MISS = [3, 0];
const RINGED = [
  [0, 2, 3],
  [0, 1, 2, 3, 4, 5],
];

const BOOK = { x: 48, y: 72, w: 148, h: 152 };
const PITCH = { x: 236, y: 56, w: 310, h: 192 };
const BARS = { x: 600, y: 88, w: 440, gap: 84, h: 26 };

interface Ch1State {
  step: number;
}

const INITIAL_FEEDBACK = { text: '翻登记册：只能认册子上登记过的位置。', cls: '' };

function feedbackFor(step: number): { text: string; cls: string } {
  if (step === 0) {
    return { text: '翻登记册：只能认册子上登记过的位置，没登记的球员一直漏着。', cls: 'bad' };
  }
  return { text: '换一张需求卡：想找什么就往上写，场上的人都能被圈到。', cls: 'good' };
}

function playerAt(index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: PITCH.x + ((col + 0.5) * PITCH.w) / 3,
    y: PITCH.y + ((row + 0.5) * PITCH.h) / 2,
  };
}

/** One six-slot gauge: neutral track from the kit, semantic fill and unit ticks on top. */
function drawGauge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string
): void {
  drawMeter(ctx, x, y, w, h, 0);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1.5, y + 1.5, Math.max(0, (w - 3) * clamp(frac, 0, 1)), h - 3);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = COLORS.card;
  ctx.lineWidth = 1.5;
  for (let i = 1; i < TOTAL; i += 1) {
    const tickX = x + 1.5 + ((w - 3) * i) / TOTAL;
    ctx.beginPath();
    ctx.moveTo(tickX, y + 2.5);
    ctx.lineTo(tickX, y + h - 2.5);
    ctx.stroke();
  }
  ctx.restore();
}

export const Ch1Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch1State>({ step: 0 });
  const [ui, setUi] = useState<Ch1State>({ step: 0 });
  const [feedback, setFeedback] = useState(INITIAL_FEEDBACK);

  const { ref } = useCanvas<Ch1State>((ctx, _time, s) => {
    clearScene(ctx, W, H);
    const step = s.step;
    const hit = HIT[step];
    const miss = MISS[step];
    const ringed = RINGED[step];

    // The field: six players, three of whom the fixed roster never registered.
    drawPitch(ctx, PITCH.x, PITCH.y, PITCH.w, PITCH.h, { rows: 2, cols: 3 });
    for (let i = 0; i < TOTAL; i += 1) {
      const pos = playerAt(i);
      const on = ringed.indexOf(i) >= 0;
      drawPlayer(ctx, pos.x, pos.y, 1, { dim: !on });
      if (on) drawRing(ctx, pos.x, pos.y - 2, 24, { color: COLORS.ring, weight: 3 });
    }

    // The fixed roster, or the writable requirements card that replaces it.
    if (step === 0) {
      drawRoster(ctx, BOOK.x, BOOK.y, BOOK.w, BOOK.h, { entries: TOTAL });
    } else {
      drawCard(ctx, BOOK.x, BOOK.y, BOOK.w, BOOK.h, { lines: 3 });
    }

    drawLabel(ctx, `命中 ${hit}`, BARS.x, BARS.y - 12, {
      color: COLORS.good,
      size: 15,
      bold: true,
    });
    drawGauge(ctx, BARS.x, BARS.y, BARS.w, BARS.h, hit / TOTAL, COLORS.good);

    drawLabel(ctx, `漏掉 ${miss}`, BARS.x, BARS.y + BARS.gap - 12, {
      color: miss > 0 ? COLORS.bad : COLORS.good,
      size: 15,
      bold: true,
    });
    drawGauge(
      ctx,
      BARS.x,
      BARS.y + BARS.gap,
      BARS.w,
      BARS.h,
      miss / TOTAL,
      miss > 0 ? COLORS.bad : COLORS.good
    );

    drawLegend(ctx, BARS.x, 244, [
      { color: COLORS.ring, text: '圈中' },
      { color: COLORS.muted, text: '没圈到' },
    ]);
  }, W, H, stateRef);

  const go = (next: number) => {
    const step = Math.max(0, Math.min(1, next));
    stateRef.current.step = step;
    setUi({ step });
    setFeedback(feedbackFor(step));
  };

  const reset = () => {
    stateRef.current.step = 0;
    setUi({ step: 0 });
    setFeedback(INITIAL_FEEDBACK);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button type="button" className="chip" onClick={() => go(ui.step - 1)} disabled={ui.step === 0}>
            上一步
          </button>
          <button type="button" className="chip" onClick={() => go(ui.step + 1)} disabled={ui.step === 1}>
            下一步
          </button>
          <button type="button" className="chip" onClick={reset}>
            重置
          </button>
        </div>
        <label>
          当前做法 <span className="val">{ui.step === 0 ? '翻登记册' : '看需求卡'}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
