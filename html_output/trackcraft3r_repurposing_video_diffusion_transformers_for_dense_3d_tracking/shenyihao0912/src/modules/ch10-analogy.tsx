import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg } from './dogKit';
import type { WidgetProps } from './registry';

// Ch10 analogy card — 评片: two spinning reels on a glowing lightbox. The LEFT
// reel (red tag) plays the old method's track: its dot drifts further off the
// dashed true path every pass. The RIGHT reel (green tag) plays TrackCraft3R:
// its dot stays on the path. The green reel brightens and a ribbon pops above
// it — the evidence-backed winner.
const W = 560;
const H = 140;
const LOOP = 3600;

const drawReel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
  tagColor: string,
  trail: 'drift' | 'accurate',
  t: number,
  bright: number
) => {
  ctx.save();
  if (bright > 0) {
    ctx.globalAlpha = 0.3 * bright;
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // film disc
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (bright > 0) {
    ctx.globalAlpha = 0.45 * bright;
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // true path reference across the reel face
  ctx.strokeStyle = C.bg;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.78, y);
  ctx.lineTo(x + r * 0.78, y);
  ctx.stroke();
  ctx.setLineDash([]);
  // the playing dot: drift grows each pass (old) or hugs the path (ours)
  const px = x - r * 0.78 + t * r * 1.56;
  const drift = trail === 'drift' ? 4 + t * 14 : 2 * Math.sin(t * 6);
  const dotColor = trail === 'drift' ? C.red : C.green;
  // short residue trail behind the dot
  ctx.strokeStyle = dotColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let u = 0; u <= 0.24; u += 0.04) {
    const q = t - u;
    if (q < 0) continue;
    const qx = x - r * 0.78 + q * r * 1.56;
    const qd = trail === 'drift' ? 4 + q * 14 : 2 * Math.sin(q * 6);
    if (u === 0) ctx.moveTo(qx, y - qd);
    else ctx.lineTo(qx, y - qd);
  }
  ctx.stroke();
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(px, y - drift, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // spinning hub + spokes
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.strokeStyle = C.bg;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
    ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
    ctx.stroke();
  }
  ctx.restore();
  // method tag dot on the rim
  ctx.fillStyle = tagColor;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + r * 0.62, y - r * 0.62, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

const drawRibbon = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -26);
  ctx.stroke();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(1, -26);
  ctx.lineTo(27, -20);
  ctx.lineTo(1, -12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

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
      const bright = clamp((t - 0.28) / 0.24, 0, 1);
      const pop = t > 0.58 ? clamp((t - 0.58) / 0.1, 0, 1) : 0;
      const fade = t > 0.88 ? 1 - clamp((t - 0.88) / 0.12, 0, 1) : 1;
      const ribbonS = pop * (1 + 0.25 * Math.sin(pop * Math.PI)) * fade;
      // playback progress on each reel (one pass per loop)
      const play = clamp(t / 0.85, 0, 1);
      const spin = (ms / 700) % (Math.PI * 2);

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // the glowing lightbox
      ctx.save();
      ctx.shadowColor = 'rgba(240,126,71,0.55)';
      ctx.shadowBlur = 12 + 6 * Math.sin(t * Math.PI * 2) + 14 * bright;
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(66, 30, 428, 94, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // warm inner light
      ctx.globalAlpha = 0.1 + 0.16 * bright;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.roundRect(76, 38, 408, 78, 8);
      ctx.fill();
      ctx.globalAlpha = 1;

      // left reel: old method (red tag) — track drifts off the dashed path;
      // right reel: TrackCraft3R (green tag) — track stays on the path
      drawReel(ctx, 200, 76, 28, spin, C.red, 'drift', play, 0);
      drawReel(ctx, 350, 76, 28, -spin, C.green, 'accurate', play, bright * fade);

      // the green ribbon pops above the winning reel
      if (ribbonS > 0.01) drawRibbon(ctx, 350, 46, ribbonS);

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
