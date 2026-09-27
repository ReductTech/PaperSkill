import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWorker,
  drawCabinet,
  drawStickerSheet,
  drawCheckMark,
  drawCrossMark,
  drawSceneLabel,
} from './flatKit';

// Ch7 analogy — 换门贴 (LoRA): LEFT keeps the finished cabinet and just applies
// fresh door stickers (fast, green); RIGHT keeps disassembling and re-assembling
// the whole cabinet (slow, never finishes, red). 560x140 self-loop, canvas only.
const W = 560;
const H = 140;
const LOOP = 4600;

export const Ch7Analogy: React.FC = () => {
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

      // divider between the two approaches
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(280, 12);
      ctx.lineTo(280, H - 12);
      ctx.stroke();

      // ---- LEFT: 换门贴 — cabinet stays, stickers pop on ----
      drawSceneLabel(ctx, '换门贴', 16, 22, { color: C.green });
      drawStickerSheet(ctx, 14, 88, 4);
      drawCabinet(ctx, 96, 118, 1.05, { assembled: true });
      for (let k = 0; k < 2; k++) {
        const p = clamp((t - 0.16 - k * 0.16) / 0.1, 0, 1);
        if (p > 0) {
          const e = easeOutCubic(p);
          const size = 11 * e + 1;
          ctx.fillStyle = C.orange;
          ctx.strokeStyle = C.white;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.roundRect(76 + (1 - e) * 8, 68 + k * 12, size, size * 0.85, 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      drawWorker(ctx, 168, 118, 1.15, { mode: 'build', t: ms / 300, color: C.green });
      if (t > 0.55) drawCheckMark(ctx, 200, 58, 10);

      // ---- RIGHT: 拆柜重装 — whole cabinet torn down and re-stacked ----
      drawSceneLabel(ctx, '拆柜重装', 300, 22, { color: C.red });
      // progress ring that never completes within the loop
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(340, 92, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = C.red;
      ctx.beginPath();
      ctx.arc(340, 92, 11, -Math.PI / 2, -Math.PI / 2 + t * 0.92 * Math.PI * 2);
      ctx.stroke();
      // wobbling flat panels, endlessly re-stacked
      ctx.save();
      ctx.translate(392, 118);
      ctx.rotate(Math.sin(ms / 130) * 0.045);
      drawCabinet(ctx, 0, 0, 1.05, { assembled: false });
      ctx.restore();
      drawWorker(ctx, 476, 118, 1.15, { mode: 'build', t: ms / 90, color: C.red });
      if (t > 0.78) drawCrossMark(ctx, 508, 58, 10);

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

export default Ch7Analogy;
