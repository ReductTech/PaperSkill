import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawRoad,
  drawVehicle,
  drawDriver,
  drawLicense,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  BAD,
  PAINT,
  MUTED,
} from './drivingKit';
import type { WidgetProps } from './registry';

// Hero 旧法：一种车型一本驾照，各自从零练起，最后全部卡住（红叉）。自动循环 3.2s。

const W = 560;
const H = 200;

const ROWS = [44, 78, 112, 146];
const KINDS = ['sedan', 'van', 'truck', 'bus'];

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
      const t = ((now - t0) / 3200) % 1;
      clearScene(ctx, W, H);

      drawSceneLabel(ctx, '一车一证', 26, 26);

      for (let i = 0; i < ROWS.length; i++) {
        const rt = ROWS[i];
        drawRoad(ctx, 110, rt + 4, 434, 26, false);

        // 每台车配一本自己的驾照
        drawLicense(ctx, 26, rt + 2, 44, 22, GUIDE);

        // 各自的司机
        drawDriver(ctx, 88, rt + 28, 0.5, MUTED);

        const startAt = i * 0.08;
        const q = clamp((t - startAt) / 0.55, 0, 1);
        const vx = 200 + 46 * easeOutCubic(q);
        drawVehicle(ctx, vx, rt + 28, KINDS[i], 0.55, PAINT);

        // 从零开始，走一小段就停住
        const xa = clamp((t - (startAt + 0.55)) / 0.12, 0, 1);
        if (xa > 0) {
          ctx.save();
          ctx.globalAlpha = xa;
          ctx.strokeStyle = BAD;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(vx - 8, rt + 9);
          ctx.lineTo(vx + 8, rt + 25);
          ctx.moveTo(vx + 8, rt + 9);
          ctx.lineTo(vx - 8, rt + 25);
          ctx.stroke();
          ctx.restore();
        }
      }

      drawLegend(
        ctx,
        [
          { color: PAINT, text: '各自训练' },
          { color: BAD, text: '止步不前' },
        ],
        330,
        192
      );
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

export default HeroOld;
