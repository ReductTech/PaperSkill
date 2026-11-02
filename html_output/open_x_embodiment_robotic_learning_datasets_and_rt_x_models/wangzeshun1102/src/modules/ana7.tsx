import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawRoad,
  drawVehicle,
  drawDriver,
  drawLicense,
  drawGauge,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  BAD,
  PAINT,
  MUTED,
  INK,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 隐喻 7：小车驾照开不了大巴。不是路不熟，是本不够。
// 已有容量（驾照等级）够不上大巴的需求容量，车原地抖动后亮红叉。自动循环 3.2s。

const W = 560;
const H = 140;

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
      const t = ((now - t0) / 3200) % 1;
      clearScene(ctx, W, H);

      ctx.save();
      ctx.globalAlpha = 1 - clamp((t - 0.94) / 0.06, 0, 1);

      drawRoad(ctx, 20, 88, 520, 44);

      // 驾照从左侧滑入
      const inT = easeOutCubic(clamp(t / 0.3, 0, 1));
      const licX = -84 + 108 * inT;
      drawLicense(ctx, licX, 18, 62, 38, GUIDE);

      ctx.save();
      ctx.globalAlpha *= clamp((t - 0.08) / 0.18, 0, 1);
      drawSceneLabel(ctx, '小车驾照', 94, 42, INK);
      ctx.restore();

      // 两条容量条
      const avail = 0.35 * clamp(t / 0.24, 0, 1);
      const need = 0.85 * clamp((t - 0.12) / 0.24, 0, 1);
      drawGauge(ctx, 300, 20, 220, 10, avail, GUIDE);
      drawGauge(ctx, 300, 44, 220, 10, need, BAD);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '已有容量' },
          { color: BAD, text: '需要容量' },
        ],
        180,
        78
      );

      // 司机走向大巴
      const walk = clamp((t - 0.28) / 0.3, 0, 1);
      const dx = 62 + 250 * easeOutCubic(walk);
      drawDriver(ctx, dx, 132, 0.9, MUTED);

      // 大巴原地抖动
      const shakeT = clamp((t - 0.58) / 0.24, 0, 1);
      const bx = 400 + (shakeT > 0 && shakeT < 1 ? Math.sin((t - 0.58) * 95) * 2.4 : 0);
      drawVehicle(ctx, bx, 130, 'bus', 0.9, PAINT);

      ctx.save();
      ctx.globalAlpha *= clamp((t - 0.2) / 0.2, 0, 1);
      drawSceneLabel(ctx, '大巴', bx + 30, 74, INK);
      ctx.restore();

      // 红叉：车开不动
      const xa = clamp((t - 0.68) / 0.12, 0, 1);
      if (xa > 0) {
        ctx.save();
        ctx.globalAlpha *= xa;
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - 15, 98);
        ctx.lineTo(bx + 15, 126);
        ctx.moveTo(bx + 15, 98);
        ctx.lineTo(bx - 15, 126);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      render(now);
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

export default Ana7;
