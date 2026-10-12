import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawVerdict, drawSceneLabel } from './packKit';
import type { WidgetProps } from './registry';

// §9 analogy — 「三张旅行战报」: three postcards are stamped onto the table
// one after another — ① the high-frequency route swept (winding mountain
// road + green seal), ② the rematch with a new backpack (old vs new), ③
// zero-guidebook departure in a strange city (skyline + compass + an
// 「开箱即走」 badge) — then a banner declares the sweep.
const W = 560;
const H = 140;
const LOOP = 3400;

const CW = 132;
const CARD_H = 76;
const BASE_Y = 112;
const CARDS = [
  { x: 52, rot: -0.035, at: 0.05 },
  { x: 214, rot: 0.03, at: 0.2 },
  { x: 376, rot: -0.025, at: 0.35 },
];

function miniRoad(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // winding mountain route, dashed, with a flag at the summit
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy + 18);
  ctx.lineTo(cx - 14, cy + 4);
  ctx.lineTo(cx - 2, cy + 12);
  ctx.lineTo(cx + 16, cy - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cx + 16, cy - 6);
  ctx.lineTo(cx + 16, cy - 20);
  ctx.stroke();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(cx + 16, cy - 20);
  ctx.lineTo(cx + 30, cy - 16);
  ctx.lineTo(cx + 16, cy - 12);
  ctx.closePath();
  ctx.fill();
}

function miniPack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  col: string,
  tilt: number
) {
  // a backpack: body + flap + side straps
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  ctx.fillStyle = col;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-11, -14, 22, 26, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.roundRect(-11, -14, 22, 8, 4);
  ctx.fill();
  ctx.strokeStyle = C.deep;
  ctx.beginPath();
  ctx.arc(-13, -2, 5, Math.PI * 0.4, Math.PI * 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(13, -2, 5, Math.PI * 1.8, Math.PI * 2.6);
  ctx.stroke();
  ctx.restore();
}

function miniPacks(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // rematch: the old slumped backpack vs the new upright one
  miniPack(ctx, cx - 22, cy + 10, 0.75, C.red, -0.2);
  miniPack(ctx, cx + 16, cy + 12, 1.1, C.green, 0.04);
}

function miniCity(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // strange-city skyline + compass, badge: pack-and-go
  const hs = [14, 22, 12, 18];
  hs.forEach((bh, i) => {
    ctx.fillStyle = i % 2 === 0 ? C.blue : C.muted;
    ctx.fillRect(cx - 34 + i * 18 - 7, cy + 20 - bh, 14, bh);
  });
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.arc(cx + 32, cy - 6, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.moveTo(cx + 32, cy - 14);
  ctx.lineTo(cx + 35, cy - 6);
  ctx.lineTo(cx + 29, cy - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(cx + 32, cy + 2);
  ctx.lineTo(cx + 35, cy - 6);
  ctx.lineTo(cx + 29, cy - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.roundRect(cx - 32, cy - 27, 64, 15, 7.5);
  ctx.fill();
  drawSceneLabel(ctx, '开箱即走', cx, cy - 19, { color: C.white, align: 'center' });
}

export const Ch9Analogy: React.FC<WidgetProps> = () => {
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

      const painters = [miniRoad, miniPacks, miniCity];
      CARDS.forEach((card, i) => {
        const p = clamp((t - card.at) / 0.12, 0, 1);
        if (p <= 0) return;
        const e = easeOutCubic(p);
        ctx.save();
        ctx.translate(card.x + CW / 2, BASE_Y - CARD_H / 2 + (1 - e) * -26);
        ctx.rotate(card.rot);
        ctx.scale(1 + (1 - e) * 0.18, 1 + (1 - e) * 0.18);
        ctx.globalAlpha = 0.25 + 0.75 * e;
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-CW / 2, -CARD_H / 2, CW, CARD_H, 5);
        ctx.fill();
        ctx.stroke();
        painters[i](ctx, 0, 6);
        ctx.restore();
        if (p >= 1) {
          drawVerdict(ctx, card.x + CW - 14, BASE_Y - CARD_H + 10, true, {
            r: 9,
            pulse: t * 3,
          });
        }
      });

      if (t > 0.6) {
        const bp = easeOutCubic(clamp((t - 0.6) / 0.1, 0, 1));
        ctx.save();
        ctx.translate(496, 30);
        ctx.rotate(-0.04);
        ctx.scale(0.7 + 0.3 * bp, 0.7 + 0.3 * bp);
        ctx.globalAlpha = bp;
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.roundRect(-52, -16, 104, 32, 16);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = bp;
        drawSceneLabel(ctx, '三战全胜', 496, 31, { color: C.white, align: 'center' });
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

export default Ch9Analogy;
