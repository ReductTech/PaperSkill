import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 analogy (560x140): a block of grey noise grains is "carved" away grain by
// grain, revealing the cabinet inside (door seams + handle dots); then the
// whole scene dips invisible and resets to full noise — seamless loop.
const W = 560;
const H = 140;
const T = 4200; // full loop (ms)

const BX = 250; // noise/cabinet block
const BY = 20;
const BW = 140;
const BH = 96;

// deterministic pseudo-random grains (LCG) so every frame draws the same field
interface Grain {
  x: number;
  y: number;
  r: number;
  a: number;
  thr: number; // carve progress at which this grain is fully gone
}
const GRAINS: Grain[] = (() => {
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const out: Grain[] = [];
  for (let i = 0; i < 140; i++) {
    out.push({
      x: BX + 5 + rnd() * (BW - 10),
      y: BY + 5 + rnd() * (BH - 10),
      r: 1.2 + rnd() * 1.8,
      a: 0.35 + rnd() * 0.4,
      thr: rnd() * 0.85,
    });
  }
  return out;
})();

export const Ch6Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (time: number) => {
      const t = (time / T) % 1;
      // carve progress: eased rise over 0–0.6, hold the finished cabinet,
      // then the scene fades out 0.82–0.9 and back in 0.94–1.0 with p already
      // reset to 0 — so the wrap frame equals the first frame (full noise)
      const p = t < 0.9 ? easeInOutQuad(clamp(t / 0.6, 0, 1)) : 0;
      let alpha = 1;
      if (t >= 0.82 && t < 0.9) alpha = 1 - easeInOutQuad((t - 0.82) / 0.08);
      else if (t >= 0.9 && t < 0.94) alpha = 0;
      else if (t >= 0.94) alpha = easeInOutQuad((t - 0.94) / 0.06);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);

      ctx.save();
      ctx.globalAlpha = alpha;

      // noise slab body: greyness drains as the carving proceeds
      ctx.fillStyle = `rgba(104,119,143,${0.3 * (1 - p)})`;
      ctx.fillRect(BX, BY, BW, BH);
      // grains vanish one by one as p passes their threshold
      GRAINS.forEach((g) => {
        const ga = g.a * clamp((g.thr - p) / 0.08, 0, 1);
        if (ga <= 0) return;
        ctx.fillStyle = `rgba(104,119,143,${ga})`;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // the cabinet hidden inside: revealed late in the carve (wood browns,
      // door seam down the middle, two handle dots)
      const ca = easeInOutQuad(clamp((p - 0.2) / 0.7, 0, 1));
      if (ca > 0) {
        ctx.save();
        ctx.globalAlpha = alpha * ca;
        ctx.fillStyle = '#7a3509';
        ctx.fillRect(BX + 10, BY + 10, BW - 20, BH - 20);
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(BX + 16, BY + 16, BW - 32, BH - 32);
        // door split line + panel outlines
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(BX + BW / 2, BY + 16);
        ctx.lineTo(BX + BW / 2, BY + BH - 16);
        ctx.stroke();
        ctx.strokeRect(BX + 20, BY + 20, BW / 2 - 27, BH - 40);
        ctx.strokeRect(BX + BW / 2 + 7, BY + 20, BW / 2 - 27, BH - 40);
        // handle dots flanking the seam
        ctx.fillStyle = '#d7deea';
        ctx.beginPath();
        ctx.arc(BX + BW / 2 - 9, BY + BH / 2, 3, 0, Math.PI * 2);
        ctx.arc(BX + BW / 2 + 9, BY + BH / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // stage labels crossfade with the carve
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      const la = 1 - clamp(p / 0.3, 0, 1);
      if (la > 0.02) {
        ctx.save();
        ctx.globalAlpha = alpha * la;
        ctx.fillStyle = '#68778f';
        ctx.fillText('噪声毛坯', 160, 72);
        ctx.restore();
      }
      const ra = clamp((p - 0.6) / 0.3, 0, 1);
      if (ra > 0.02) {
        ctx.save();
        ctx.globalAlpha = alpha * ra;
        ctx.fillStyle = '#228d5c';
        ctx.fillText('成型柜子', BX + BW + 16, 72);
        ctx.restore();
      }

      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch6Ana;
