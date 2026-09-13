import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
export const Ana10: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.025; clearScene(ctx, W, H);
      // Race track
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = 25 + i * 28;
        ctx.beginPath(); ctx.moveTo(30, y + 14); ctx.lineTo(500, y + 14); ctx.stroke();
      }
      const runners = [
        { name: 'MonkeyOCRv2', color: COLORS.green, speed: 0.95 },
        { name: 'CLIP', color: COLORS.red, speed: 0.4 },
        { name: 'DINO', color: COLORS.red, speed: 0.35 },
        { name: 'SAM', color: COLORS.orange, speed: 0.5 },
      ];
      runners.forEach((r, i) => {
        const y = 25 + i * 28;
        const x = 30 + ((t * r.speed * 60) % 470);
        ctx.fillStyle = r.color;
        ctx.beginPath(); ctx.arc(x, y + 14, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.ink; ctx.font = '10px sans-serif';
        ctx.fillText(r.name, x + 12, y + 18);
      });
      // Finish line
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(500, 20); ctx.lineTo(500, 130); ctx.stroke();
      ctx.fillStyle = COLORS.green; ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🏆', 505, 35);
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana10;
