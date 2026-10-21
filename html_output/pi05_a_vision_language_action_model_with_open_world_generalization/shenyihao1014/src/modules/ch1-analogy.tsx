import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, lerp } from '../lib/canvasKit';
import { C, drawSceneBg, drawCrew, drawHome, drawLegend } from './movingKit';
import type { WidgetProps } from './registry';

// Ch.1 analogy — 陌生的大门: the crew member practiced 10,000 times in the
// training room, yet everything behind the unfamiliar door is unseen.
const W = 560;
const H = 140;
const LOOP = 4200;

export const Ch1Analogy: React.FC<WidgetProps> = () => {
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
      drawSceneBg(ctx, W, H);
      // training room (left) — spotless from endless practice
      drawHome(ctx, 24, 44, 120, 66, { familiar: true, tidy01: 0.95, label: '练习房' });
      // unfamiliar home (right) — different palette, cluttered
      drawHome(ctx, 392, 40, 140, 78, { familiar: false, tidy01: 0.1, label: '新家' });
      // crew walks from the training room to the new door, then shrugs
      const walk = easeInOutQuad(clamp(t / 0.42, 0, 1));
      const cx = lerp(170, 356, walk);
      const arrived = walk >= 1;
      drawCrew(ctx, cx, 102, 1.35, {
        mode: arrived ? 'shrug' : 'work',
        t: ms / 300,
        color: C.red,
      });
      if (arrived) {
        // "everything behind this door is unseen"
        const a = clamp((t - 0.46) / 0.12, 0, 1);
        ctx.save();
        ctx.globalAlpha = a * (0.7 + 0.3 * Math.abs(Math.sin((ms / 320) * Math.PI)));
        ctx.fillStyle = C.red;
        ctx.font = 'bold 22px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 356, 34);
        ctx.restore();
      }
      drawLegend(ctx, [['练过一万遍', C.green], ['门后全陌生', C.red]], 24, 18);
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

export default Ch1Analogy;
