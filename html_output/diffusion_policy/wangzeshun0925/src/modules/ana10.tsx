import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawStraightedge,
  drawLegend,
  OK,
  BAD,
  FIELD,
} from './woodKit';
import type { WidgetProps } from './registry';

// Chapter 10 analogy (560x140, automatic 3 s loop): two planed boards lie side by
// side on the bench and a straightedge measures each one. The left straightedge
// still bridges a gap (red wedge), the right one lies flush (green hairline), and
// the two flatness bars grow to their respective readings.

const W = 560;
const H = 140;
const LOOP = 3000;

const BOARD_TOP = 96;
const BOARD_H = 22;
const BOARD_W = 214;
const BOARD_X = [28, 318];
const BAR_Y = 124;
const BAR_H = 8;
const BAR_MAX = 186;
const FLATNESS = [0.72, 1];

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

/** Raised ends with a hollow middle — exactly what a straightedge has to measure. */
function raisedEdges(n: number, amp: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const edge = Math.min(u, 1 - u);
    out.push(amp * Math.max(0, 1 - edge / 0.26));
  }
  return out;
}

export const Ana10: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const raised = raisedEdges(56, 10);

    const render = (u: number) => {
      clearScene(ctx, W, H);
      const descend = easeOutCubic(clamp(u / 0.26, 0, 1));
      const grow = easeOutCubic(clamp((u - 0.3) / 0.46, 0, 1));
      ctx.textAlign = 'left';

      for (let i = 0; i < 2; i++) {
        const x = BOARD_X[i];
        const lift = i === 0 ? 10 : 0;
        drawBoard(ctx, x, BOARD_TOP, BOARD_W, BOARD_H, i === 0 ? raised : null);

        const seY = BOARD_TOP - lift - 30 * (1 - descend);
        ctx.globalAlpha = 0.45 + 0.55 * descend;
        drawStraightedge(ctx, x, seY, BOARD_W, lift);
        ctx.globalAlpha = 1;

        const full = BAR_MAX * FLATNESS[i];
        ctx.fillStyle = OK;
        ctx.fillRect(x + 6, BAR_Y, full * grow, BAR_H);

        ctx.globalAlpha = grow;
        ctx.fillStyle = FIELD;
        ctx.font = '12px ' + FONT;
        ctx.fillText(FLATNESS[i].toFixed(2), x + 6 + full + 8, BAR_Y + BAR_H - 1);
        ctx.globalAlpha = 1;
      }

      drawLegend(
        ctx,
        [
          { color: OK, text: '贴合' },
          { color: BAD, text: '缝隙' },
        ],
        24,
        22
      );
    };

    const tick = () => {
      render((performance.now() % LOOP) / LOOP);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana10;
