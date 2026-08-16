import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const mapCard = (x: number, y: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 34, y - 20, 68, 40, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 26, y + 8);
      ctx.quadraticCurveTo(x - 10, y - 12, x + 8, y);
      ctx.quadraticCurveTo(x + 18, y + 6, x + 26, y - 6);
      ctx.stroke();
      ctx.restore();
    };

    const frame = (now: number) => {
      const t = ((now - t0) / 3200) % 1;
      K.clearScene(ctx, W, H);
      // desk
      ctx.fillStyle = 'rgba(146,64,14,0.12)';
      ctx.fillRect(20, 88, W - 40, 8);
      // two static maps
      mapCard(104, 66, K.C.guide, 0.9);
      mapCard(122, 72, K.C.depth, 0.9);
      // third map slides in and aligns
      const drop = easeOutCubic(Math.min(1, t * 1.6));
      const y = -30 + (66 - -30) * drop;
      mapCard(122, y, K.C.emph, t > 0.85 ? 1 - (t - 0.85) * 3 : 1);
      K.drawLabel(ctx, '叠加对齐', 12, 20, K.C.muted, 10);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ana2;
