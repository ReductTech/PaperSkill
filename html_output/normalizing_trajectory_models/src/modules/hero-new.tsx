import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawSceneBg, drawPhotoCard, drawLabel } from './ana-scene';
import { HeroVideo } from './hero-video';

const W = 320, H = 190, LOOP = 3.6;

/** Hero right: four NTM steps resolve a pixel grid in parallel slots, like ELF. */
export const HeroNew: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    let running = false;

    const draw = (t: number) => {
      drawSceneBg(ctx, W, H);
      const labels = ['t=1', 't=0.75', 't=0.5', 't=0.02'];
      const noises = [1.0, 0.62, 0.32, 0.04];
      const fw = 62, fh = 78, gap = 8, x0 = 18, y0 = 28;
      const p = easeInOutQuad(t);
      for (let i = 0; i < 4; i++) {
        const x = x0 + i * (fw + gap);
        const reveal = clamp((p - i * 0.18) / 0.28, 0, 1);
        const n = lerp(1, noises[i], reveal);
        drawPhotoCard(ctx, x, y0, fw, fh, n, 67 + i);
        ctx.strokeStyle = reveal > 0.85 ? K.blue : K.border;
        ctx.lineWidth = reveal > 0.85 ? 1.6 : 1;
        ctx.strokeRect(x, y0, fw, fh);
        drawLabel(ctx, labels[i], x + fw / 2, y0 + fh + 12, reveal > 0.85 ? K.blue : K.muted, 10, 'center');
      }
      const barY = H - 22;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(18, barY, W - 36, 4);
      ctx.fillStyle = K.blue;
      ctx.fillRect(18, barY, (W - 36) * p, 4);
      const tag = p < 0.25 ? '噪声' : p < 0.85 ? 'u 空间逐步还原…' : '清晰 · 精确似然 ✓';
      drawLabel(ctx, tag, 18, barY - 12, p > 0.85 ? K.blue : K.muted, 10);
    };

    const tick = () => {
      if (!running) return;
      draw((performance.now() / 1000 % LOOP) / LOOP);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => { if (!running) { running = true; rafRef.current = requestAnimationFrame(tick); } };
    const stop = () => { running = false; cancelAnimationFrame(rafRef.current); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <HeroVideo src="/videos/hero-new.mp4" label="NTM 4 步：像素格从噪声还原为清晰图像">
      <canvas ref={canvasRef} aria-label="NTM 4 步：像素格从噪声还原为清晰图像" />
    </HeroVideo>
  );
};
