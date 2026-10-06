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
  ROUTE,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
  CONTOUR,
} from './chartkit';
import type { WidgetProps } from './registry';

// ana7 — 边走边改地图。一个主体（旅人）沿路前进，摊开的地图与脚步同步加注、修正。
// 无控件、无反馈条；循环演示可交互性的直觉。

const W = 560;
const H = 140;
const DUR = 3000;

// 地图上的路线桩（图幅内绝对坐标）
const MAP_PTS: number[][] = [
  [42, 98],
  [72, 80],
  [104, 88],
  [136, 62],
  [168, 72],
  [196, 52],
];
// 每个桩出现的进度
const PIN_AT = [0, 0.34, 0.62, 1.0];
const PIN_IDX = [0, 2, 4, 5];

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

    const render = (elapsed: number): void => {
      const t = (elapsed % DUR) / DUR;
      const ease = easeOutCubic(t);

      clearField(ctx, W, H);

      // 摊开的地图
      drawSheet(ctx, 24, 26, 190, 92);
      drawContours(ctx, 24, 26, 190, 92, 5, CONTOUR, 3);

      // 图上路线：随旅人脚步逐段出现
      const segCount = MAP_PTS.length - 1;
      const grown = clamp(ease * segCount, 0, segCount);
      const full = Math.floor(grown);
      const frac = grown - full;
      const visible: number[][] = MAP_PTS.slice(0, full + 1);
      if (full < segCount) {
        const a = MAP_PTS[full];
        const b = MAP_PTS[full + 1];
        visible.push([lerp(a[0], b[0], frac), lerp(a[1], b[1], frac)]);
      }
      if (visible.length >= 2) drawRoute(ctx, visible, ROUTE, 2.5);

      // 桩与最近的墨迹修正
      for (let i = 0; i < PIN_AT.length; i++) {
        if (ease >= PIN_AT[i]) {
          const p = MAP_PTS[PIN_IDX[i]];
          drawPin(ctx, p[0], p[1], i === PIN_AT.length - 1 ? AUX : EMPH, i === PIN_AT.length - 1);
        }
      }
      // 修正最近一段：短促的抖动墨迹
      if (ease > 0.2 && ease < 0.98) {
        const m = Math.min(segCount, Math.floor(grown));
        const p = MAP_PTS[m];
        const wob = Math.sin(elapsed / 120) * 3;
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p[0] + 3, p[1] + 6 + wob);
        ctx.quadraticCurveTo(p[0] + 12, p[1] + 12 - wob, p[0] + 20, p[1] + 6);
        ctx.stroke();
      }

      // 旅人的路（虚线）
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(250, 118);
      ctx.lineTo(520, 118);
      ctx.stroke();
      ctx.restore();

      // 移动主体：旅人
      const tx = lerp(250, 520, ease);
      const ty = 116 - Math.sin(ease * Math.PI * 2) * 3;
      drawSurveyor(ctx, tx, ty, 0.85, INK, 'walk');

      drawSheetLabel(ctx, '边走边改', 24, 20, EMPH);
      drawSheetLabel(ctx, '地图', 226, 20, MUTED);
    };

    const tick = (): void => {
      render(performance.now() - t0);
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

export default Ana7;
