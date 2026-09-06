import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const frame = (now: number) => {
      const t = ((now - t0) / 3200) % 1;
      K.clearScene(ctx, W, H);
      const open = easeOutCubic(Math.min(1, t * 1.8));
      // album
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.aux;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, 34, 100, 72, 4);
      ctx.fill();
      ctx.stroke();
      // flipping page
      ctx.save();
      ctx.translate(90, 34);
      ctx.scale(Math.max(0.08, Math.abs(1 - open * 2)), 1);
      ctx.fillStyle = open < 0.5 ? '#f3edff' : '#fff';
      ctx.strokeStyle = K.C.aux;
      ctx.beginPath();
      ctx.roundRect(-50, 0, 100, 72, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // photo on the revealed page
      if (open >= 0.5) {
        ctx.fillStyle = K.C.ground;
        ctx.fillRect(96, 44, 36, 26);
        K.drawHouse(ctx, 114, 66, 0.5, K.C.depth);
        ctx.strokeStyle = K.C.axis;
        ctx.strokeRect(96, 44, 36, 26);
      }
      // town silhouette lights up when the photo is found
      const lit = open >= 0.9;
      K.drawHouse(ctx, 190, 96, 0.9, lit ? K.C.good : K.C.muted);
      if (lit) {
        ctx.strokeStyle = K.C.good;
        ctx.lineWidth = 2;
        ctx.strokeRect(168, 62, 46, 38);
      }
      K.drawLabel(ctx, '翻相册找回旧街景', 12, 20, K.C.muted, 10);
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

export default Ana8;
