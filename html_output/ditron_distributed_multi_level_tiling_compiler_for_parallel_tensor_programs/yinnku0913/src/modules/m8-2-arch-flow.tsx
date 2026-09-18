import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  KIT,
  dTileGround,
  dGrid,
  dTile,
  dHand,
  dTimeline,
  dLabel,
  dLegend,
} from './ditron-theme-kit';

// §8 Module 8.2 — the data-flow single-stepper.
// One AG-GEMM execution is split into a host launcher, a producer kernel and a
// consumer kernel. Five steps light up in order: the producer writes into the
// peer's symmetric memory, sets the signal, the consumer waits on it, computes the
// tile and releases it on the software scoreboard. The state model drives the two
// lanes, the symmetric-memory cells, the signal dot, the artifact readout and the
// feedback line together.

const W = 1080;
const H = 280;

const LANE_X = 48;
const LANE_W = 720;
const LANE_Y = 40;
const LANE_H = 72;
const CONSUMER_Y = 148;
const INNER_OFFSET = 16;
const INNER_H = 40;

const WRITE_X = 78;
const WRITE_W = 210;
const TILE_X = 620;
const SIGNAL_X = 1000;
const SIGNAL_Y = 62;

const SYMM_X = 806;
const SYMM_Y = 56;
const SYMM_CELL = 48;

const STEP_COUNT = 5;

const ARTIFACTS: string[] = [
  'host launcher 配置流、缓冲与 grid',
  '对称内存写入',
  '置位信号',
  '等待信号',
  'tile 计算完成',
];

const STEP_TEXT: string[] = [
  '第 1 步：host 端 launcher 用 Python 编排流、缓冲与启动配置，并持有对称工作区。',
  '第 2 步：producer 核（通信侧）把本地数据写入对端进程的对称内存。',
  '第 3 步：producer 置位信号，通知消费者数据已就绪。',
  '第 4 步：consumer 核（计算侧）等待该信号，等到了才开始算。',
  '第 5 步：consumer 算完当前 tile 并在记分板上 release_tile，供后续 ReduceScatter 取用。',
];

const DONE_TEXT =
  '这套 producer/consumer 模式正是 AG-GEMM、GEMM-RS、GEMM-AR 里计算通信重叠的实际落地方式。';

interface FlowState {
  step: number;
}

function feedbackFor(step: number): { text: string; cls: string } {
  if (step >= STEP_COUNT - 1) return { text: `${STEP_TEXT[4]}${DONE_TEXT}`, cls: 'good' };
  return { text: STEP_TEXT[step], cls: '' };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  width: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p[0], p[1]);
    else ctx.lineTo(p[0], p[1]);
  });
  ctx.stroke();
  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : last;
  const ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(last[0], last[1]);
  ctx.lineTo(last[0] - Math.cos(ang - 0.45) * 9, last[1] - Math.sin(ang - 0.45) * 9);
  ctx.lineTo(last[0] - Math.cos(ang + 0.45) * 9, last[1] - Math.sin(ang + 0.45) * 9);
  ctx.closePath();
  ctx.fill();
}

export const M82ArchFlow: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FlowState>({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<FlowState>(stateRef.current);

  const fb = feedbackFor(state.step);
  const signalSet = state.step >= 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: FlowState, time: number): void => {
      const phase = (time % 1.2) / 1.2;

      dTileGround(ctx, W, H);

      // producer and consumer lanes
      dTimeline(ctx, LANE_X, LANE_Y, LANE_W, LANE_H, 1);
      dTimeline(ctx, LANE_X, CONSUMER_Y, LANE_W, LANE_H, 1);

      // symmetric memory: six cells filled once the producer has written them
      dGrid(
        ctx,
        SYMM_X,
        SYMM_Y,
        2,
        3,
        SYMM_CELL,
        { stateAt: () => (s.step >= 2 ? 'done' : 'idle') },
        time
      );

      // step 1: the producer writes local data into the peer's symmetric memory
      if (s.step >= 1) {
        ctx.fillStyle = KIT.guidance;
        ctx.fillRect(WRITE_X, LANE_Y + INNER_OFFSET, WRITE_W, INNER_H);
        drawArrow(
          ctx,
          [
            [WRITE_X + WRITE_W + 30, LANE_Y + INNER_OFFSET + INNER_H / 2],
            [SYMM_X - 10, LANE_Y + INNER_OFFSET + INNER_H / 2],
          ],
          KIT.guidance,
          3
        );
      }

      // step 2: the signal is set and the memory cells become readable data
      if (s.step >= 2) {
        ctx.fillStyle = KIT.emphasis;
        ctx.fillRect(WRITE_X + WRITE_W + 4, LANE_Y + INNER_OFFSET + 4, 18, INNER_H - 8);
        const r = 8 + Math.sin(time * 5) * 1.5;
        ctx.beginPath();
        ctx.arc(SIGNAL_X, SIGNAL_Y, r, 0, Math.PI * 2);
        ctx.fillStyle = KIT.emphasis;
        ctx.fill();
      }

      // step 3: the consumer waits on the signal (the wait shrinks while it polls)
      if (s.step === 3) {
        const waitLen = clamp(240 * (1 - phase), 70, 240);
        ctx.fillStyle = KIT.failure;
        ctx.fillRect(WRITE_X, CONSUMER_Y + INNER_OFFSET, waitLen, INNER_H);
        drawArrow(
          ctx,
          [
            [SIGNAL_X, SIGNAL_Y + 10],
            [SIGNAL_X, CONSUMER_Y + INNER_OFFSET + INNER_H / 2],
            [700, CONSUMER_Y + INNER_OFFSET + INNER_H / 2],
          ],
          KIT.emphasis,
          3
        );
      }

      // step 4: the consumer computes the tile continuously
      if (s.step >= 4) {
        ctx.fillStyle = KIT.guidance;
        ctx.fillRect(WRITE_X, CONSUMER_Y + INNER_OFFSET, 480, INNER_H);
      }

      // the tile being consumed
      dTile(ctx, TILE_X, CONSUMER_Y + 20, 36, s.step >= 4 ? 'done' : 'idle', time);

      dHand(ctx, 62, 234, time, KIT.text);

      dLabel(ctx, '生产', LANE_X + 6, 30, KIT.guidance);
      dLabel(ctx, '消费', LANE_X + 6, 138, KIT.text);
      ctx.fillStyle = KIT.muted;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('对称内存', SYMM_X, SYMM_Y - 10);
      dLegend(
        ctx,
        [
          { color: KIT.guidance, text: '生产与计算' },
          { color: KIT.failure, text: '等待' },
          { color: KIT.emphasis, text: '信号' },
        ],
        LANE_X,
        250
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      render(stateRef.current, (now - t0) / 1000);
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

  const goTo = (step: number): void => {
    const next: FlowState = { step: clamp(Math.round(step), 0, STEP_COUNT - 1) };
    stateRef.current = next;
    setState(next);
  };

  const onPrev = (): void => goTo(stateRef.current.step - 1);
  const onNext = (): void => goTo(stateRef.current.step + 1);
  const onReset = (): void => goTo(0);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onPrev();
    }
  };

  return (
    <div onKeyDown={onKeyDown} tabIndex={0}>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="chip" onClick={onPrev} disabled={state.step === 0}>
          上一步
        </button>
        <button
          type="button"
          className="chip"
          onClick={onNext}
          disabled={state.step >= STEP_COUNT - 1}
        >
          {state.step >= STEP_COUNT - 1 ? '已完成' : '下一步'}
        </button>
        <button type="button" className="chip" onClick={onReset}>
          重置
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前步骤</div>
          <div className="v">{state.step + 1} / {STEP_COUNT}</div>
        </div>
        <div className="metric">
          <div className="l">当前产物</div>
          <div className="v">{ARTIFACTS[state.step]}</div>
        </div>
        <div className="metric">
          <div className="l">信号</div>
          <div className="v">{signalSet ? '已置位' : '未置位'}</div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M82ArchFlow;
