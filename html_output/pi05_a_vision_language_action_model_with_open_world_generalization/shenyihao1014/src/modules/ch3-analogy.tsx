import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawNotebook, drawSceneLabel } from './movingKit';
import type { WidgetProps } from './registry';

// Ch.3 analogy — 五路功课: five notebooks light up one after another
// (MM/ME/CE/HL/WD), then a sixth sticky note "口令演练" (VI) is pasted on.
const W = 560;
const H = 140;
const LOOP = 4600;
const NOTES = ['MM', 'ME', 'CE', 'HL', 'WD'];

export const Ch3Analogy: React.FC<WidgetProps> = () => {
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
    let raf = 0;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false, grid: true });
      // five notebooks light up sequentially with a small pop
      for (let i = 0; i < NOTES.length; i++) {
        const lt = 0.08 + i * 0.105;
        const k = clamp((t - lt) / 0.12, 0, 1);
        const cx = 64 + i * 86;
        const pop = 1 + 0.16 * Math.sin(Math.min(1, k) * Math.PI);
        ctx.save();
        ctx.globalAlpha = 0.22 + 0.78 * k;
        drawNotebook(ctx, cx, 72, 1.1 * (k >= 1 ? 1 : pop), NOTES[i], { color: C.blue });
        ctx.restore();
      }
      // sixth sticky note: 出发前口令演练 (VI), pasted after all five
      const sk = clamp((t - 0.66) / 0.14, 0, 1);
      if (sk > 0) {
        const s = 1 + 0.4 * (1 - easeOutCubic(sk));
        ctx.save();
        ctx.globalAlpha = sk;
        ctx.translate(496, 66);
        ctx.scale(s, s);
        ctx.rotate(-0.08);
        ctx.fillStyle = C.orange;
        ctx.strokeStyle = C.deep;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-20, -20, 40, 40, 3);
        ctx.fill();
        ctx.stroke();
        // folded corner
        ctx.fillStyle = '#f8c99b';
        ctx.beginPath();
        ctx.moveTo(8, -20);
        ctx.lineTo(20, -20);
        ctx.lineTo(20, -8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VI', -2, 0);
        ctx.restore();
      }
      drawSceneLabel(ctx, '五路功课', 16, 18, { color: C.blue });
      drawSceneLabel(ctx, '口令演练', 496, 108, { color: C.orange, align: 'center' });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch3Analogy;
