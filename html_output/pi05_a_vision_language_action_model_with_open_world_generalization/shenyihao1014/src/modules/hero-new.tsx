import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawSpeechOut,
  drawNotebook,
  drawVerdict,
  drawLegend,
  drawSceneLabel,
} from './movingKit';
import type { WidgetProps } from './registry';

// Hero new-method panel: the co-trained crew enters the new home — coach calls
// subtasks, worker acts, tidiness rises; five study notebooks on the side.
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
      // new home becoming tidy
      const tidy = clamp(t / 0.7, 0, 1);
      drawHome(ctx, 170, 52, 200, 130, { familiar: false, tidy01: tidy, label: '新家' });
      // coach with megaphone + speech bubble cycling subtasks
      drawCrew(ctx, 140, 208, 1.5, { mode: 'coach', t: ms / 300, color: C.blue });
      const calls = ['捡起衬衫', '放进篮子', '擦桌面'];
      const call = calls[Math.floor((t * 3) % 3)];
      drawSpeechOut(ctx, 190, 168, call, { color: C.blue, w: 96 });
      // worker wiping inside
      drawCrew(ctx, 330, 196, 1.4, { mode: 'work', t: ms / 260, color: C.green });
      // five study notebooks along the bottom-left
      const tags = ['MM', 'ME', 'CE', 'HL', 'WD'];
      tags.forEach((tag, k) => {
        drawNotebook(ctx, 36 + k * 42, 208, 0.9, tag, { color: [C.blue, C.blue, C.blue, C.orange, C.purple][k] });
      });
      // verdict when tidy
      if (tidy >= 1) drawVerdict(ctx, 460, 84, true, { r: 15, pulse: t * 2 });
      drawSceneLabel(ctx, '共训保洁队', 16, 22, { color: C.green });
      drawSceneLabel(ctx, '5 路数据 · 新家 10-15 分钟', 16, 42, { color: C.muted });
      drawLegend(ctx, [['喊单', C.blue], ['动手', C.green]], 300, H - 16);
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
