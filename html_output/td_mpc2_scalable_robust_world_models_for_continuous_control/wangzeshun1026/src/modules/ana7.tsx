import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawTable,
  drawBall,
  drawCue,
  drawShot,
  drawPocket,
  drawGauge,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  LINE,
  INK,
} from './billiardsKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const LOOP = 3200;
const START_X = 80;
const START_Y = 60;
const MISS_X = 478;
const POCKET_X = 505;
const POCKET_Y = 60;
const MISS_OFFSETS = [22, 15, 9, 4, 0];
const BALL = '#f6f1e3';

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const seq = Math.min(0.999, p / 0.85);
      const lv = Math.min(4, Math.floor(seq * 5));
      const local = seq * 5 - lv;
      const u = clamp((local - 0.3) / 0.62, 0, 1);
      const e = u * u * (3 - 2 * u);
      const endX = lv === 4 ? POCKET_X : MISS_X;
      const endY = START_Y + MISS_OFFSETS[lv];
      const angle = Math.atan2(endY - START_Y, endX - START_X);

      clearScene(ctx, W, H);
      drawTable(ctx, 30, 24, 500, 72);

      for (let j = 0; j < lv; j++) {
        drawShot(ctx, [[START_X, START_Y], [MISS_X, START_Y + MISS_OFFSETS[j]]], LINE, 1.5, [5, 5]);
      }

      drawShot(ctx, [[START_X, START_Y], [endX, endY]], lv === 4 ? OK : GUIDE, 2, [6, 5]);

      const bx = lerp(START_X, endX, e);
      const by = lerp(START_Y, endY, e);
      const sunk = lv === 4 && u > 0.98;
      if (!sunk) {
        const r = lv === 4 ? 8 * (1 - clamp((u - 0.82) / 0.18, 0, 1) * 0.75) : 8;
        drawBall(ctx, bx, by, r, BALL, true);
      }
      if (local < 0.3) {
        drawCue(ctx, START_X, START_Y, angle, 48 + 14 * (local / 0.3), INK);
      }
      drawPocket(ctx, POCKET_X, POCKET_Y, 9);

      drawGauge(ctx, 30, 104, 500, 5, 5, lv + 1, OK);
      drawSceneLabel(ctx, '换更好的杆', 30, 16, INK);
      drawSceneLabel(ctx, '稳步提升', 452, 16, OK);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '试打' },
          { color: OK, text: '进球' },
        ],
        30,
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

export default Ana7;
