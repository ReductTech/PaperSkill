import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPotter,
  drawWheel,
  drawClay,
  drawChunkStrip,
  drawVerdict,
  drawLegend,
  drawSceneLabel,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Hero new-method panel: the pottery wheel. The same order arrives; clay
// shapes into a slender vase on the spinning wheel while the eye-potter
// watches; a 50-step chunk strip streams below; green verdict at the end.
const W = 520;
const H = 240;
const LOOP = 3200;

export const HeroNew: React.FC<WidgetProps> = () => {
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
      // order card slides in and is accepted
      const fly = clamp(t / 0.3, 0, 1);
      const cx = 40 + fly * 150;
      ctx.save();
      ctx.translate(Math.min(cx, 190), 88);
      ctx.rotate(-0.04);
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-52, -22, 104, 44, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('订单：细颈花瓶', 0, 0);
      ctx.restore();
      // wheel + shaping clay
      drawWheel(ctx, 330, 196, 92, { spin: (ms / 240) % (Math.PI * 2) });
      const shape = clamp((t - 0.25) / 0.55, 0, 1);
      drawClay(ctx, 330, 186, shape, { size: 1.5, t: ms / 500 });
      // shaping potter + eye potter
      drawPotter(ctx, 258, 208, 1.4, { mode: 'shape', t: ms / 300, color: C.green });
      drawPotter(ctx, 120, 208, 1.4, { mode: 'eye', t: ms / 400, color: C.blue });
      // chunk strip streams once shaped
      if (shape > 0.5) drawChunkStrip(ctx, 250, 226, 190, 25, { highlightTo: Math.round(25 * clamp((shape - 0.5) / 0.5, 0, 1)) });
      if (shape >= 1) drawVerdict(ctx, 440, 84, true, { r: 15, pulse: t * 2 });
      drawSceneLabel(ctx, '转盘流式工位', 16, 22, { color: C.green });
      drawSceneLabel(ctx, '流匹配 · H=50 · 50Hz', 16, 42, { color: C.muted });
      drawLegend(ctx, [['掌眼 3B', C.blue], ['巧手 300M', C.purple]], 16, H - 16);
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

export default HeroNew;
