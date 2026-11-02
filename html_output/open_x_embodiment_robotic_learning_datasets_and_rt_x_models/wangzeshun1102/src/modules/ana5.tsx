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
  OK,
  BAD,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 隐喻 5：开过卡车的人第一次开面包车，换挡、车距、后视镜都比新手稳。
// 左车走得平顺，右车一路画龙——经验没有白学。

const W = 560;
const H = 140;
const PERIOD = 3200;

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      drawRoad(ctx, 16, 72, 248, 46);
      drawRoad(ctx, 296, 72, 248, 46);

      drawSceneLabel(ctx, '开过卡车', 16, 28, INK);
      drawSceneLabel(ctx, '只开过面包车', 296, 28, INK);

      // 左：三张旧准驾记录，说明底子厚。
      drawLicense(ctx, 16, 40, 32, 18, GUIDE);
      drawLicense(ctx, 54, 40, 32, 18, GUIDE);
      drawLicense(ctx, 92, 40, 32, 18, GUIDE);
      // 右：只有一张。
      drawLicense(ctx, 296, 40, 32, 18, BAD);

      const p = easeInOutQuad(t);
      // 左车平顺直行。
      drawVehicle(ctx, lerp(52, 232, p), 112 + Math.sin(t * Math.PI * 6) * 1.2, 'van', 0.5, OK);
      // 右车一路画龙。
      const wobble = Math.sin(t * Math.PI * 2 * 5) * 4;
      drawVehicle(ctx, lerp(332, 512, p), 112 + wobble, 'van', 0.5, BAD);

      drawLegend(
        ctx,
        [
          { color: OK, text: '走得稳' },
          { color: BAD, text: '走得晃' },
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

export default Ana5;
