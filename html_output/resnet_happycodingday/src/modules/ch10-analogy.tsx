import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawSceneLabel, drawTargetStamp } from './kit-p4';
import type { WidgetProps } from './registry';

// Ch10 analogy: two final manuscripts on the review desk, a review ruler sweeps across.
const W = 244;
const H = 130;

export const Ch10Analogy: React.FC<WidgetProps> = () => {
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
      clearScene(ctx, W, H);
      const t = ((now - t0) / 3400) % 1;
      drawPage(ctx, 70, 84, 100, 36, -0.04);
      drawPage(ctx, 176, 84, 100, 36, 0.04);
      // review ruler sweeping
      const rx = 30 + t * 185;
      ctx.fillStyle = C.pencil;
      ctx.fillRect(rx, 66, 6, 52);
      drawSceneLabel(ctx, '评审尺', rx + 2, 60, C.muted, 'center');
      if (t > 0.75) drawTargetStamp(ctx, 176, 66, 11);
      drawSceneLabel(ctx, '同台评比', W / 2, 16, C.blue, 'center');
    };
    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-ch10-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch10Analogy;
