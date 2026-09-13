import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawInkStroke, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana2: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.015; clearScene(ctx, W, H);
      // Three different script styles
      const styles = ['楷书', '行书', '篆书'];
      styles.forEach((s, i) => {
        const x = 40 + i * 170;
        drawPaper(ctx, x, 25, 110, 90);
        ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
        ctx.fillText(s, x + 35, 115);
        const wobble = Math.sin(t + i) * 3;
        if (i === 0) { // regular
          drawInkStroke(ctx, [{x:x+30,y:45+wobble},{x:x+80,y:45+wobble}], 4, COLORS.ink, 0.8);
          drawInkStroke(ctx, [{x:x+55,y:45},{x:x+55,y:90}], 4, COLORS.ink, 0.8);
        } else if (i === 1) { // running
          drawInkStroke(ctx, [{x:x+25,y:50+wobble},{x:x+55,y:60},{x:x+85,y:50}], 3, COLORS.ink, 0.8);
          drawInkStroke(ctx, [{x:x+40,y:70},{x:x+70,y:85}], 3, COLORS.ink, 0.7);
        } else { // seal
          drawInkStroke(ctx, [{x:x+30,y:50},{x:x+80,y:50}], 5, COLORS.ink, 0.7);
          drawInkStroke(ctx, [{x:x+55,y:50},{x:x+55,y:90}], 5, COLORS.ink, 0.7);
          drawInkStroke(ctx, [{x:x+30,y:70},{x:x+80,y:70}], 5, COLORS.ink, 0.7);
        }
      });
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana2;
