import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel } from './flatKit';
import type { WidgetProps } from './registry';

// §10 analogy — 开箱验货: scoreboard bars rise one after another, the
// 「已开源」medal flashes exactly twice, then a limitation sticky note
// attaches to the board's side. Gentle loop.
const W = 560;
const H = 140;
const LOOP = 5200;
const BAR_H = [50, 36, 26, 42];
const BAR_C = [C.green, C.orange, C.blue, C.green];

export const Ch10Analogy: React.FC<WidgetProps> = () => {
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

      // scoreboard board
      ctx.fillStyle = '#efe4cd';
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(36, 34, 282, 84, 6);
      ctx.fill();
      ctx.stroke();
      // baseline
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(50, 108);
      ctx.lineTo(304, 108);
      ctx.stroke();
      // rising bars (staggered)
      BAR_H.forEach((hh, i) => {
        const p = easeOutCubic(clamp((t - 0.04 - i * 0.07) / 0.28, 0, 1));
        const x = 58 + i * 58;
        const h = hh * p;
        if (h > 0.5) {
          ctx.fillStyle = BAR_C[i];
          ctx.globalAlpha = 0.92;
          ctx.beginPath();
          ctx.roundRect(x, 108 - h, 24, h, 3);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      // medal: dim → flashes exactly twice → steady
      const flash = t >= 0.42 && t < 0.78 ? Math.abs(Math.sin(((t - 0.42) / 0.36) * Math.PI * 2)) : 0;
      const medalAlpha = t < 0.42 ? 0.28 : t < 0.78 ? 0.3 + 0.7 * flash : 1;
      const medalScale = 1 + 0.14 * flash;
      ctx.save();
      ctx.translate(484, 48);
      ctx.scale(medalScale, medalScale);
      ctx.globalAlpha = medalAlpha;
      // ribbons
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.moveTo(-10, -34);
      ctx.lineTo(-2, -22);
      ctx.lineTo(-12, -18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(10, -34);
      ctx.lineTo(2, -22);
      ctx.lineTo(12, -18);
      ctx.closePath();
      ctx.fill();
      // disc
      ctx.fillStyle = '#e7b93c';
      ctx.strokeStyle = '#b98a1d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#fdf3d2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#6b4a08';
      ctx.font = '9.5px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('已开源', 0, 1);
      ctx.restore();

      // limitation sticky note slides in and attaches to the board side
      if (t >= 0.8) {
        const p = easeOutCubic(clamp((t - 0.8) / 0.14, 0, 1));
        const nx = lerp(590, 300, p);
        ctx.save();
        ctx.translate(nx, 78);
        ctx.rotate(-0.06);
        ctx.globalAlpha = 0.55 + 0.45 * p;
        ctx.fillStyle = '#f7e8a2';
        ctx.strokeStyle = '#d9b83c';
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.moveTo(-58, -42);
        ctx.lineTo(58, -42);
        ctx.lineTo(58, 34);
        ctx.lineTo(42, 48);
        ctx.lineTo(-58, 48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // folded corner
        ctx.fillStyle = '#e3cd74';
        ctx.beginPath();
        ctx.moveTo(58, 34);
        ctx.lineTo(42, 48);
        ctx.lineTo(42, 34);
        ctx.closePath();
        ctx.fill();
        // note text
        ctx.fillStyle = C.support;
        ctx.font = '10.5px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('注意事项', -48, -28);
        ctx.fillStyle = '#5d4a12';
        ctx.font = '9.5px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('无动作分块', -48, -8);
        ctx.fillText('无本体感知', -48, 8);
        ctx.fillText('单帧输入', -48, 24);
        ctx.restore();
      }

      drawSceneLabel(ctx, '开箱验货', 14, 20);

      // gentle fade before the loop restarts
      if (t > 0.95) {
        ctx.fillStyle = C.bg;
        ctx.globalAlpha = (t - 0.95) / 0.05;
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

export default Ch10Analogy;
