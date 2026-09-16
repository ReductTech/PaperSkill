import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  BALL_R,
  BORDER,
  EMPHASIS,
  GUIDE,
  SUCCESS,
  TEXT,
  TEXT_MUTED,
  clearScene,
  drawAimLine,
  drawBall,
  drawSceneLabel,
  drawTable,
  drawTargetSpot,
} from './billiardsKit';

// §6 module 6.1 — 候选球路裁决 (1080x280).
// Left: the cue ball and K candidate lines (one per sampled action chunk).
// Right: the value panel, one bar per candidate — the paper's Figure 2(b) scores
// for the first three (0.71 / 0.78 / 0.73), hatched placeholder bars without
// numbers for the rest.
// One dominant operation: pick K, then step through the candidates and finally
// execute the highest-scoring one.

const W = 1080;
const H = 280;

type KValue = 3 | 6;
type Stage = number;

const SCORES: Record<KValue, (number | null)[]> = {
  3: [0.71, 0.78, 0.73],
  6: [0.71, 0.78, 0.73, null, null, null],
};
/** vertical offset of each candidate line's landing point at the pocket */
const OFFSETS: Record<KValue, number[]> = {
  3: [-30, 0, 30],
  6: [-60, 0, -30, 30, -15, 50],
};
const BEST_INDEX = 1;

const QB = { x: 110, y: 140 };
const END_X = 600;
const PANEL = { x: 680, y: 60, w: 360, h: 190 };
const BASE_Y = 235;
const MAX_BAR_H = 160;
const HATCH_H = 72;
const ROLL_MS = 900;

const START_FEEDBACK = '选一个候选数，然后按开始。';
const EXEC_FEEDBACK =
  '执行价值最高的候选二（0.78）。LIBERO 上把候选数开到 6、想象视野设为 2，平均成功率从 98.6% 升到 98.9%。';

function barGeom(k: KValue, i: number): { x: number; w: number } {
  const barW = k === 3 ? 70 : 34;
  const gap = k === 3 ? 40 : 22;
  const total = k * barW + (k - 1) * gap;
  const x0 = PANEL.x + PANEL.w / 2 - total / 2;
  return { x: x0 + i * (barW + gap), w: barW };
}

function lineStyle(
  i: number,
  stage: Stage,
  executed: boolean,
): { color: string; dashed: boolean; width: number } {
  if (executed) {
    return i === BEST_INDEX
      ? { color: SUCCESS, dashed: false, width: 2.5 }
      : { color: TEXT_MUTED, dashed: false, width: 1.5 };
  }
  if (i < stage - 1) return { color: TEXT_MUTED, dashed: false, width: 1.5 };
  if (i === stage - 1) return { color: GUIDE, dashed: false, width: 2.5 };
  return { color: BORDER, dashed: true, width: 1.5 };
}

const processFeedback = (i: number, scores: (number | null)[]): { text: string; cls: string } => {
  const score = scores[i - 1];
  return score === null
    ? { text: `第 ${i} 个候选：论文的图里没有给出这一条的分数，这里只画示意条。`, cls: '' }
    : {
        text: `第 ${i} 个候选：世界专家想象出它执行后的那一帧，价值模型打 ${score.toFixed(2)} 分。`,
        cls: '',
      };
};

export const Wla61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ K: 3 as KValue, stage: 0, execAt: 0 });
  const [K, setK] = useState<KValue>(3);
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState({ text: START_FEEDBACK, cls: '' });
  /** K = 3 -> the paper's Figure 2(b) scores; K = 6 -> the last three are unknown */
  const scores = SCORES[K];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const state = stateRef.current;
      const k = state.K;
      const scores = SCORES[k];
      const offsets = OFFSETS[k];
      const executed = state.stage > k;
      const roll = state.execAt > 0 ? clamp((now - state.execAt) / ROLL_MS, 0, 1) : 0;

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [] });

      // A. candidate lines on the table
      for (let i = 0; i < k; i++) {
        const st = lineStyle(i, state.stage, executed);
        drawAimLine(ctx, QB.x, QB.y, END_X, QB.y + offsets[i], {
          color: st.color,
          dashed: st.dashed,
          width: st.width,
        });
      }
      drawTargetSpot(ctx, END_X, QB.y, 14, executed && roll > 0.98 ? 'hit' : 'idle');
      drawBall(
        ctx,
        lerp(QB.x, END_X, easeOutCubic(roll)),
        lerp(QB.y, QB.y + offsets[BEST_INDEX], easeOutCubic(roll)),
        BALL_R,
        GUIDE,
      );

      // B. value panel
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      ctx.strokeRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      ctx.beginPath();
      ctx.moveTo(PANEL.x + 20, BASE_Y);
      ctx.lineTo(PANEL.x + PANEL.w - 20, BASE_Y);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < k && i < state.stage; i++) {
        const g = barGeom(k, i);
        const score = scores[i];
        if (score === null) {
          // no score in the paper's figure: a hatched placeholder, no number
          ctx.save();
          ctx.strokeStyle = TEXT_MUTED;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(g.x, BASE_Y - HATCH_H, g.w, HATCH_H);
          ctx.clip();
          for (let d = -HATCH_H; d < g.w; d += 9) {
            ctx.beginPath();
            ctx.moveTo(g.x + d, BASE_Y);
            ctx.lineTo(g.x + d + HATCH_H, BASE_Y - HATCH_H);
            ctx.stroke();
          }
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = BORDER;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(g.x, BASE_Y - HATCH_H, g.w, HATCH_H);
          ctx.restore();
        } else {
          const barH = score * MAX_BAR_H;
          const isBest = i === BEST_INDEX;
          ctx.save();
          ctx.fillStyle = isBest ? SUCCESS : GUIDE;
          ctx.globalAlpha = isBest ? 1 : 0.55;
          ctx.fillRect(g.x, BASE_Y - barH, g.w, barH);
          ctx.restore();
          if (isBest) {
            ctx.save();
            ctx.fillStyle = EMPHASIS;
            ctx.fillRect(g.x, BASE_Y - barH - 5, g.w, 4);
            ctx.restore();
          }
          drawSceneLabel(ctx, score.toFixed(2), g.x + g.w / 2, BASE_Y - barH - 14, {
            align: 'center',
            color: TEXT,
            size: 12,
          });
        }
      }

      drawSceneLabel(ctx, '候选线路', 60, 30, { color: TEXT_MUTED, size: 12 });
      drawSceneLabel(ctx, '价值', PANEL.x + 16, 46, { color: TEXT_MUTED, size: 12 });
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const chooseK = (next: KValue) => {
    stateRef.current.K = next;
    stateRef.current.stage = 0;
    stateRef.current.execAt = 0;
    setK(next);
    setStage(0);
    setFeedback({ text: START_FEEDBACK, cls: '' });
  };

  const startRun = () => {
    stateRef.current.stage = 1;
    stateRef.current.execAt = 0;
    setStage(1);
    setFeedback(processFeedback(1, scores));
  };

  const advance = () => {
    const current = stateRef.current.stage;
    if (current === 0) return;
    if (current < K) {
      stateRef.current.stage = current + 1;
      setStage(current + 1);
      setFeedback(processFeedback(current + 1, scores));
    } else {
      stateRef.current.stage = K + 1;
      stateRef.current.execAt = performance.now();
      setStage(K + 1);
      setFeedback({ text: EXEC_FEEDBACK, cls: 'good' });
    }
  };

  const reset = () => {
    stateRef.current.stage = 0;
    stateRef.current.execAt = 0;
    setStage(0);
    setFeedback({ text: START_FEEDBACK, cls: '' });
  };

  const executed = stage > K;
  const midLabel = executed || stage === K ? '出杆' : '下一杆';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      <div className="chip-row">
        {([3, 6] as KValue[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`chip${K === k ? ' selected' : ''}`}
            aria-pressed={K === k}
            onClick={() => chooseK(k)}
          >
            候选数 {k}
          </button>
        ))}
      </div>

      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={startRun} disabled={stage !== 0}>
          开始
        </button>
        <button
          type="button"
          className="tiny"
          onClick={advance}
          disabled={stage === 0 || executed}
        >
          {midLabel}
        </button>
        <button type="button" className="tiny ghost" onClick={reset} disabled={stage === 0}>
          重来
        </button>
        <span className="step-label">
          已处理 <b>{Math.min(stage, K)}</b> / {K} 个候选
        </span>
      </div>

      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla61;
