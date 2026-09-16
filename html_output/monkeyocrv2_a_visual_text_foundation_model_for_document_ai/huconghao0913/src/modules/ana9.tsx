import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawInkStroke, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana9: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.02; clearScene(ctx, W, H);
      drawPaper(ctx, 30, 20, 120, 100);
      // Original stroke
      drawInkStroke(ctx, [{x:50,y:50},{x:90,y:50},{x:130,y:60}], 5, COLORS.ink, 0.9);
      drawInkStroke(ctx, [{x:90,y:50},{x:90,y:100}], 5, COLORS.ink, 0.9);
      // Edge detection overlay (magnifying glass)
      const mx = 250 + Math.sin(t * 1.5) * 30;
      ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, 70, 35, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx + 25, 95); ctx.lineTo(mx + 45, 115); ctx.stroke();
      // Edge view inside magnifier
      ctx.save(); ctx.beginPath(); ctx.arc(mx, 70, 33, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#2d2d2a'; ctx.fillRect(mx - 35, 35, 70, 70);
      ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3;
      ctx.strokeRect(mx - 20, 50, 40, 3);
      ctx.strokeRect(mx - 5, 50, 3, 40);
      ctx.restore();
      ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
      ctx.fillText('Sobel 边缘检测 → 保留笔画轮廓', 320, 75);
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana9;
