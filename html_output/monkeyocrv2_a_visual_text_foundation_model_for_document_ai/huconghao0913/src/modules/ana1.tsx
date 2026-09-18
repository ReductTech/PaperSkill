import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawBrush, drawInkStroke, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.02; clearScene(ctx, W, H);
      drawPaper(ctx, 30, 20, 100, 100);
      const bx = 180 + Math.sin(t * 2) * 25;
      drawBrush(ctx, bx, 70, -0.3, 2.0);
      drawInkStroke(ctx, [{x:160,y:85},{x:250,y:80},{x:340,y:88}], 20, COLORS.ink, 0.25);
      ctx.fillStyle = COLORS.red; ctx.font = '12px sans-serif';
      ctx.fillText('大笔写小字 → 笔画模糊', 360, 75);
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana1;
