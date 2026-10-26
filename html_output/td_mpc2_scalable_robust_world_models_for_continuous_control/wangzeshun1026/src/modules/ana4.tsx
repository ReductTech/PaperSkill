import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  WOOD,
  OK,
  EMPH,
  INK,
  MUTED,
  clearScene,
  drawTable,
  drawBall,
  drawCue,
  drawShot,
  drawPocket,
  drawSceneLabel,
  drawLegend,
  seeded,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 隐喻动画：脑中试打很多杆，只留最好的几种。
// 自动循环，无控件、无反馈条。
const W = 560;
const H = 140;
const DUR = 3200;

interface Shot {
  pts: number[][];
  score: number;
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const rnd = seeded(20240418);
    const sx = 68;
    const sy = 71;
    const px = 508;
    const py = 71;
    const shots: Shot[] = [];
    for (let i = 0; i < 40; i++) {
      const endX = px - 4 + (rnd() - 0.5) * 22;
      const endY = py + (rnd() - 0.5) * 62;
      const bend = (rnd() - 0.5) * 34;
      const pts: number[][] = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        pts.push([
          lerp(sx, endX, t),
          lerp(sy, endY, t) + Math.sin(t * Math.PI) * bend,
        ]);
      }
      const score = -Math.hypot(endX - px, endY - py) - Math.abs(bend) * 0.2;
      shots.push({ pts, score });
    }
    shots.sort((a, b) => b.score - a.score);
    const elite = shots.slice(0, 8);
    const eliteSet = new Set<Shot>(elite);
    const best = shots[0];
    const t0 = performance.now();

    const render = (now: number) => {
      const phase = ((now - t0) % DUR) / DUR;
      clearScene(ctx, W, H);
      drawTable(ctx, 40, 38, 480, 72);
      drawPocket(ctx, px, py, 7);

      const cloud = clamp(phase / 0.3, 0, 1);
      ctx.globalAlpha = 0.16 * cloud;
      for (const shot of shots) {
        if (eliteSet.has(shot)) continue;
        drawShot(ctx, shot.pts, MUTED, 1, [4, 4]);
      }

      const eliteAlpha = clamp((phase - 0.4) / 0.18, 0, 1);
      ctx.globalAlpha = 0.72 * eliteAlpha;
      for (const shot of elite) drawShot(ctx, shot.pts, OK, 1.6);

      const bestAlpha = clamp((phase - 0.66) / 0.16, 0, 1);
      if (bestAlpha > 0) {
        ctx.globalAlpha = bestAlpha;
        drawShot(ctx, best.pts, EMPH, 2.6);
        const last = best.pts[best.pts.length - 1];
        const angle = Math.atan2(last[1] - sy, last[0] - sx);
        drawCue(ctx, sx, sy, angle, 44, WOOD);
      }

      ctx.globalAlpha = 1;
      const pulse = 1 + Math.sin(now / 150) * 0.07;
      drawBall(ctx, sx, sy, 8 * pulse, '#f3f0e4', true);

      drawSceneLabel(ctx, '试打很多杆', 40, 22, INK);
      drawSceneLabel(ctx, '只留最好的', 300, 22, INK);
      drawLegend(
        ctx,
        [
          { color: MUTED, text: '候选' },
          { color: OK, text: '精英' },
          { color: EMPH, text: '选用' },
        ],
        40,
        132
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

export default Ana4;
