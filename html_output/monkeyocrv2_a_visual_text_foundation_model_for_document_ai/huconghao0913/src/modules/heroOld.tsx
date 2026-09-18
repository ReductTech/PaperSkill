import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawBrush, drawInkStroke, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

export const HeroOld: React.FC<WidgetProps> = () => {
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
      // Big brush writing small chars -> blurry mess
      const bx = 200 + Math.sin(t * 1.5) * 30;
      drawBrush(ctx, bx, 70, -0.3 + Math.sin(t) * 0.1, 1.8);
      // Blurry ink strokes (wide, low alpha)
      drawInkStroke(ctx, [{x:180,y:90},{x:260,y:85},{x:340,y:92}], 18, COLORS.ink, 0.3);
      drawInkStroke(ctx, [{x:200,y:100},{x:280,y:105},{x:360,y:98}], 16, COLORS.ink, 0.25);
      // Red X mark
      ctx.strokeStyle = COLORS.red; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(400,40); ctx.lineTo(440,80); ctx.moveTo(440,40); ctx.lineTo(400,80); ctx.stroke();
      ctx.fillStyle = COLORS.red; ctx.font = '13px sans-serif';
      ctx.fillText('笔画糊成一团', 380, 105);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const d = observeCanvas(c, start, stop);
    return () => { stop(); d(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default HeroOld;
