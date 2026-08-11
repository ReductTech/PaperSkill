import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawMark, drawSceneLabel } from './kit-p2';
import type { WidgetProps } from './registry';

// Ch5 analogy: three margin-mark styles cycle — padding caret / ruler underline / full rewrite circle.
const W = 244;
const H = 130;

const KINDS: { kind: 'caret' | 'under' | 'circle'; label: string }[] = [
  { kind: 'caret', label: '补空' },
  { kind: 'under', label: '对齐' },
  { kind: 'circle', label: '重写' },
];

export const Ch5Analogy: React.FC<WidgetProps> = () => {
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
      const t = ((now - t0) / 3600) % 1;
      const idx = Math.floor(t * 3);
      const cur = KINDS[idx];
      drawPage(ctx, W / 2, 70, 190, 46, 0);
      drawTextLines(ctx, W / 2 - 82, 66, 164, 1, 1, C.ink);
      drawMark(ctx, W / 2 - 50 + idx * 10, 92, cur.kind, C.red, 22);
      drawSceneLabel(ctx, cur.label, W / 2, 20, C.blue, 'center');
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

  return <canvas id="cv-ch5-analogy" ref={canvasRef} width={W} height={H} />;
};

export default Ch5Analogy;
