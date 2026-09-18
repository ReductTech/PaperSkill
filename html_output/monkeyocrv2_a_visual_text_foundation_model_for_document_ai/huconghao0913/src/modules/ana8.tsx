import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawBrush, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana8: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.02; clearScene(ctx, W, H);
      const sizes = [
        { name: '小楷', s: 0.7, params: '28M' },
        { name: '中楷', s: 1.1, params: '113M' },
        { name: '大楷', s: 1.5, params: 'ViTAEv2' },
      ];
      sizes.forEach((b, i) => {
        const x = 60 + i * 160;
        const y = 70 + Math.sin(t + i) * 5;
        drawBrush(ctx, x, y, -0.2, b.s);
        ctx.fillStyle = COLORS.ink; ctx.font = '12px sans-serif';
        ctx.fillText(b.name, x - 12, 115);
        ctx.fillStyle = COLORS.inkLight; ctx.font = '10px sans-serif';
        ctx.fillText(b.params, x - 15, 130);
      });
      ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
      ctx.fillText('不同大小的毛笔 → 适配不同分辨率', 60, 25);
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana8;
