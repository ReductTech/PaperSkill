import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawSceneBg, drawPhotoCard, drawLabel } from './ana-scene';
import { HeroVideo } from './hero-video';

const W = 320, H = 190, LOOP = 3.6;

/** Hero left: four large Gaussian steps — tokens stay noisy, like ELF's serial GPT. */
export const HeroOld: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    let running = false;

    const draw = (t: number) => {
      drawSceneBg(ctx, W, H);
      const labels = ['t=1', 't=0.75', 't=0.5', 't=0.25'];
      const fw = 62, fh = 78, gap = 8, x0 = 18, y0 = 28;
      const step = Math.min(4, Math.floor(t * 4) + 1);
      for (let i = 0; i < 4; i++) {
        const x = x0 + i * (fw + gap);
        const done = i < step;
        drawPhotoCard(ctx, x, y0, fw, fh, done ? 0.72 : 0.92, 61 + i);
        ctx.strokeStyle = done ? K.red : K.border;
        ctx.lineWidth = done ? 1.6 : 1;
        ctx.setLineDash(done ? [] : [3, 3]);
        ctx.strokeRect(x, y0, fw, fh);
        ctx.setLineDash([]);
        drawLabel(ctx, labels[i], x + fw / 2, y0 + fh + 12, done ? K.red : K.muted, 10, 'center');
      }
      // time axis — same grammar as the ELF example
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(18, H - 22);
      ctx.lineTo(W - 18, H - 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 18, H - 22);
      ctx.lineTo(W - 24, H - 25);
      ctx.lineTo(W - 24, H - 19);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      drawLabel(ctx, '4 大步 →  每步仍是单高斯，只能给出模糊平均', 18, H - 34, K.muted, 10);
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
    <HeroVideo src="/videos/hero-old.mp4" label="传统扩散压缩到 4 步：每步单高斯，图像保持模糊">
      <canvas ref={canvasRef} aria-label="传统扩散压缩到 4 步：每步单高斯，图像保持模糊" />
    </HeroVideo>
  );
};
