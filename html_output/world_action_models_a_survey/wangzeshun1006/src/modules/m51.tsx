import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawLegend,
  SHEET,
  ROUTE,
  OK,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m51 — 顺序式 vs 联合式：两种绑法同时开跑。一次演示约 3.2s，两个面板共用同一时间轴：
// 左面板先走未来条、后跟动作条；右面板两条同速推进，中间出现紫色互约束虚线。

const W = 1080;
const H = 280;
const DUR = 3200;
const HOLD_MS = 1500;
const TICKS = 8;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type Phase = 'idle' | 'run' | 'hold';

const IDLE_FEEDBACK = '两个绑法共用同一时间轴：左边先未来后动作，右边两条轨迹同时生成、互相约束。';
const RUN_FEEDBACK = '左边：未来先画完，动作再跟上——可以并行评分多个候选，但窗内改不了主意。';
const DONE_FEEDBACK =
  '右边：未来与动作同生共长，一致性更强、也更省一次生成——代价是两边的损失会互相拉扯，训练要更小心。';

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  color: string
): void {
  ctx.fillStyle = LINE;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const p = clamp(progress, 0, 1);
  if (p > 0.01) {
    ctx.fillStyle = color;
    rr(ctx, x, y, Math.max(h, w * p), h, h / 2);
    ctx.fill();
  }
}

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as Phase, start: 0, holdStart: 0, tick: 0 });
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [tick, setTick] = useState(0);
  const [ran, setRan] = useState(false);
  const [feedback, setFeedback] = useState({ text: IDLE_FEEDBACK, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const s = stateRef.current;
      clearField(ctx, W, H);

      const leftFuture = clamp(s.tick / 4, 0, 1);
      const leftAction = clamp((s.tick - 4) / 4, 0, 1);
      const rightProg = clamp(s.tick / TICKS, 0, 1);

      // 左面板：顺序式
      ctx.save();
      ctx.fillStyle = SHEET;
      rr(ctx, 40, 40, 470, 184, 12);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = INK;
      ctx.font = 'bold 17px ' + FONT;
      ctx.fillText('顺序式', 62, 74);
      drawBar(ctx, 70, 100, 400, 26, leftFuture, ROUTE);
      drawBar(ctx, 70, 150, 400, 26, leftAction, EMPH);

      // 右面板：联合式
      ctx.save();
      ctx.fillStyle = SHEET;
      rr(ctx, 570, 40, 470, 184, 12);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = INK;
      ctx.font = 'bold 17px ' + FONT;
      ctx.fillText('联合式', 592, 74);
      drawBar(ctx, 600, 100, 400, 26, rightProg, ROUTE);
      drawBar(ctx, 600, 150, 400, 26, rightProg, EMPH);

      // 互约束虚线（紫色，随进度出现并闪动）
      if (rightProg > 0.05) {
        const pulse = 0.45 + 0.4 * Math.abs(Math.sin(performance.now() / 260));
        ctx.save();
        ctx.setLineDash([7, 6]);
        ctx.strokeStyle = AUX;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(600, 138);
        ctx.lineTo(600 + 400 * rightProg, 138);
        ctx.stroke();
        ctx.restore();
      }

      // 底部：图例 + 一致性指示
      drawLegend(
        ctx,
        [
          { color: ROUTE, text: '未来' },
          { color: EMPH, text: '动作' },
          { color: AUX, text: '约束' },
        ],
        60,
        250
      );
      ctx.fillStyle = MUTED;
      ctx.font = '13px ' + FONT;
      ctx.fillText('一致性', 620, 252);
      ctx.fillStyle = LINE;
      ctx.fillRect(680, 241, 90, 12);
      ctx.fillStyle = MUTED;
      ctx.fillRect(680, 241, 90 * (0.25 + 0.2 * leftFuture), 12);
      ctx.fillStyle = LINE;
      ctx.fillRect(800, 241, 90, 12);
      ctx.fillStyle = OK;
      ctx.fillRect(800, 241, 90 * (0.35 + 0.5 * rightProg), 12);
    };

    const tickFn = (): void => {
      const s = stateRef.current;
      const now = performance.now();
      if (s.phase === 'run') {
        const p = clamp((now - s.start) / DUR, 0, 1);
        const nt = Math.round(p * TICKS);
        if (nt !== s.tick) {
          s.tick = nt;
          setTick(nt);
        }
        if (p >= 1) {
          s.phase = 'hold';
          s.holdStart = now;
          setPhase('hold');
          setRan(true);
          setFeedback({ text: DONE_FEEDBACK, cls: '' });
        }
      } else if (s.phase === 'hold') {
        if (now - s.holdStart > HOLD_MS) {
          s.phase = 'idle';
          s.tick = 0;
          setPhase('idle');
          setTick(0);
          setFeedback({ text: IDLE_FEEDBACK, cls: '' });
        }
      }
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tickFn);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tickFn);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = (): void => {
    const s = stateRef.current;
    if (s.phase === 'run') return;
    s.phase = 'run';
    s.start = performance.now();
    s.tick = 0;
    setPhase('run');
    setTick(0);
    setFeedback({ text: RUN_FEEDBACK, cls: '' });
  };

  const label = ran && phase !== 'run' ? '再跑一次' : '开始对比';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button
          type="button"
          className={'chip' + (phase === 'run' ? ' selected' : '')}
          onClick={onStart}
          disabled={phase === 'run'}
        >
          {label}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M51;
