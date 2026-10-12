import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawPacker, drawPouch, drawRolled, drawSceneLabel } from './packKit';
import type { WidgetProps } from './registry';

// §6 analogy — 「袜子卷起来」: loose socks are rolled up one by one and
// tucked into a packing cube. Repeated small items merge into a single
// piece (BPE): the pile of loose socks thins out while the dots pile up
// inside the cube. Ambient animation, no controls.
const W = 560;
const H = 140;
const LOOP = 3300;

const ROLL_DUR = 0.13;
const TRAVEL_DUR = 0.14;
const SOCKS = [
  { x: 78, start: 0.0 },
  { x: 136, start: 0.3 },
  { x: 194, start: 0.6 },
];
const POUCH_X = 380;
const POUCH_W = 140;
const POUCH_CX = POUCH_X + POUCH_W / 2;

function drawSock(ctx: CanvasRenderingContext2D, x: number, y: number, p: number) {
  // flat sock; p 0 → 1 wobbles and squashes it as it is rolled up
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(p * Math.PI * 3) * 0.12);
  ctx.scale(1 - 0.3 * p, 1 - 0.35 * p);
  ctx.fillStyle = '#f6e3e6';
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-10, -14, 20, 24, 5); // leg
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-10, 4, 28, 11, 5); // toe
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

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

      let done = 0;
      const flying: { x: number; y: number; a: number }[] = [];
      SOCKS.forEach((sock) => {
        const travelAt = sock.start + ROLL_DUR;
        const end = travelAt + TRAVEL_DUR;
        if (t >= end) {
          done += 1;
        } else if (t < sock.start) {
          drawSock(ctx, sock.x, 91, 0);
        } else if (t < travelAt) {
          drawSock(ctx, sock.x, 91, (t - sock.start) / ROLL_DUR);
        } else {
          // rolled sock arcs into the cube and fades as it drops in
          const p = (t - travelAt) / TRAVEL_DUR;
          const q = 1 - p;
          const mx = (sock.x + POUCH_CX) / 2;
          flying.push({
            x: q * q * sock.x + 2 * q * p * mx + p * p * POUCH_CX,
            y: q * q * 74 + 2 * q * p * 44 + p * p * 86,
            a: 1 - 0.9 * clamp((p - 0.8) / 0.2, 0, 1),
          });
        }
      });

      drawPacker(ctx, 262, 106, 1, { mode: 'roll', t });
      drawPouch(ctx, POUCH_X, 92, POUCH_W, done);
      flying.forEach((f) => {
        ctx.globalAlpha = f.a;
        drawRolled(ctx, f.x - 6, f.y, 1, { size: 0.7 });
        ctx.globalAlpha = 1;
      });

      drawSceneLabel(ctx, '重复小物', 40, 34);
      drawSceneLabel(ctx, '合并成一件', POUCH_CX, 60, { align: 'center' });

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
