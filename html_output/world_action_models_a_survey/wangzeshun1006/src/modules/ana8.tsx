import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawRoute,
  drawPin,
  drawSurveyor,
  drawSheetLabel,
  drawLegend,
  BAD,
  EMPH,
  OK,
  ROUTE,
  CONTOUR,
  INK,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana8 — 拿图去试走。测绘员沿图上画的路线走一小段，脚下一处坡太陡（图上没标），
// 他停下退回图前，把那一段改成绕行；循环。单一主体（测绘员），无控件、无反馈。

const W = 560;
const H = 140;
const CYCLE = 3400;

const SX = 40;
const SY = 22;
const SW = 300;
const SH = 100;

// 原路线：中间一段翻过陡坡。
const ORIG: number[][] = [
  [62, 104],
  [120, 96],
  [178, 74],
  [236, 62],
  [300, 46],
];
// 走到了陡坡上的点。
const STEEP: number[] = [207, 68];
// 改道：绕过陡坡的一段。
const DETOUR: number[][] = [
  [178, 74],
  [196, 88],
  [232, 90],
  [262, 64],
  [300, 46],
];
const WALK1: number[][] = [[62, 104], [120, 96], [178, 74], [207, 68]];
const WALK2: number[][] = [
  [62, 104],
  [120, 96],
  [178, 74],
  [196, 88],
  [232, 90],
  [262, 64],
  [300, 46],
];

type SurveyPose = 'sight' | 'draw' | 'walk' | 'plant' | 'check';

function along(pts: number[][], f: number): number[] {
  if (pts.length === 0) return [0, 0];
  if (pts.length === 1) return [pts[0][0], pts[0][1]];
  const segs = pts.length - 1;
  const s = clamp(f, 0, 1) * segs;
  const i = clamp(Math.floor(s), 0, segs - 1);
  const ft = s - i;
  return [lerp(pts[i][0], pts[i + 1][0], ft), lerp(pts[i][1], pts[i + 1][1], ft)];
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

    const render = (now: number): void => {
      const t = ((now - t0) % CYCLE) / CYCLE;
      clearField(ctx, W, H);
      drawSheet(ctx, SX, SY, SW, SH);
      drawContours(ctx, SX, SY, SW, SH, 11, CONTOUR, 5);

      const walk1 = t >= 0.06 && t < 0.34;
      const stuck = t >= 0.34 && t < 0.46;
      const back = t >= 0.46 && t < 0.6;
      const redraw = t >= 0.6 && t < 0.74;
      const walk2 = t >= 0.74 && t < 0.96;
      const done = t >= 0.96;

      // 原路线（陡坡段在卡住/改道后淡出）。
      const steepOut = stuck || back || redraw || walk2 || done;
      ctx.save();
      ctx.globalAlpha = steepOut ? 0.3 : 1;
      drawRoute(
        ctx,
        steepOut ? [ORIG[0], ORIG[1], ORIG[2], ORIG[3], ORIG[4]] : ORIG,
        ROUTE,
        2.5
      );
      ctx.restore();

      if (stuck || redraw || walk2 || done) {
        // 陡坡标记（图上原本没标）。
        ctx.save();
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(STEEP[0] - 8, STEEP[1] + 8);
        ctx.lineTo(STEEP[0], STEEP[1] - 8);
        ctx.lineTo(STEEP[0] + 8, STEEP[1] + 8);
        ctx.stroke();
        ctx.restore();
      }

      if (redraw || walk2 || done) {
        drawRoute(ctx, DETOUR, EMPH, 3);
        drawPin(ctx, DETOUR[1][0], DETOUR[1][1], EMPH, false);
      }

      drawPin(ctx, ORIG[0][0], ORIG[0][1], ROUTE, false);
      drawPin(ctx, ORIG[ORIG.length - 1][0], ORIG[ORIG.length - 1][1], done ? OK : ROUTE, done);

      // 测绘员（唯一活动主体）。
      let px = ORIG[0][0];
      let py = ORIG[0][1];
      let pose: SurveyPose = 'walk';
      let color = INK;
      if (walk1) {
        const p = along(WALK1, easeOutCubic(clamp((t - 0.06) / 0.28, 0, 1)));
        px = p[0];
        py = p[1];
        pose = 'walk';
      } else if (stuck) {
        px = STEEP[0];
        py = STEEP[1];
        pose = 'check';
        color = BAD;
      } else if (back) {
        const p = along(WALK1, 1 - easeOutCubic(clamp((t - 0.46) / 0.14, 0, 1)));
        px = p[0];
        py = p[1];
        pose = 'walk';
      } else if (redraw) {
        px = ORIG[0][0] + 24;
        py = ORIG[0][1];
        pose = 'draw';
        color = EMPH;
      } else if (walk2) {
        const p = along(WALK2, easeOutCubic(clamp((t - 0.74) / 0.22, 0, 1)));
        px = p[0];
        py = p[1];
        pose = 'walk';
        color = OK;
      } else if (done) {
        px = ORIG[ORIG.length - 1][0];
        py = ORIG[ORIG.length - 1][1];
        pose = 'check';
        color = OK;
      }
      drawSurveyor(ctx, px, py, 0.9, color, pose);

      if (stuck) {
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px - 6, py - 34);
        ctx.lineTo(px + 6, py - 22);
        ctx.moveTo(px + 6, py - 34);
        ctx.lineTo(px - 6, py - 22);
        ctx.stroke();
      }
      if (done) {
        ctx.strokeStyle = OK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py - 18, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawSheetLabel(ctx, '试走', SX, 16, ROUTE);
      if (redraw || walk2 || done) drawSheetLabel(ctx, '改道', 250, 16, EMPH);
      drawLegend(
        ctx,
        [
          { color: ROUTE, text: '原路' },
          { color: EMPH, text: '改道' },
          { color: BAD, text: '太陡' },
        ],
        40,
        132
      );
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

export default Ana8;
