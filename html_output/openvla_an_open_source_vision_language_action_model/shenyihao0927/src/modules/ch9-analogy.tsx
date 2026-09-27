import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWorker,
  drawCheckMark,
  drawSceneLabel,
  drawLegend,
} from './flatKit';
import type { WidgetProps } from './registry';

// §9 analogy — 三家门店比装修: three storefronts on one street; each
// scoreboard lights its pips row by row, then every board earns a green
// check while the inspector (worker) walks down the street. Gentle loop.
const W = 560;
const H = 140;
const LOOP = 4800;
const SHOP_X = [128, 280, 432];

export const Ch9Analogy: React.FC<WidgetProps> = () => {
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

    const shop = (x: number, y: number) => {
      // facade
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 40, y - 46, 80, 46, 3);
      ctx.fill();
      ctx.stroke();
      // door + window
      ctx.fillStyle = '#e8eef5';
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 12, y - 30, 24, 30, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(x - 33, y - 27, 14, 13, 2);
      ctx.fill();
      ctx.stroke();
      // striped awning
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 === 0 ? C.green : C.white;
        ctx.fillRect(x - 40 + i * 16, y - 55, 16, 9);
      }
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 40, y - 55, 80, 9);
    };

    const scoreBoard = (x: number, y: number, lit: number, check: number) => {
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 40, y - 14, 80, 28, 6);
      ctx.fill();
      ctx.stroke();
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = j < lit ? C.orange : '#e3e8f0';
        ctx.beginPath();
        ctx.arc(x - 22 + j * 18, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (check > 0) {
        ctx.save();
        ctx.globalAlpha = clamp(check, 0, 1);
        const pop = 1 + 0.35 * (1 - clamp(check, 0, 1));
        drawCheckMark(ctx, x + 32, y, 7 * pop);
        ctx.restore();
      }
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // three branch shops on the same street
      SHOP_X.forEach((x) => shop(x, 106));
      // score pips light row by row, then checks pop in
      SHOP_X.forEach((x, i) => {
        let lit = 0;
        for (let j = 0; j < 3; j++) {
          if (t > 0.1 + (i * 3 + j) * 0.06) lit = j + 1;
        }
        const check = clamp((t - 0.68) / 0.12, 0, 1);
        scoreBoard(x, 40, lit, check);
      });
      // inspector walks the street while scoring
      const wx = lerp(52, 508, clamp(t / 0.62, 0, 1));
      drawWorker(ctx, wx, 106, 1.1, { mode: 'read', t: ms / 400 });
      drawSceneLabel(ctx, '同一条商业街', 14, 20);
      drawLegend(ctx, [['分店评分', C.orange]], 14, H - 14);
      // gentle fade before the loop restarts
      if (t > 0.93) {
        ctx.fillStyle = C.bg;
        ctx.globalAlpha = (t - 0.93) / 0.07;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
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

export default Ch9Analogy;
