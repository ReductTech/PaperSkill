import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWorker,
  drawBox,
  drawManual,
  drawRuler,
  drawCabinet,
  drawVerdict,
  drawLegend,
  drawSceneLabel,
} from './flatKit';
import type { WidgetProps } from './registry';

// Hero new-method panel: the open flat-pack store. The same task card arrives;
// the worker consults the open blueprint, applies a sticker, and an assembled
// cabinet with the new shelf pops out with a green verdict.
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
      // open flat-pack store props: box + manual + two rulers
      drawBox(ctx, 80, 196, 1.1);
      drawManual(ctx, 170, 176, 1.0);
      drawRuler(ctx, 210, 178, 44, { semantic: true });
      drawRuler(ctx, 210, 190, 44, {});
      // task card flies in and is accepted
      const fly = clamp(t / 0.35, 0, 1);
      const cx = 40 + fly * (230 - 40);
      ctx.save();
      ctx.translate(Math.min(cx, 230), 120);
      ctx.rotate(-0.04);
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-46, -20, 92, 40, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('改装：加个书架', 0, 0);
      ctx.restore();
      // worker reads then builds
      const building = t > 0.45;
      drawWorker(ctx, 300, 196, 1.5, { mode: building ? 'build' : 'read', t: ms / 300, color: C.green });
      // assembled cabinet with sticker shelf appears
      if (t > 0.65) {
        drawCabinet(ctx, 415, 196, 1.5, { assembled: true, sticker: true });
      }
      if (t > 0.8) drawVerdict(ctx, 300, 108, true, { r: 16, pulse: t * 2 });
      drawSceneLabel(ctx, '开源平板店', 16, 22, { color: C.green });
      drawSceneLabel(ctx, '7B · 970k 轨迹 · 全开源', 16, 42, { color: C.muted });
      drawLegend(ctx, [['图纸公开', C.green], ['换贴即改', C.orange]], 16, H - 16);
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
