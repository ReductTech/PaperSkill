import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawTable,
  drawBall,
  drawCue,
  drawShot,
  drawPocket,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  AUX,
  LINE,
  WOOD,
  INK,
} from './billiardsKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const LOOP = 3200;
const BALL = '#f6f1e3';

// 左侧：一条要提前排练的多库走位路线
const L_PATH: number[][] = [
  [52, 68],
  [70, 38],
  [218, 36],
  [226, 92],
  [248, 68],
];
const L_START: [number, number] = [52, 68];
const L_POCKET: [number, number] = [248, 68];

// 右侧：每次现场试打，向袋口方向散开几条短线路
const R_START: [number, number] = [332, 68];
const R_POCKET: [number, number] = [528, 68];
const R_TARGETS: number[][] = [
  [516, 44],
  [516, 56],
  [516, 68],
  [516, 80],
  [516, 92],
];

function pointAlong(pts: number[][], u: number): [number, number] {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(d);
    total += d;
  }
  let target = clamp(u, 0, 1) * total;
  for (let i = 0; i < lens.length; i++) {
    if (target <= lens[i] || i === lens.length - 1) {
      const t = lens[i] === 0 ? 0 : clamp(target / lens[i], 0, 1);
      return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)];
    }
    target -= lens[i];
  }
  const last = pts[pts.length - 1];
  return [last[0], last[1]];
}

function pathUpTo(pts: number[][], u: number): number[][] {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(d);
    total += d;
  }
  const target = clamp(u, 0, 1) * total;
  const out: number[][] = [pts[0]];
  let acc = 0;
  for (let i = 0; i < lens.length; i++) {
    if (acc + lens[i] <= target) {
      out.push(pts[i + 1]);
      acc += lens[i];
    } else {
      const t = lens[i] === 0 ? 0 : clamp((target - acc) / lens[i], 0, 1);
      out.push([lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]);
      break;
    }
  }
  return out;
}

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const t0 = performance.now();

    const render = (now: number) => {
      const cyc = ((now - t0) % LOOP + LOOP) % LOOP;
      const p = cyc / LOOP;
      const rehearse = clamp(p / 0.55, 0, 1);
      const u = clamp((p - 0.55) / 0.3, 0, 1);
      const e = u * u * (3 - 2 * u);

      clearScene(ctx, W, H);
      drawTable(ctx, 20, 32, 240, 72);
      drawTable(ctx, 300, 32, 240, 72);

      // 左侧：先排练整条路线
      if (p < 0.55) {
        const partial = pathUpTo(L_PATH, rehearse);
        if (partial.length >= 2) drawShot(ctx, partial, AUX, 2, [5, 5]);
      } else {
        drawShot(ctx, L_PATH, LINE, 1.5, [5, 5]);
        const lb = pointAlong(L_PATH, e);
        const exec = pathUpTo(L_PATH, e);
        if (exec.length >= 2) drawShot(ctx, exec, OK, 2.5);
        const sunk = u > 0.97;
        if (!sunk) drawBall(ctx, lb[0], lb[1], 8, BALL, true);
        if (u < 0.18) {
          const next = pointAlong(L_PATH, 0.06);
          const ang = Math.atan2(next[1] - L_START[1], next[0] - L_START[0]);
          drawCue(ctx, L_START[0], L_START[1], ang, 50, WOOD);
        }
      }
      if (p < 0.55) drawBall(ctx, L_START[0], L_START[1], 8, BALL, true);

      // 右侧：每一杆都现场试打几条候选线
      for (let i = 0; i < R_TARGETS.length; i++) {
        const target = R_TARGETS[i];
        const chosen = i === 2;
        drawShot(
          ctx,
          [R_START, target],
          chosen && p > 0.4 ? OK : GUIDE,
          chosen && p > 0.4 ? 2 : 1.3,
          [5, 5]
        );
      }
      const rb: [number, number] = [lerp(R_START[0], R_POCKET[0], e), lerp(R_START[1], R_POCKET[1], e)];
      drawShot(ctx, [R_START, rb], OK, 2.5);
      const rSunk = u > 0.97;
      if (!rSunk) drawBall(ctx, rb[0], rb[1], 8, BALL, true);
      if (u < 0.18) drawCue(ctx, R_START[0], R_START[1], 0, 50, WOOD);

      drawPocket(ctx, L_POCKET[0], L_POCKET[1], 9);
      drawPocket(ctx, R_POCKET[0], R_POCKET[1], 9);

      drawSceneLabel(ctx, '先排练', 20, 20, INK);
      drawSceneLabel(ctx, '现场试打', 300, 20, INK);
      drawLegend(
        ctx,
        [
          { color: AUX, text: '排练路线' },
          { color: GUIDE, text: '候选' },
          { color: OK, text: '出杆' },
        ],
        20,
        132
      );
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana8;
