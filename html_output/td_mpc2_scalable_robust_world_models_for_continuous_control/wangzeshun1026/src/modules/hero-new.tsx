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
  MUTED,
  INK,
} from './billiardsKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 200;
const LOOP = 3200;
const BALL_X = 100;
const BALL_Y = 101;
const POCKET_X = 500;
const POCKET_Y = 101;
const BALL = '#f6f1e3';
const OFFSETS = [-0.075, -0.038, 0, 0.038, 0.075];

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const base = Math.atan2(POCKET_Y - BALL_Y, POCKET_X - BALL_X);
    const dist = Math.hypot(POCKET_X - BALL_X, POCKET_Y - BALL_Y);

    const render = (now: number) => {
      const cyc = ((now - t0) % LOOP + LOOP) % LOOP;
      const p = cyc / LOOP;
      const u = clamp((p - 0.75) / 0.18, 0, 1);
      const e = u * u * (3 - 2 * u);

      clearScene(ctx, W, H);
      drawTable(ctx, 40, 48, 480, 106);

      if (p < 0.25) {
        const t = p / 0.25;
        for (let i = 0; i < 3; i++) {
          const phase = (t + i / 3) % 1;
          ctx.globalAlpha = 0.4 * (1 - phase);
          ctx.strokeStyle = GUIDE;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(BALL_X, BALL_Y, 8 + phase * 80, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      const reveal = clamp((p - 0.25) / 0.3, 0, 1);
      for (let i = 0; i < OFFSETS.length; i++) {
        const ang = base + OFFSETS[i];
        const ex = BALL_X + Math.cos(ang) * dist;
        const ey = BALL_Y + Math.sin(ang) * dist;
        if (p < 0.25 || i / OFFSETS.length > reveal) continue;
        const isBest = i === 2;
        const active = p > 0.55;
        drawShot(
          ctx,
          [[BALL_X, BALL_Y], [ex, ey]],
          isBest && active ? OK : active ? MUTED : AUX,
          isBest && active ? 2.4 : 1.3,
          [5, 5]
        );
      }

      drawPocket(ctx, POCKET_X, POCKET_Y, 9);

      if (p >= 0.75) {
        const bx = lerp(BALL_X, POCKET_X, e);
        const by = lerp(BALL_Y, POCKET_Y, e);
        drawShot(ctx, [[BALL_X, BALL_Y], [bx, by]], OK, 3);
        if (u < 0.2) drawCue(ctx, BALL_X, BALL_Y, base, 70, OK);
        if (u < 0.98) {
          const r = 8 * (1 - clamp((u - 0.8) / 0.18, 0, 1) * 0.8);
          drawBall(ctx, bx, by, r, BALL, true);
        }
        drawPocket(ctx, POCKET_X, POCKET_Y, 9);
      } else {
        drawBall(ctx, BALL_X, BALL_Y, 8, BALL, true);
      }

      if (p > 0.9) {
        ctx.fillStyle = 'rgba(34, 141, 92, 0.10)';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = OK;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, W - 4, H - 4);
      }

      drawSceneLabel(ctx, '读一次台', 40, 28, INK);
      drawSceneLabel(ctx, '一杆进袋', 450, 28, p > 0.9 ? OK : MUTED);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '读台' },
          { color: AUX, text: '试打' },
          { color: OK, text: '选中' },
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

export default HeroNew;
