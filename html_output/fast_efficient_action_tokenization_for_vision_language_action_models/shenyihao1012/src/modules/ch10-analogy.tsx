import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, easeInOutQuad } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel } from './packKit';
import type { WidgetProps } from './registry';

// §10 analogy — 「行前检查台」: two packing-time columns rise on the check-in
// scale. Naive stuffing (red) climbs slowly; compression packing (green)
// caps out early and earns a 「5× 快」 medal that flashes twice. A caution
// sticky note (limitations) sits at the side. Ambient animation, no controls.
const W = 560;
const H = 140;
const LOOP = 3000;

const BASE_Y = 118;
const MAX_H = 80;

function bar(ctx: CanvasRenderingContext2D, x: number, w: number, h: number, col: string) {
  if (h < 1) return;
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.roundRect(x, BASE_Y - h, w, h, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: number) {
  ctx.fillStyle = C.white;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

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
      drawSceneBg(ctx, W, H, { ground: false });

      // check-in scale axes (packing time grows upward)
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(72, 24);
      ctx.lineTo(72, BASE_Y);
      ctx.lineTo(300, BASE_Y);
      ctx.stroke();

      // naive stuffing: slow long climb; compression: caps out fast
      const rp = easeInOutQuad(clamp((t - 0.12) / 0.68, 0, 1));
      const gp = easeOutCubic(clamp((t - 0.12) / 0.22, 0, 1));
      bar(ctx, 104, 46, MAX_H * rp, C.red);
      bar(ctx, 190, 46, (MAX_H / 5) * gp, C.green);

      // 「5× 快」 medal: pops in, flashes twice, then rests
      if (t > 0.4) {
        const mp = clamp((t - 0.4) / 0.08, 0, 1);
        const flash = t < 0.72 ? Math.abs(Math.sin(((t - 0.4) / 0.32) * Math.PI * 2)) : 0;
        ctx.save();
        ctx.translate(213, 58);
        const s = (0.7 + 0.3 * mp) * (1 + 0.1 * flash);
        ctx.scale(s, s);
        ctx.globalAlpha = mp * (0.15 + 0.5 * flash);
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = mp;
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.moveTo(-6, -24);
        ctx.lineTo(6, -24);
        ctx.lineTo(2, -10);
        ctx.lineTo(-2, -10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = C.orange;
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        star(ctx, 0, 0, 7, 3);
        ctx.restore();
        ctx.globalAlpha = mp;
        drawSceneLabel(ctx, '5× 快', 238, 58);
        ctx.globalAlpha = 1;
      }

      // caution sticky note (limitations), slightly tilted
      ctx.save();
      ctx.translate(430, 72);
      ctx.rotate(-0.04);
      ctx.fillStyle = '#f7e3a1';
      ctx.strokeStyle = 'rgba(146,64,14,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-58, -38, 116, 76, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e6cd7c';
      ctx.beginPath();
      ctx.moveTo(44, 38);
      ctx.lineTo(58, 24);
      ctx.lineTo(58, 38);
      ctx.closePath();
      ctx.fill();
      // warning glyph
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-46, -29);
      ctx.lineTo(-38, -15);
      ctx.lineTo(-54, -15);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-46, -25);
      ctx.lineTo(-46, -20);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(-46, -17.5, 1.1, 0, Math.PI * 2);
      ctx.fill();
      drawSceneLabel(ctx, '注意事项', -26, -22);
      ctx.strokeStyle = '#b19a55';
      ctx.lineWidth = 1.5;
      [-4, 8, 20].forEach((ly, li) => {
        ctx.beginPath();
        ctx.moveTo(-48, ly);
        ctx.lineTo(48 - li * 8, ly);
        ctx.stroke();
      });
      ctx.restore();

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
