import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawBrush, drawInkStroke, drawTemplateChar, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

export const HeroNew: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0; let t = 0;
    const tick = () => {
      t += 0.016;
      clearScene(ctx, W, H);
      drawPaper(ctx, 20, 15, 120, 110);
      drawTemplateChar(ctx, 30, 25, 100);
      // Precise brush tracing the template
      const prog = (t % 3) / 3;
      const bx = 50 + prog * 60;
      const by = 40 + prog * 50;
      drawBrush(ctx, bx, by, -0.2, 1.0);
      // Sharp ink strokes
      drawInkStroke(ctx, [{x:50,y:40},{x:80,y:40},{x:110,y:40}], 5, COLORS.ink, 0.9);
      if (prog > 0.3) drawInkStroke(ctx, [{x:80,y:40},{x:80,y:75},{x:75,y:85}], 5, COLORS.ink, 0.9);
      if (prog > 0.6) drawInkStroke(ctx, [{x:80,y:55},{x:55,y:85}], 4, COLORS.ink, 0.9);
      if (prog > 0.8) drawInkStroke(ctx, [{x:80,y:55},{x:105,y:85}], 4, COLORS.ink, 0.9);
      // Green check
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(400,60); ctx.lineTo(415,75); ctx.lineTo(445,45); ctx.stroke();
      ctx.fillStyle = COLORS.green; ctx.font = '13px sans-serif';
      ctx.fillText('笔画精准还原', 380, 105);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const d = observeCanvas(c, start, stop);
    return () => { stop(); d(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default HeroNew;
