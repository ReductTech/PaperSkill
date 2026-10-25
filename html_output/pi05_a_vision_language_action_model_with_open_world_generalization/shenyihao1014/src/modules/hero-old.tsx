import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawVerdict,
  drawLegend,
  drawSceneLabel,
} from './movingKit';
import type { WidgetProps } from './registry';

// Hero old-method panel: the in-lab specialist — flawless in the training
// room, helpless at the unfamiliar new-home door.
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
      // familiar training room (left): all checks green
      drawHome(ctx, 30, 60, 150, 110, { familiar: true, tidy01: 0.95, label: '训练环境' });
      for (let k = 0; k < 3; k++) {
        // small green checks above the room
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        const cx = 60 + k * 44;
        ctx.beginPath();
        ctx.moveTo(cx - 5, 150);
        ctx.lineTo(cx - 1, 155);
        ctx.lineTo(cx + 6, 146);
        ctx.stroke();
      }
      // unfamiliar new home (right): door with red cross
      drawHome(ctx, 320, 56, 160, 116, { familiar: false, tidy01: 0.15, label: '新家 = ?' });
      // red cross on its door
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(385, 130);
      ctx.lineTo(415, 165);
      ctx.moveTo(415, 130);
      ctx.lineTo(385, 165);
      ctx.stroke();
      // shrugging crew at the new door
      drawCrew(ctx, 288, 200, 1.5, { mode: 'shrug', t: ms / 300, color: C.red });
      drawSceneLabel(ctx, '练习房老手', 16, 22, { color: C.blue });
      drawSceneLabel(ctx, '只在训练环境评测 · 新家推不开', 16, 42, { color: C.muted });
      drawLegend(ctx, [['熟悉=满分', C.green], ['陌生=红叉', C.red]], 16, H - 16);
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
