import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawPin,
  drawSurveyor,
  drawTripod,
  drawSheetLabel,
  EMPH,
  OK,
  ROUTE,
  CONTOUR,
  INK,
  LINE,
  MUTED,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana9 — 把空白图幅补上。地图上几片空白；测绘员走到空白处，测一笔、画一笔，
// 把空白逐个补上；循环。单一活动主体（测绘员），无控件、无反馈。

const W = 560;
const H = 140;
const CYCLE = 3600;

const SX = 40;
const SY = 20;
const SW = 420;
const SH = 104;
const COLS = 3;
const ROWS = 2;
const CW = SW / COLS;
const CH = SH / ROWS;

const BLANKS: number[][] = [
  [2, 1],
  [0, 1],
  [2, 0],
];

function cellRect(c: number, r: number): number[] {
  return [SX + c * CW, SY + r * CH, CW, CH];
}
function cellCenter(c: number, r: number): number[] {
  return [SX + c * CW + CW / 2, SY + r * CH + CH / 2];
}
function along(a: number[], b: number[], f: number): number[] {
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
}

type SurveyPose = 'sight' | 'draw' | 'walk' | 'plant' | 'check';

export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number): void => {
      const t = ((now - t0) % CYCLE) / CYCLE;
      clearField(ctx, W, H);
      drawSheet(ctx, SX, SY, SW, SH);

      // 空白图幅：虚线格。已测得格：等高线。
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const [x, y, w, h] = cellRect(c, r);
          const blankIdx = BLANKS.findIndex((b) => b[0] === c && b[1] === r);
          const filled = blankIdx === -1 ? true : t >= 0.06 + blankIdx * 0.28 + 0.17;
          if (filled) {
            drawContours(ctx, x + 3, y + 4, w - 6, h - 8, 5 + c * 3 + r * 7, CONTOUR, 2);
            ctx.strokeStyle = LINE;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);
          } else {
            ctx.save();
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = LINE;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
            ctx.restore();
          }
        }
      }

      // 测绘员：逐格走过去、测一笔、画一笔。
      const start = [SX + 24, SY + SH - 8];
      let px = start[0];
      let py = start[1];
      let pose: SurveyPose = 'walk';
      let color = INK;
      let prev = start;
      for (let i = 0; i < BLANKS.length; i++) {
        const [c, r] = BLANKS[i];
        const center = cellCenter(c, r);
        const t0i = 0.06 + i * 0.28;
        const tFill = t0i + 0.17;
        const tEnd = t0i + 0.28;
        if (t >= t0i && t < tFill) {
          const f = easeOutCubic(clamp((t - t0i) / 0.17, 0, 1));
          const p = along(prev, center, f);
          px = p[0];
          py = p[1];
          pose = 'walk';
          color = ROUTE;
          break;
        } else if (t >= tFill && t < tEnd) {
          px = center[0];
          py = center[1];
          pose = 'plant';
          color = EMPH;
          const pulse = 1 - clamp((t - tFill) / 0.11, 0, 1);
          ctx.save();
          ctx.globalAlpha = 0.35 * (1 - pulse) + 0.12;
          ctx.strokeStyle = EMPH;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(center[0], center[1], 14 + 16 * (1 - pulse), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          drawPin(ctx, center[0], center[1], EMPH, true);
          break;
        } else {
          prev = center;
        }
      }
      // 补完最后一格后，测绘员停在原地作检查。
      if (t >= 0.9) {
        const last = cellCenter(BLANKS[BLANKS.length - 1][0], BLANKS[BLANKS.length - 1][1]);
        px = last[0];
        py = last[1];
        pose = 'check';
        color = OK;
      }

      // 静态道具：一枚立好的三脚架。
      drawTripod(ctx, SX + 12, SY + SH - 6, 0.85, MUTED);
      drawSurveyor(ctx, px, py, 0.9, color, pose);

      // 已补的空白用路标标出。
      for (let i = 0; i < BLANKS.length; i++) {
        const [c, r] = BLANKS[i];
        if (t >= 0.06 + i * 0.28 + 0.17) {
          const center = cellCenter(c, r);
          drawPin(ctx, center[0], center[1], t >= 0.9 ? OK : ROUTE, false);
        }
      }

      drawSheetLabel(ctx, '补空白', SX, 14, ROUTE);
      if (t >= 0.9) drawSheetLabel(ctx, '补全', SX + SW - 60, 14, OK);
    };

    const tick = (now: number): void => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
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

export default Ana9;
