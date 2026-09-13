import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawInkStroke, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 560, H = 140;
const LANGS = ['中', 'EN', '日', '한', 'ع', 'DE'];
export const Ana5: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.025; clearScene(ctx, W, H);
      const idx = Math.floor(t) % LANGS.length;
      // Stack of books
      for (let i = 0; i < 4; i++) {
        const y = 100 - i * 18;
        ctx.fillStyle = i === 3 ? COLORS.blue : '#c8d8e8';
        ctx.fillRect(60 + i * 5, y, 120, 14);
        ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif';
        ctx.fillText(LANGS[(idx + i) % LANGS.length], 110, y + 11);
      }
      // Floating language chips
      for (let i = 0; i < 6; i++) {
        const x = 250 + (i % 3) * 90;
        const y = 30 + Math.floor(i / 3) * 45 + Math.sin(t + i) * 5;
        ctx.fillStyle = COLORS.paper; ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1;
        ctx.fillRect(x, y, 70, 28); ctx.strokeRect(x, y, 70, 28);
        ctx.fillStyle = COLORS.ink; ctx.font = 'bold 13px sans-serif';
        ctx.fillText(LANGS[(idx + i) % LANGS.length], x + 25, y + 19);
      }
      ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
      ctx.fillText('17种语言 · 1.13亿样本', 250, 125);
      raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana5;
