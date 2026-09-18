import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawInkStroke, COLORS, drawBar } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana4: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.02; clearScene(ctx, W, H);
      drawPaper(ctx, 25, 20, 100, 100);
      drawInkStroke(ctx, [{x:45,y:45},{x:105,y:45}], 4, COLORS.ink, 0.8);
      drawInkStroke(ctx, [{x:75,y:45},{x:75,y:100}], 4, COLORS.ink, 0.8);
      // Two score bars
      const v1 = 0.6 + Math.sin(t) * 0.2;
      const v2 = 0.75 + Math.sin(t + 1) * 0.15;
      drawBar(ctx, 180, 30, 40, 80, v1 * 80, 80, COLORS.blue);
      drawBar(ctx, 250, 30, 40, 80, v2 * 80, 80, COLORS.green);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
      ctx.fillText('内容分', 182, 125); ctx.fillText('形似分', 252, 125);
      ctx.fillStyle = COLORS.ink; ctx.font = '12px sans-serif';
      ctx.fillText('双评分练字', 340, 75);
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana4;
