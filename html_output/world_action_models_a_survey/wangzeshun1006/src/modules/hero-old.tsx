import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawRoute,
  drawSurveyor,
  drawSheetLabel,
  BAD,
  ROUTE,
  CONTOUR,
  INK,
  MUTED,
} from './chartkit';
import type { WidgetProps } from './registry';

// 封面左栏（旧方法，红）：只追求"画得像"的测绘员。他画出一张华丽的写实风景画，
// 交给旅人的却是一张没有路标的图；旅人在岔路口凭"好看"选错方向。自动循环，无控件。

const W = 560;
const H = 140;
const CYCLE = 3200;

const SHEET = { x: 24, y: 14, w: 200, h: 112 };
const MAP = { x: 316, y: 42, w: 120, h: 66 };
const FORK = { x: 476, y: 100 };

type SurveyPose = 'sight' | 'draw' | 'walk' | 'plant' | 'check';

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

    const render = (now: number): void => {
      const t = ((now - t0) % CYCLE) / CYCLE;
      const walking = t < 0.68;
      const lost = t >= 0.68;
      clearField(ctx, W, H);

      // 华丽的写实风景画：密等高线 + 排线阴影（细节多，但没有路）。
      drawSheet(ctx, SHEET.x, SHEET.y, SHEET.w, SHEET.h);
      drawContours(ctx, SHEET.x, SHEET.y, SHEET.w, SHEET.h, 31, CONTOUR, 7);
      ctx.save();
      ctx.strokeStyle = CONTOUR;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        const yy = SHEET.y + 10 + i * 12;
        ctx.beginPath();
        ctx.moveTo(SHEET.x + 8, yy);
        ctx.lineTo(SHEET.x + SHEET.w - 8, yy + (i % 2 === 0 ? 3 : -3));
        ctx.stroke();
      }
      ctx.restore();

      // 测绘员在作画。
      drawSurveyor(ctx, SHEET.x + SHEET.w + 26, SHEET.y + SHEET.h + 8, 1.0, INK, 'draw');

      // 交给旅人的图：同样精细，却没有路线与路标。
      drawSheet(ctx, MAP.x, MAP.y, MAP.w, MAP.h);
      drawContours(ctx, MAP.x, MAP.y, MAP.w, MAP.h, 44, CONTOUR, 5);
      ctx.save();
      ctx.strokeStyle = BAD;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.arc(MAP.x + MAP.w / 2, MAP.y + MAP.h / 2, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 岔路：正确支路（蓝）与错误支路（红）。
      drawRoute(
        ctx,
        [
          [FORK.x, FORK.y],
          [FORK.x + 34, FORK.y - 20],
          [FORK.x + 66, FORK.y - 42],
        ],
        ROUTE,
        2.5
      );
      drawRoute(
        ctx,
        [
          [FORK.x, FORK.y],
          [FORK.x + 32, FORK.y + 12],
          [FORK.x + 62, FORK.y + 22],
        ],
        BAD,
        2.5
      );

      // 旅人：走到岔路，凭"好看"选了错误支路。
      let px = 404;
      let py = 108;
      let pose: SurveyPose = 'walk';
      let color = INK;
      if (walking && t < 0.34) {
        const p = easeOutCubic(clamp(t / 0.34, 0, 1));
        px = lerp(404, FORK.x, p);
        py = lerp(108, FORK.y, p);
      } else if (walking) {
        const p = easeOutCubic(clamp((t - 0.34) / 0.34, 0, 1));
        px = lerp(FORK.x, FORK.x + 62, p);
        py = lerp(FORK.y, FORK.y + 22, p);
      } else {
        px = FORK.x + 62;
        py = FORK.y + 22;
        pose = 'check';
        color = BAD;
      }
      drawSurveyor(ctx, px, py, 0.9, color, pose);

      if (lost) {
        ctx.save();
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(px - 7, py - 40);
        ctx.lineTo(px + 7, py - 26);
        ctx.moveTo(px + 7, py - 40);
        ctx.lineTo(px - 7, py - 26);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = BAD;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, W - 4, H - 4);
      }

      drawSheetLabel(ctx, '画得像', SHEET.x, 12, MUTED);
      if (lost) drawSheetLabel(ctx, '走错', FORK.x + 30, 30, BAD);
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

export default HeroOld;
