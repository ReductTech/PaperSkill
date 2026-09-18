import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawBrush, drawInkStroke, drawTemplateChar, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana3: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.018; clearScene(ctx, W, H);
      drawPaper(ctx, 30, 15, 130, 110);
      drawTemplateChar(ctx, 45, 25, 100);
      const p = (t % 2.5) / 2.5;
      // Left: reading (semantic) - eye icon
      ctx.fillStyle = COLORS.blue; ctx.font = '20px sans-serif';
      ctx.fillText('👁', 200, 55);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
      ctx.fillText('认字(语义)', 185, 75);
      // Right: tracing (visual) - brush
      const bx = 60 + p * 50, by = 40 + p * 45;
      drawBrush(ctx, bx + 130, by, -0.2, 0.9);
      drawInkStroke(ctx, [{x:195,y:40},{x:225,y:40}], 4, COLORS.ink, 0.8);
      if (p > 0.3) drawInkStroke(ctx, [{x:210,y:40},{x:210,y:70}], 4, COLORS.ink, 0.8);
      ctx.fillStyle = COLORS.green; ctx.font = '11px sans-serif';
      ctx.fillText('描红(视觉)', 330, 75);
      // Plus sign
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 24px sans-serif';
      ctx.fillText('+', 290, 60);
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana3;
