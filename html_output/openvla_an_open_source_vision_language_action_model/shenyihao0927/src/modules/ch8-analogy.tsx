import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawRuler,
  drawManual,
  drawCabinet,
  drawStickerSheet,
  drawCheckMark,
  drawSceneLabel,
} from './flatKit';

// Ch8 analogy — 出包检查: the full kit (two rulers, manual, panels, sticker
// sheet, compressor) is laid out on a mat; a magnifying lens scans across and
// lights each part; then everything is compressed and strapped for shipping.
// 560x140 self-loop, canvas only.
const W = 560;
const H = 140;
const LOOP = 5200;
const BASE_Y = 94;

type PartDraw = (ctx: CanvasRenderingContext2D) => void;

const drawCompressor = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#9aa5b1';
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-20, -14, 40, 28, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -14, 8, Math.PI, 0);
  ctx.stroke();
  // compression arrows
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const oy of [-5, 5]) {
    ctx.beginPath();
    ctx.moveTo(-6, oy - 3);
    ctx.lineTo(0, oy + 3);
    ctx.lineTo(6, oy - 3);
    ctx.stroke();
  }
};

const PARTS: { cx: number; draw: PartDraw }[] = [
  { cx: 78, draw: (ctx) => drawRuler(ctx, -28, 2, 56, { semantic: true }) },
  { cx: 152, draw: (ctx) => drawRuler(ctx, -28, 6, 56, {}) },
  { cx: 226, draw: (ctx) => drawManual(ctx, 0, 8, 0.8) },
  { cx: 306, draw: (ctx) => drawCabinet(ctx, 0, 12, 0.62, { assembled: false }) },
  { cx: 396, draw: (ctx) => drawStickerSheet(ctx, -28, 0, 4) },
  { cx: 472, draw: drawCompressor },
];

export const Ch8Analogy: React.FC = () => {
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
      const scanP = clamp((t - 0.05) / 0.55, 0, 1);
      const compK = clamp((t - 0.66) / 0.26, 0, 1);
      const compressing = compK > 0 && compK < 1;
      const held = compK >= 1;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // packing mat
      ctx.fillStyle = '#efe9da';
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(28, 64, 504, 58, 8);
      ctx.fill();
      ctx.stroke();

      const lensX = 60 + easeInOutQuad(scanP) * 440;
      const e = easeInOutQuad(compK);

      // parts: dim during scan unless lit; slide + shrink when compressing
      PARTS.forEach((p) => {
        ctx.save();
        if (compK > 0) {
          const x = p.cx + (283 - p.cx) * e * 0.8;
          const sc = 1 - 0.62 * e;
          ctx.translate(x, BASE_Y);
          ctx.scale(sc, sc);
        } else {
          const lit = scanP > 0 && scanP < 1 && Math.abs(lensX - p.cx) < 36;
          ctx.globalAlpha = scanP > 0 && !lit ? 0.8 : 1;
          ctx.translate(p.cx, BASE_Y);
          if (lit) {
            ctx.strokeStyle = C.orange;
            ctx.globalAlpha = 0.9;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-34, -34, 68, 64, 8);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
        p.draw(ctx);
        ctx.restore();
      });

      // straps once the bundle is compressed
      if (compK > 0.5) {
        ctx.save();
        ctx.globalAlpha = clamp((compK - 0.5) / 0.3, 0, 1);
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 3;
        for (const sx of [262, 304]) {
          ctx.beginPath();
          ctx.moveTo(sx, 70);
          ctx.lineTo(sx, 118);
          ctx.stroke();
        }
        ctx.restore();
      }

      // magnifying lens gliding over the parts
      if (scanP > 0 && scanP < 1 && compK === 0) {
        ctx.save();
        ctx.fillStyle = C.white;
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(lensX, BASE_Y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(lensX, BASE_Y, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lensX + 18, BASE_Y + 18);
        ctx.lineTo(lensX + 34, BASE_Y + 34);
        ctx.stroke();
        ctx.restore();
      }

      drawSceneLabel(ctx, '出包检查', 16, 22, { color: C.green });
      if (compressing || held) {
        drawSceneLabel(ctx, '压缩打包', 452, 22, { color: C.orange });
      }
      if (held) drawCheckMark(ctx, 520, 44, 11);

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

export default Ch8Analogy;
