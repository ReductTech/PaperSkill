import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawRoute,
  drawPin,
  drawSurveyor,
  drawTripod,
  drawSheetLabel,
  OK,
  ROUTE,
  EMPH,
  CONTOUR,
  INK,
  MUTED,
} from './chartkit';
import type { WidgetProps } from './registry';

// 封面右栏（本文方法，绿）：同一位测绘员先测距、再简化、最后标上路标与索引；
// 旅人照着新图一路走通，图上只留能带路的东西。自动循环，无控件。

const W = 560;
const H = 140;
const CYCLE = 3400;

const SHEET = { x: 186, y: 20, w: 300, h: 104 };
const ROUTE_PTS: number[][] = [
  [214, 102],
  [262, 86],
  [312, 66],
  [372, 50],
  [440, 40],
];

function along(pts: number[][], f: number): number[] {
  if (pts.length === 0) return [0, 0];
  const segs = pts.length - 1;
  const s = clamp(f, 0, 1) * segs;
  const i = clamp(Math.floor(s), 0, segs - 1);
  const ft = s - i;
  return [lerp(pts[i][0], pts[i + 1][0], ft), lerp(pts[i][1], pts[i + 1][1], ft)];
}

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

    const render = (now: number): void => {
      const t = ((now - t0) % CYCLE) / CYCLE;
      const measure = t < 0.3;
      const simplify = t >= 0.3 && t < 0.55;
      const mark = t >= 0.55 && t < 0.74;
      const walking = t >= 0.74 && t < 0.95;
      const done = t >= 0.95;
      clearField(ctx, W, H);

      // 图幅：测距阶段先出现一片空白，简化后只留下能带路的等高线。
      drawSheet(ctx, SHEET.x, SHEET.y, SHEET.w, SHEET.h);
      const levels = measure ? 1 : 2;
      drawContours(ctx, SHEET.x, SHEET.y, SHEET.w, SHEET.h, 7, CONTOUR, levels);

      // 测距：三脚架 + 视线（示意，非论文数值）。
      if (measure) {
        drawTripod(ctx, 92, 116, 1.0, INK);
        drawSurveyor(ctx, 128, 118, 1.0, ROUTE, 'sight');
        ctx.save();
        ctx.strokeStyle = ROUTE;
        ctx.setLineDash([5, 6]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(140, 104);
        ctx.lineTo(SHEET.x + 30, SHEET.y + 50);
        ctx.stroke();
        ctx.restore();
      } else if (simplify) {
        drawSurveyor(ctx, 160, 118, 1.0, EMPH, 'draw');
      } else if (mark) {
        drawSurveyor(ctx, 168, 118, 1.0, EMPH, 'plant');
      }

      // 标记：路线与路标按进度铺开。
      if (mark || walking || done) {
        const fMark = done || walking ? 1 : easeOutCubic(clamp((t - 0.55) / 0.17, 0, 1));
        const n = Math.max(1, Math.round(fMark * (ROUTE_PTS.length - 1)));
        const shown = ROUTE_PTS.slice(0, n + 1);
        drawRoute(ctx, shown, ROUTE, 2.5);
        for (let i = 0; i <= n; i++) {
          drawPin(
            ctx,
            ROUTE_PTS[i][0],
            ROUTE_PTS[i][1],
            i === ROUTE_PTS.length - 1 ? (done ? OK : EMPH) : ROUTE,
            i === n
          );
        }
      }

      // 旅人：照着新图一路走通。
      if (walking || done) {
        const f = done ? 1 : easeOutCubic(clamp((t - 0.74) / 0.21, 0, 1));
        const p = along(ROUTE_PTS, f);
        drawSurveyor(ctx, p[0], p[1], 0.9, done ? OK : ROUTE, done ? 'check' : 'walk');
      }
      if (done) {
        const g = ROUTE_PTS[ROUTE_PTS.length - 1];
        ctx.strokeStyle = OK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g[0], g[1] - 16, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = OK;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, W - 4, H - 4);
      }

      drawSheetLabel(ctx, measure ? '先测距' : '只留能带路', 24, 22, measure ? ROUTE : MUTED);
      if (done) drawSheetLabel(ctx, '走通', 470, 30, OK);
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

export default HeroNew;
