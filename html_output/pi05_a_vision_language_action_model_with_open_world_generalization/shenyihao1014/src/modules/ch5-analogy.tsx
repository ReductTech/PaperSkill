import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawSpeechOut,
  drawSceneLabel,
  drawValueChip,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch5 analogy — 口令演练: the coach "works with his mouth only": each spoken
// command (remote-style) makes the room one notch tidier. 560x140 loop.
const W = 560;
const H = 140;
const LOOP = 5400;
const CMDS = ['先把毛巾捡起来', '好，放进篮子', '再擦擦桌子'];
const TIDY = [0.2, 0.55, 0.9];

export const Ch5Analogy: React.FC<WidgetProps> = () => {
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
      const ph = Math.max(0, Math.min(CMDS.length - 1, Math.floor(t * CMDS.length)));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // expert coach with megaphone (left), speaking toward the room
      drawCrew(ctx, 84, 104, 1.15, { mode: 'coach', t: ms / 400, color: C.blue });
      // speech signal arcs from the megaphone
      const wob = Math.sin((ms % 900) / 900 * Math.PI * 2);
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.55;
      for (let k = 0; k < 2; k++) {
        const r = 12 + k * 8 + wob * 2;
        ctx.beginPath();
        ctx.arc(118, 78, r, -0.7, 0.7);
        ctx.stroke();
      }
      ctx.restore();

      // the command bubble
      drawSpeechOut(ctx, 178, 32, CMDS[ph], { color: C.blue });

      // the room that tidies up one notch per command
      drawHome(ctx, 330, 26, 150, 84, { familiar: true, tidy01: TIDY[ph] });
      // robot crew doing the actual work (already knows how)
      drawCrew(ctx, 478, 104, 1.0, { mode: 'work', t: ms / 300, color: C.green });

      // progress chip (bare number)
      drawValueChip(ctx, 522, 24, `${ph + 1}/3`, C.blue);

      drawSceneLabel(ctx, '专家口令', 16, 22, { color: C.blue });
      drawSceneLabel(ctx, '越喊越整洁', 352, 126, { color: C.muted });

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

export default Ch5Analogy;
