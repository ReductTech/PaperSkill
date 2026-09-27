import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWorker,
  drawCabinet,
  drawVerdict,
  drawLegend,
  drawSceneLabel,
} from './flatKit';
import type { WidgetProps } from './registry';

// Hero old-method panel: the locked black-box boutique. A task card
// ("改装：加个书架") flies in, the worker shrugs, red verdict bounces it back.
const W = 520;
const H = 240;
const LOOP = 3200;

export const HeroOld: React.FC<WidgetProps> = () => {
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
      // locked cabinet
      drawCabinet(ctx, 400, 196, 1.5, { assembled: true });
      // padlock
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.fillStyle = C.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(400, 150, 8, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(389, 150, 22, 18, 3);
      ctx.fill();
      ctx.restore();
      // task card flies in from the left, bounces back on rejection
      const fly = clamp(t / 0.35, 0, 1);
      const reject = t > 0.45 ? clamp((t - 0.45) / 0.25, 0, 1) : 0;
      const cx = 60 + fly * (250 - 60) - reject * 130;
      ctx.save();
      ctx.translate(cx, 120);
      ctx.rotate(-0.04 + reject * 0.25);
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
      // shrugging worker
      drawWorker(ctx, 280, 196, 1.5, { mode: 'locked', t: ms / 300, color: C.red });
      // verdict
      if (reject > 0.5) drawVerdict(ctx, 280, 108, false, { r: 16, pulse: t * 2 });
      drawSceneLabel(ctx, '闭源黑箱店', 16, 22, { color: C.red });
      drawSceneLabel(ctx, '55B · 闭源 · 微调 ✗', 16, 42, { color: C.muted });
      drawLegend(ctx, [['不许下载', C.red], ['不许改造', C.red]], 16, H - 16);
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

export default HeroOld;
