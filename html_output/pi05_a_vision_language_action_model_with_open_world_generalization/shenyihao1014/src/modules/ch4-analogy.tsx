import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawCrew, drawWaveform, drawSceneLabel, drawLegend } from './movingKit';
import type { WidgetProps } from './registry';

// Ch.4 analogy — 速记与真功夫: first learn the routine by ticking a FAST
// checklist (purple tokens, quick), then put the list down and work with
// bare hands (flow matching, accurate).
const W = 560;
const H = 140;
const LOOP = 4400;

export const Ch4Analogy: React.FC<WidgetProps> = () => {
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
      const phaseA = t < 0.52;
      const k = phaseA ? t / 0.52 : (t - 0.52) / 0.48;
      const ease = easeOutCubic(clamp(k, 0, 1));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // panel highlights follow the active phase
      const hl = (x: number, on: boolean) => {
        ctx.save();
        ctx.globalAlpha = on ? 0.55 : 0.14;
        ctx.strokeStyle = on ? C.blue : C.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, 12, 262, 116, 10);
        ctx.stroke();
        ctx.restore();
      };
      hl(12, phaseA);
      hl(286, !phaseA);

      // LEFT: clipboard checklist + purple FAST tokens
      ctx.save();
      ctx.globalAlpha = phaseA ? 1 : 0.45;
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(36, 36, 118, 74, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.deep;
      ctx.beginPath();
      ctx.roundRect(79, 30, 32, 10, 4);
      ctx.fill();
      const litN = Math.max(0, Math.min(4, Math.floor(clamp(k / 0.85, 0, 1) * 4) + (k > 0 ? 1 : 0)));
      for (let r = 0; r < 4; r++) {
        const ry = 52 + r * 14;
        const on = phaseA && r < litN;
        ctx.strokeStyle = on ? C.purple : C.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(46, ry, 10, 10, 2);
        ctx.stroke();
        if (on) {
          ctx.beginPath();
          ctx.moveTo(48, ry + 5);
          ctx.lineTo(51, ry + 8);
          ctx.lineTo(55, ry + 2);
          ctx.stroke();
        }
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(62, ry + 8);
        ctx.lineTo(126, ry + 8);
        ctx.stroke();
        // purple token chip per ticked row
        ctx.fillStyle = r < litN && phaseA ? C.purple : 'rgba(124,58,237,0.15)';
        ctx.beginPath();
        ctx.roundRect(168, ry, 14, 10, 2);
        ctx.fill();
      }
      ctx.restore();

      // arrow between the panels
      ctx.save();
      ctx.globalAlpha = 0.4 + 0.6 * ease;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(272, 70);
      ctx.lineTo(292, 60);
      ctx.lineTo(292, 80);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // RIGHT: real skill — smooth flow waveform + working crew
      const wOn = !phaseA;
      ctx.save();
      ctx.globalAlpha = wOn ? 1 : 0.3;
      const pts: number[] = [];
      for (let i = 0; i < 44; i++) {
        pts.push(Math.sin(i * 0.3 + (ms / 400) * Math.PI * 2) * 0.5);
      }
      drawWaveform(ctx, 316, 34, 210, 28, pts, C.green, { dashed: !wOn });
      ctx.restore();
      const workerT = wOn ? ms / 280 : 0;
      ctx.save();
      ctx.globalAlpha = wOn ? 1 : 0.35;
      drawCrew(ctx, 404, 112, 1.35, { mode: 'work', t: workerT, color: C.green });
      ctx.restore();

      drawSceneLabel(ctx, '清单速记', 30, 22, { color: C.purple });
      drawSceneLabel(ctx, '真功夫', 316, 22, { color: C.green });
      drawLegend(ctx, [['FAST token', C.purple], ['流匹配', C.green]], 336, 131);
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

export default Ch4Analogy;
