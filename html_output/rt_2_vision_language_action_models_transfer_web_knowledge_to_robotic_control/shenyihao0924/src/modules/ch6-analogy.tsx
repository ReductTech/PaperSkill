import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawChef,
  drawStove,
  drawArm,
  drawTokenChip,
  drawSceneLabel,
  drawLegend,
} from './chefKit';
import type { WidgetProps } from './registry';

// Ch6 analogy (560x140, auto-loop 3s): the chef stands in a phone booth on the
// left (the cloud), command tokens fly along the phone line to the stove, and
// the robot arm advances one notch per beat. A metronome keeps ~2.5 beats/s,
// inside the paper's 1-3 Hz band for the 55B model.
const W = 560;
const H = 140;
const LOOP = 3000;
const LX0 = 108;
const LX1 = 396;
const LY = 80;
const BEAT = 400; // ms per beat -> 2.5 Hz, within 1-3 Hz
const TOKENS = ['1', '128', '91'];

export const Ch6Analogy: React.FC<WidgetProps> = () => {
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
      // phone booth with the chef inside (the remote cloud brain)
      ctx.fillStyle = '#eef3fa';
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(24, 30, 80, 90, 8);
      ctx.fill();
      ctx.stroke();
      drawChef(ctx, 64, 114, 0.85, { mode: 'cook', t: ms / 500 });
      // handset beside the head, with a short cord
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(72, 84);
      ctx.lineTo(84, 84);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.roundRect(84, 77, 9, 15, 2);
      ctx.fill();
      // the phone line (dashed, sagging)
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(LX0, LY);
      ctx.quadraticCurveTo((LX0 + LX1) / 2, LY + 32, LX1, LY);
      ctx.stroke();
      ctx.setLineDash([]);
      // command tokens flying along the line, one per beat
      for (let i = 0; i < 3; i++) {
        const p = (t * 3 + i / 3) % 1;
        const x = LX0 + p * (LX1 - LX0);
        const y = LY + Math.sin(p * Math.PI) * 16;
        ctx.globalAlpha = 0.35 + 0.65 * Math.sin(p * Math.PI);
        drawTokenChip(ctx, x, y, TOKENS[i]);
      }
      ctx.globalAlpha = 1;
      // stove + arm on the right: the arm ticks one notch per beat
      drawStove(ctx, 436, 122, 0.8);
      const beat = Math.floor(ms / BEAT);
      const angle = 0.12 + (beat % 3) * 0.2;
      drawArm(ctx, 496, 126, { scale: 1.1, angle, grip: beat % 2 === 0 ? 1 : 0.45 });
      // metronome keeping the beat
      ctx.fillStyle = '#f9e9df';
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(258, 36);
      ctx.lineTo(278, 36);
      ctx.lineTo(274, 62);
      ctx.lineTo(262, 62);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const swing = Math.sin((ms / 1000) * Math.PI * 2 * 2.5) * 0.5;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(268, 62);
      ctx.lineTo(268 + Math.sin(swing) * 24, 62 - Math.cos(swing) * 24);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(268 + Math.sin(swing) * 24, 62 - Math.cos(swing) * 24, 2.5, 0, Math.PI * 2);
      ctx.fill();
      drawSceneLabel(ctx, '云端大厨', 24, 20);
      drawLegend(ctx, [['口令 1-3 拍/秒', C.purple], ['节拍器', C.orange]], 150, H - 10);
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

export default Ch6Analogy;
