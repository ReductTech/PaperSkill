import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      // journal page
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(46, 26, 152, 88, 5);
      ctx.fill();
      ctx.stroke();
      // stamped pattern appears after press
      const pressed = t > 0.35 && t < 0.92;
      if (pressed) {
        const a = Math.min(1, (t - 0.35) * 4);
        ctx.save();
        ctx.globalAlpha = a;
        // snowflake
        ctx.strokeStyle = K.C.guide;
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 3; k++) {
          const ang = (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(84 - Math.cos(ang) * 10, 56 - Math.sin(ang) * 10);
          ctx.lineTo(84 + Math.cos(ang) * 10, 56 + Math.sin(ang) * 10);
          ctx.stroke();
        }
        // pedestrian
        ctx.strokeStyle = K.C.emph;
        ctx.beginPath();
        ctx.arc(128, 50, 4, 0, Math.PI * 2);
        ctx.moveTo(128, 54);
        ctx.lineTo(128, 68);
        ctx.moveTo(128, 68);
        ctx.lineTo(122, 78);
        ctx.moveTo(128, 68);
        ctx.lineTo(134, 78);
        ctx.stroke();
        // lamp
        ctx.strokeStyle = K.C.good;
        ctx.beginPath();
        ctx.moveTo(168, 82);
        ctx.lineTo(168, 52);
        ctx.stroke();
        ctx.fillStyle = K.C.good;
        ctx.beginPath();
        ctx.arc(168, 48, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // stamp press
      const pressT = t < 0.35 ? easeOutCubic(t / 0.35) : t < 0.55 ? 1 : Math.max(0, 1 - (t - 0.55) * 3);
      const sy = 8 + pressT * 26;
      ctx.fillStyle = K.C.road;
      ctx.beginPath();
      ctx.roundRect(112, sy, 20, 22, 3);
      ctx.fill();
      ctx.fillStyle = K.C.ink;
      ctx.fillRect(117, sy - 8, 10, 10);
      K.drawLabel(ctx, '盖章组合事件', 12, 18, K.C.muted, 10);
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

export default Ana5;
