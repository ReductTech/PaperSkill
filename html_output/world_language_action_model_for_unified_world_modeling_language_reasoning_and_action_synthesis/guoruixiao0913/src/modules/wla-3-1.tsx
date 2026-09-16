import React, { useEffect, useRef, useState } from 'react';
import {
  clamp,
  easeOutCubic,
  lerp,
  lerpColor,
  observeCanvas,
  setupCanvas,
} from '../lib/canvasKit';
import {
  BORDER,
  FAIL,
  FELT_DARK,
  GUIDE,
  SUCCESS,
  TEXT_MUTED,
  clearScene,
  drawAimLine,
  drawBall,
  drawSceneLabel,
  drawTable,
  drawTargetSpot,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 模块 3.1：1080×280 里并排两块 540×280 台面，同一初始状态、同一时间基同步开球。
// 左：只对齐画面（红色虚线轨迹，靶球漂出袋口）；右：意图 + 动力学（蓝色实线，全程到位）。

const W = 1080;
const H = 280;
const HALF = 540;
const BAND_TOP = 70;
const BAND_BOTTOM = 210;
const MID_Y = 140;
const CUE_X = 90;
const OBJ_X = 384;
const OBJ_GAP = 26;
const POCKET_X = 444;
/** 一个「袋口宽度」在画布上折算的像素数（示意）。 */
const DRIFT_PX = 20;
const RUN_MS = 2800;

const FEEDBACK_IDLE = '按开始，两块台面从同一起点开球。';
const FEEDBACK_RUNNING = '同时起杆……';
const FEEDBACK_DONE =
  '只对齐画面：从第 3 步起，靶球已经偏离目标袋口。先出意图再定动力学：全程停在目标环内。论文在 RMBench 上的真实差距见 §10（56.5% 对 13.3%）。';

interface ShotState {
  start: number;
  t: number;
  finished: boolean;
}

export const Wla31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<ShotState>({ start: 0, t: 0, finished: false });
  const [runId, setRunId] = useState(0);
  const [feedback, setFeedback] = useState({ text: FEEDBACK_IDLE, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 一块台面：drift 是这一侧终局的偏移量（袋口宽度），e 是同一时间基上的进度 0→1。
    const drawHalf = (offsetX: number, isLeft: boolean, e: number) => {
      const drift = isLeft ? 2.4 : 0.25;
      const endY = MID_Y - drift * DRIFT_PX;
      const objY = lerp(MID_Y, endY, e);
      const reachX = OBJ_X - OBJ_GAP;
      const cueX = lerp(CUE_X, reachX, e);
      const cueY = lerp(MID_Y, endY, e);
      const done = e >= 1;

      ctx.save();
      ctx.translate(offsetX, 0);
      clearScene(ctx, HALF, H);
      drawTable(ctx, HALF, H, { pockets: [POCKET_X], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });
      // 轨迹：旧打法由蓝转红（漂移），新打法保持蓝色引导线
      drawAimLine(ctx, CUE_X, MID_Y, reachX, endY, {
        color: isLeft ? lerpColor(GUIDE, FAIL, e) : GUIDE,
        dashed: isLeft,
        width: isLeft ? 1 : 2,
      });
      drawTargetSpot(ctx, POCKET_X, MID_Y, 16, done ? (isLeft ? 'miss' : 'hit') : 'idle');
      drawBall(ctx, OBJ_X, objY, 10, FELT_DARK, done ? { ring: isLeft ? FAIL : SUCCESS } : {});
      drawBall(ctx, cueX, cueY, 10, GUIDE);
      drawSceneLabel(ctx, isLeft ? '只看画面' : '意图+动力学', 56, 30, { color: TEXT_MUTED });
      ctx.restore();
    };

    const render = () => {
      const s = stateRef.current;
      if (s.start > 0) {
        const raw = clamp((performance.now() - s.start) / RUN_MS, 0, 1);
        s.t = easeOutCubic(raw);
        if (raw >= 1 && !s.finished) {
          s.finished = true;
          setFeedback({ text: FEEDBACK_DONE, cls: 'good' });
        }
      }

      drawHalf(0, true, s.t);
      drawHalf(HALF, false, s.t);

      // 两块台面之间的分界
      ctx.save();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(HALF, 16);
      ctx.lineTo(HALF, H - 16);
      ctx.stroke();
      ctx.restore();
    };

    const tick = () => {
      render();
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

  const startRun = () => {
    const s = stateRef.current;
    s.start = performance.now();
    s.t = 0;
    s.finished = false;
    setRunId((r) => r + 1);
    setFeedback({ text: FEEDBACK_RUNNING, cls: '' });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        data-run={runId}
      />
      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={startRun}>
          开始这一杆
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla31;
