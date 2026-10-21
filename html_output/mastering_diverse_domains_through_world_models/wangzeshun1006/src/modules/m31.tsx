import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawHold,
  drawSceneLabel,
  drawLegend,
  BAD,
  GUIDE,
  OK,
  HOLD,
  INK,
  LINE,
} from './climbkit';
import type { WidgetProps } from './registry';

// m31 — 真实环境 vs 想象轨迹。两个面板共用同一时间轴：左边每翻一格都消耗真实环境步数，
// 右边的每一格由世界模型生成，环境步数始终为 0。演示用的步数比例只为看清机制，不是论文数值。

const W = 1080;
const H = 280;
const DUR = 3200;
const HOLD_MS = 1500;
const CELLS = 8;
const WALL_W = 280;
const WALL_Y = 38;
const WALL_H = 200;
const LEFT_X = 70;
const RIGHT_X = 600;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type Phase = 'idle' | 'run' | 'hold';

function routePoint(i: number, wallX: number): number[] {
  const y = lerp(226, 54, i / CELLS);
  const x = wallX + WALL_W / 2 + Math.sin(i * 1.15) * 66;
  return [x, y];
}

function dashedPolyline(
  ctx: CanvasRenderingContext2D,
  pts: number[][],
  color: string,
  width: number
): void {
  if (pts.length < 2) return;
  ctx.save();
  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

function drawNumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  v: number,
  color: string,
  size: number
): void {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(Math.round(v)), x, y);
}

const IDLE_FEEDBACK =
  '两个面板共用同一时间轴：左边走一步就消耗一次真实交互，右边由世界模型生成。';
const RUN_FEEDBACK = '左边每翻一格都要真的爬；右边只是脑内模拟，环境步数始终为 0。';
const DONE_FEEDBACK =
  '同一段时间里，想象轨迹走了多得多的步数，而真实交互只有左边那几步。演示里的步数比例只为看清机制，不是论文数值。';

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      clearCrag(ctx, W, H);
      drawWall(ctx, LEFT_X, WALL_Y, WALL_W, WALL_H);
      drawWall(ctx, RIGHT_X, WALL_Y, WALL_W, WALL_H);

      const lpts: number[][] = [];
      const rpts: number[][] = [];
      for (let i = 0; i <= CELLS; i++) {
        lpts.push(routePoint(i, LEFT_X));
        rpts.push(routePoint(i, RIGHT_X));
      }

      // 左：真实环境（红色实线，已爬部分）
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lpts[0][0], lpts[0][1]);
      for (let i = 1; i <= CELLS; i++) ctx.lineTo(lpts[i][0], lpts[i][1]);
      ctx.stroke();
      if (s.tick >= 1) {
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lpts[0][0], lpts[0][1]);
        for (let i = 1; i <= s.tick; i++) ctx.lineTo(lpts[i][0], lpts[i][1]);
        ctx.stroke();
      }
      for (let i = 0; i <= CELLS; i++) drawHold(ctx, lpts[i][0], lpts[i][1], 5, HOLD, i === s.tick);

      // 右：想象轨迹（蓝色虚线）
      dashedPolyline(ctx, rpts, GUIDE, 2.5);
      for (let i = 0; i <= CELLS; i++) drawHold(ctx, rpts[i][0], rpts[i][1], 5, HOLD, i === s.tick);

      // 两个攀岩者按同一时间基准移动
      drawClimber(ctx, lpts[s.tick][0], lpts[s.tick][1], 0.85, INK, 'reach');
      drawClimber(ctx, rpts[s.tick][0], rpts[s.tick][1], 0.85, INK, 'reach');

      // 计数（裸数字）：左真实步数 / 右环境零步 + 想象步数
      drawNumber(ctx, LEFT_X, 272, s.tick, BAD, 30);
      drawNumber(ctx, RIGHT_X, 272, 0, OK, 30);
      drawNumber(ctx, RIGHT_X + 150, 272, s.tick * 5, GUIDE, 30);

      drawSceneLabel(ctx, '真实环境', LEFT_X, 30, BAD);
      drawSceneLabel(ctx, '想象轨迹', RIGHT_X, 30, OK);
      drawLegend(
        ctx,
        [
          { color: BAD, text: '真实步数' },
          { color: GUIDE, text: '想象步数' },
          { color: OK, text: '环境零步' },
        ],
        80,
        254
      );
    };

    const tickFn = (): void => {
      const s = stateRef.current;
      const now = performance.now();
      if (s.phase === 'run') {
        const p = clamp((now - s.start) / DUR, 0, 1);
        const nt = Math.min(CELLS, Math.ceil(p * CELLS));
        if (nt !== s.tick) {
          s.tick = nt;
          setTick(nt);
        }
        if (p >= 1) {
          s.phase = 'hold';
          s.holdStart = now;
          setPhase('hold');
          setRan(true);
          setFeedback({ text: DONE_FEEDBACK, cls: 'good' });
        }
      } else if (s.phase === 'hold') {
        if (now - s.holdStart > HOLD_MS) {
          s.phase = 'idle';
          s.tick = 0;
          setPhase('idle');
          setTick(0);
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
        <button className={'chip' + (phase === 'run' ? ' selected on' : '')} onClick={onStart} disabled={phase === 'run'}>
          {label}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M31;
