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
  BAD,
  EMPH,
  MUTED,
  WOOD,
  INK,
} from './billiardsKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 200;
const LOOP = 3200;
const BALL_X = 100;
const BALL_Y = 101;
const POCKETS: number[][] = [
  [496, 101],
  [470, 91],
  [506, 113],
];
const BALL = '#f6f1e3';

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const ti = p < 0.25 ? 0 : p < 0.5 ? 1 : 2;
      const pocket = POCKETS[ti];
      const q = p < 0.75 ? (p % 0.25) / 0.25 : 1;
      const base = Math.atan2(pocket[1] - BALL_Y, pocket[0] - BALL_X);
      const aim = p < 0.75 ? base + Math.sin(now * 0.012) * 0.22 * (1 - q) : base + 0.09;
      const dist = Math.hypot(pocket[0] - BALL_X, pocket[1] - BALL_Y) - 24;
      const endX = BALL_X + Math.cos(base + 0.09) * dist;
      const endY = BALL_Y + Math.sin(base + 0.09) * dist;
      const u = clamp((p - 0.75) / 0.18, 0, 1);
      const e = u * u * (3 - 2 * u);

      clearScene(ctx, W, H);
      drawTable(ctx, 40, 48, 480, 106);

      if (ti === 1) {
        ctx.fillStyle = 'rgba(39, 68, 110, 0.10)';
        ctx.fillRect(40, 48, 480, 106);
      } else if (ti === 2) {
        ctx.fillStyle = 'rgba(240, 126, 71, 0.12)';
        ctx.fillRect(40, 48, 480, 106);
      }

      drawPocket(ctx, pocket[0], pocket[1], 9);

      if (p < 0.75) {
        drawCue(ctx, BALL_X, BALL_Y, aim, 70, WOOD);
        drawBall(ctx, BALL_X, BALL_Y, 8, BALL, true);
      } else {
        drawShot(ctx, [[BALL_X, BALL_Y], [endX, endY]], BAD, 2, [6, 5]);
        const bx = lerp(BALL_X, endX, e);
        const by = lerp(BALL_Y, endY, e);
        drawBall(ctx, bx, by, 8, BALL, true);
        if (u > 0.96) {
          ctx.strokeStyle = BAD;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(bx, by, 12, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const k = p < 0.75 ? Math.min(5, Math.ceil(q * 5)) : 0;
      drawGauge(ctx, 40, 170, 480, 8, 5, k, EMPH);

      if (p > 0.9) {
        ctx.fillStyle = 'rgba(196, 63, 82, 0.10)';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, W - 4, H - 4);
      }

      drawSceneLabel(ctx, '换台重学', 40, 28, BAD);
      drawSceneLabel(ctx, '还是没进', 450, 28, p > 0.9 ? BAD : MUTED);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '出杆' },
          { color: EMPH, text: '手感' },
          { color: BAD, text: '打偏' },
        ],
        40,
        192
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

export default HeroOld;
