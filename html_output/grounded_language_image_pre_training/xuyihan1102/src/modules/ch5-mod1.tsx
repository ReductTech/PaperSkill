// Chapter 5 module: when do you look at the list?
// Late fusion joins the two sides only at the very end (one-way arrows meeting at a
// single point); deep fusion exchanges context in the last layers (a pulsing two-way
// arrow). Zero-shot COCO AP: 42.9 -> 44.9, a +2.0 delta.
import React, { useRef, useState } from 'react';
import {
  COLORS,
  clearScene,
  drawItem,
  drawLabel,
  drawLegend,
  drawList,
  drawPerson,
  useCanvas,
  clamp,
  lerp,
} from '../lib/roomKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const AP = { late: 42.9, deep: 44.9 } as const;
const AXIS_MAX = 50;
const DURATION = 2000;

type Mode = 'late' | 'deep';
type Tone = 'info' | 'good' | 'bad';

const smooth = (u: number): number => {
  const t = clamp(u, 0, 1);
  return t * t * (3 - 2 * t);
};

function head(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-10, 5.5);
  ctx.lineTo(-10, -5.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

const COPY: Record<Mode, { text: string; cls: string }> = {
  late: { text: '晚期融合：只在最后点积，零样本 42.9 AP。', cls: 'bad' },
  deep: { text: '深度融合：最后几层互相看，零样本 44.9 AP，+2.0。', cls: 'good' },
};

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<Mode>('late');
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>({
    text: '晚期融合：两边各自编码，最后才点积。',
    cls: '',
  });
  const stateRef = useRef({ mode: 'late' as Mode, started: false, t0: 0 });

  const pick = (next: Mode) => {
    setMode(next);
    const s = stateRef.current;
    s.mode = next;
    if (s.started) {
      s.t0 = performance.now();
      setFeedback(COPY[next]);
    } else {
      setFeedback({
        text:
          next === 'late'
            ? '晚期融合：两边各自编码，最后才点积。'
            : '深度融合：边找边看，最后几层互相更新。',
        cls: '',
      });
    }
  };

  const start = () => {
    const s = stateRef.current;
    s.started = true;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.t0 = reduced ? performance.now() - DURATION * 2 : performance.now();
    setStarted(true);
    setFeedback(COPY[s.mode]);
  };

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const s = stateRef.current;
    clearScene(ctx, W, H);
    const elapsed = s.started ? clamp((time - s.t0) / DURATION, 0, 1) : 0;
    const grow = smooth(elapsed);

    // ---- left: the searcher, the lifted list and the clutter ----
    drawPerson(ctx, 84, 118, 1.15);
    drawList(ctx, 146, 32, 118, 176, { lines: 5, active: 2 });
    drawItem(ctx, 372, 122, 30, 44, { kind: 'bottle' });
    drawItem(ctx, 410, 128, 44, 40, { kind: 'box' });
    drawItem(ctx, 462, 126, 34, 42, { kind: 'cup' });
    drawItem(ctx, 502, 106, 42, 58, { kind: 'plant' });

    const endX = 616;
    const endY = 118;
    if (s.mode === 'late') {
      // two one-way arrows that only meet at the very end
      ctx.save();
      ctx.strokeStyle = COLORS.warn;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(272, 76);
      ctx.lineTo(endX - 8, endY - 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(550, 150);
      ctx.lineTo(endX - 8, endY + 4);
      ctx.stroke();
      ctx.restore();
      head(ctx, endX, endY, Math.atan2(endY - 6 - 76, endX - 8 - 272), COLORS.warn);
      head(ctx, endX, endY, Math.atan2(endY + 4 - 150, endX - 8 - 550), COLORS.warn);
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.warn;
      ctx.fill();
    } else {
      // a pulsing two-way arrow between the list and the clutter
      const laneY = 64;
      const pulse = 0.5 + 0.5 * Math.sin((time / 320) * Math.PI * 2);
      ctx.save();
      ctx.strokeStyle = COLORS.aux;
      ctx.lineWidth = 2 + 2 * pulse;
      ctx.setLineDash([9, 7]);
      ctx.lineDashOffset = -((time / 70) % 32);
      ctx.beginPath();
      ctx.moveTo(272, laneY);
      ctx.lineTo(550, laneY);
      ctx.stroke();
      ctx.restore();
      head(ctx, 550, laneY, 0, COLORS.aux);
      head(ctx, 272, laneY, Math.PI, COLORS.aux);
      const travel = (time / 800) % 1;
      for (const u of [travel, 1 - travel]) {
        ctx.beginPath();
        ctx.arc(lerp(272, 550, u), laneY, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.aux;
        ctx.fill();
      }
    }

    // ---- right: the zero-shot AP meter ----
    const bx = 690;
    const bw = 300;
    const bh = 26;
    const by = 92;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = COLORS.axis;
    ctx.fillRect(bx, by, bw, bh);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();

    const lateX = bx + bw * (AP.late / AXIS_MAX);
    const curFrac = s.started ? ((s.mode === 'late' ? AP.late : AP.deep) / AXIS_MAX) * grow : 0;
    if (!s.started) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = s.mode === 'late' ? COLORS.warn : COLORS.thread;
      ctx.fillRect(bx + 1.5, by + 1.5, (bw - 3) * (AP[s.mode] / AXIS_MAX), bh - 3);
      ctx.restore();
    }
    ctx.fillStyle = s.mode === 'late' ? COLORS.warn : COLORS.thread;
    ctx.fillRect(bx + 1.5, by + 1.5, Math.max(0, (bw - 3) * curFrac), bh - 3);

    // the 42.9 baseline sits where late fusion ends
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lateX, by - 8);
    ctx.lineTo(lateX, by + bh + 10);
    ctx.stroke();
    ctx.restore();

    drawLabel(
      ctx,
      s.mode === 'late' ? '42.9' : '44.9',
      bx + bw - 2,
      by - 10,
      { color: s.mode === 'late' ? COLORS.warn : COLORS.thread, size: 16, bold: true, align: 'right' }
    );
    if (s.mode === 'deep') {
      drawLabel(ctx, '42.9', lateX + 5, by + bh + 24, { color: COLORS.muted, size: 13 });
      const deepX = bx + bw * (AP.deep / AXIS_MAX);
      ctx.save();
      ctx.strokeStyle = COLORS.thread;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lateX, by + bh + 34);
      ctx.lineTo(deepX, by + bh + 34);
      ctx.moveTo(lateX, by + bh + 29);
      ctx.lineTo(lateX, by + bh + 39);
      ctx.moveTo(deepX, by + bh + 29);
      ctx.lineTo(deepX, by + bh + 39);
      ctx.stroke();
      ctx.restore();
      if (elapsed > 0.9) {
        drawLabel(ctx, '+2.0', (lateX + deepX) / 2 - 12, by + bh + 58, {
          color: COLORS.thread,
          size: 15,
          bold: true,
        });
      }
    }

    drawLegend(ctx, 690, 246, [
      { color: COLORS.warn, text: '晚期融合' },
      { color: COLORS.thread, text: '深度融合' },
      { color: COLORS.aux, text: '双向看' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  const apText = started ? (mode === 'deep' ? '44.9' : '42.9') : '—';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${mode === 'late' ? 'selected' : ''}`}
            onClick={() => pick('late')}
          >
            晚期融合
          </button>
          <button
            type="button"
            className={`chip ${mode === 'deep' ? 'selected' : ''}`}
            onClick={() => pick('deep')}
          >
            深度融合
          </button>
        </div>
        <button type="button" className="tiny" onClick={start}>
          开始
        </button>
        <label>
          零样本 AP <span className="val">{apText}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
