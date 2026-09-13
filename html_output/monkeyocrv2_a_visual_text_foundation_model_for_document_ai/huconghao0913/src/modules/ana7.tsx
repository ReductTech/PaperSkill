import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, COLORS, drawBar, drawSubText } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana7: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.03; clearScene(ctx, W, H);
      const phase = Math.floor(t) % 2;
      // Two alternating practice modes
      ctx.fillStyle = phase === 0 ? COLORS.blue : COLORS.green;
      ctx.font = 'bold 14px sans-serif';
      drawSubText(ctx, phase === 0 ? '认字练习 (L_text)' : '描红练习 (L_rec)', 40, 35, 14, phase === 0 ? COLORS.blue : COLORS.green, 'sans-serif');
      // Loss curves
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1;
      ctx.strokeRect(40, 45, 480, 75);
      // Text loss curve (blue)
      ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = 40 + i * 4.8;
        const y = 110 - (1 - Math.exp(-i * 0.04)) * 55 + Math.sin(i * 0.3 + t) * 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Reconstruction loss curve (green)
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = 40 + i * 4.8;
        const y = 115 - (1 - Math.exp(-i * 0.03)) * 45 + Math.sin(i * 0.25 + t + 1) * 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      drawSubText(ctx, 'L_text', 450, 65, 10, COLORS.blue, 'sans-serif');
      drawSubText(ctx, 'L_rec', 450, 85, 10, COLORS.green, 'sans-serif');
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana7;
