import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawRoad,
  drawVehicle,
  drawLicense,
  drawSceneLabel,
  drawLegend,
  INK,
  GUIDE,
  PAINT,
  AUX,
  EMPH,
  LINE,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 隐喻 4：两种驾照班。左边从第一天就只练驾驶（专为机器人设计的架构），
// 右边先修完通识再补驾驶（VLM 骨干 + 动作 token）。两辆车在同一节拍里跑完各自的路。

const W = 560;
const H = 140;
const PERIOD = 3000;

function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
}

function books(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const cols = [AUX, '#a78bfa', '#c4b5fd'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = cols[i];
    ctx.fillRect(x, y + i * 7, 30 - i * 3, 5);
  }
}

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    let raf: number | null = null;

    const render = (now: number) => {
      const t = ((now - t0) % PERIOD) / PERIOD;
      clearScene(ctx, W, H);

      drawRoad(ctx, 16, 74, 248, 44);
      drawRoad(ctx, 296, 74, 248, 44);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(280, 12);
      ctx.lineTo(280, 128);
      ctx.stroke();
      ctx.setLineDash([]);

      drawSceneLabel(ctx, '专修驾驶', 16, 30, INK);
      drawSceneLabel(ctx, '通识加驾驶', 296, 30, INK);

      // 左：方向盘 + 一张结业证。
      wheel(ctx, 42, 56, 12, GUIDE);
      drawLicense(ctx, 196, 40, 48, 26, GUIDE);

      // 右：一摞通识书 + 方向盘 + 两张证。
      books(ctx, 314, 42);
      wheel(ctx, 376, 56, 11, AUX);
      drawLicense(ctx, 470, 36, 44, 22, AUX);
      drawLicense(ctx, 470, 60, 44, 22, AUX);

      const p1 = easeInOutQuad(t);
      const p2 = easeInOutQuad((t + 0.12) % 1);
      drawVehicle(ctx, lerp(52, 232, p1), 112, 'sedan', 0.5, PAINT);
      drawVehicle(ctx, lerp(332, 512, p2), 112, 'sedan', 0.5, GUIDE);

      drawLegend(
        ctx,
        [
          { color: EMPH, text: '驾驶课程' },
          { color: AUX, text: '通识基础' },
        ],
        16,
        136
      );
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
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

export default Ana4;
