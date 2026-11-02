import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawRoad,
  drawVehicle,
  drawSceneLabel,
  drawLegend,
  INK,
  MUTED,
  GUIDE,
  PAINT,
  AUX,
  EMPH,
  LINE,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 隐喻 6：老司机换一座城市照样敢开（左：换了城市），
// 但路上突然出现没见过的状况，就得靠临场发挥（右：新路况）。

const W = 560;
const H = 140;
const PERIOD = 3400;

function warning(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x - s, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 1, y - s * 0.68, 2, s * 0.36);
  ctx.beginPath();
  ctx.arc(x, y - s * 0.18, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // 左：熟悉的城市轮廓。
      ctx.fillStyle = MUTED;
      ctx.fillRect(24, 40, 34, 28);
      ctx.fillRect(66, 30, 26, 38);
      ctx.fillRect(100, 46, 40, 22);
      ctx.fillRect(148, 34, 30, 34);
      ctx.fillRect(186, 42, 42, 26);
      ctx.fillRect(236, 36, 20, 32);

      // 右：另一座城市，天际线完全不同。
      ctx.fillStyle = AUX;
      ctx.fillRect(300, 44, 30, 24);
      ctx.fillRect(338, 28, 36, 40);
      ctx.fillRect(382, 38, 24, 30);
      ctx.fillRect(414, 48, 40, 20);
      ctx.fillRect(462, 32, 28, 36);
      ctx.fillRect(498, 42, 22, 26);

      // 城市分界。
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(288, 14);
      ctx.lineTo(288, 130);
      ctx.stroke();
      ctx.setLineDash([]);

      drawRoad(ctx, 16, 76, 528, 46);

      drawSceneLabel(ctx, '换了城市', 16, 20, INK);
      drawSceneLabel(ctx, '没见过的路况', 296, 20, INK);

      // 新路况：一枚醒目的警示牌。
      warning(ctx, 486, 114, 9, EMPH);

      drawVehicle(ctx, lerp(44, 500, t), 116, 'sedan', 0.52, PAINT);

      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '熟悉' },
          { color: AUX, text: '新城市' },
          { color: EMPH, text: '新路况' },
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

export default Ana6;
