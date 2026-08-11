import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawSceneLabel, drawTargetStamp } from './kit-p4';
import type { WidgetProps } from './registry';

// Ch9 analogy: ticking items off a delivery checklist — green checks appear one by one.
const W = 244;
const H = 130;

export const Ch9Analogy: React.FC<WidgetProps> = () => {
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
      const done = Math.floor(t * 4);
      drawPage(ctx, W / 2, 68, 200, 58, 0);
      const items = ['字号', '页码', '装订', '复核'];
      items.forEach((it, i) => {
        const y = 66 + i * 14;
        ctx.fillStyle = C.ink;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(it, W / 2 - 80, y + 6);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(W / 2 + 52, y + 2, 12, 12);
        if (i < done) drawTargetStamp(ctx, W / 2 + 58, y + 8, 7);
      });
      drawSceneLabel(ctx, '交付前复核', 16, 18, C.blue);
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

  return <canvas id="cv-ch9-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch9Analogy;
