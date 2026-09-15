import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawPrint, drawStripes, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §10 类比：一只手在并排的四张印样上依次掀开、放下，从左到右巡看，
// 最后停在其中一张上轻轻按一下，然后从头重来。

const W = 560;
const H = 140;
const LOOP_MS = 3600;

const CARD_W = 112;
const CARD_H = 62;
const CARD_GAP = 12;
const CARD_X0 = 42;
const CARD_Y0 = 44;
// 巡看顺序：第 5 段回到第三张，停在那里按一下。
const TOUR = [0, 1, 2, 3, 2];
const SLOTS = TOUR.length;
const QUALITY = [0.35, 0.55, 1, 0.6];

const cardCenter = (i: number): number => CARD_X0 + i * (CARD_W + CARD_GAP) + CARD_W / 2;
const cardX = (i: number): number => CARD_X0 + i * (CARD_W + CARD_GAP);

/** 简笔手：以 (x, y) 为捏合点，手向斜上方伸出。 */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PAPER.ink;
  ctx.fillStyle = 'rgba(255,253,246,0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(x, y - 16, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 18);
  ctx.quadraticCurveTo(x - 7, y - 8, x - 2, y - 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 11, y - 18);
  ctx.quadraticCurveTo(x + 7, y - 8, x + 2, y - 1);
  ctx.stroke();
  ctx.restore();
}

export const Analogy10: React.FC<WidgetProps> = () => {
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

    const render = (p: number) => {
      clearScene(ctx, W, H);

      const slotF = p * SLOTS;
      const idx = Math.min(SLOTS - 1, Math.floor(slotF));
      const local = slotF - idx;
      const came = TOUR[Math.max(0, idx - 1)];
      const here = TOUR[idx];

      const travel = easeInOutQuad(clamp(local / 0.45, 0, 1));
      const handX = lerp(cardCenter(came), cardCenter(here), travel);
      const dwell = Math.sin(clamp((local - 0.3) / 0.5, 0, 1) * Math.PI);
      // 前四站是掀开再放下，最后一站是轻轻按一下
      const shift = idx === SLOTS - 1 ? dwell * 4 : -dwell * 9;

      for (let i = 0; i < TOUR.length; i++) {
        const up = i === here ? shift : 0;
        const x = cardX(i);
        const y = CARD_Y0 + up;
        if (up < 0) {
          ctx.save();
          ctx.fillStyle = 'rgba(33,50,74,0.16)';
          ctx.fillRect(x + 5, CARD_Y0 + 8, CARD_W, CARD_H);
          ctx.restore();
        }
        drawPrint(ctx, x, y, CARD_W, CARD_H);
        drawStripes(ctx, x, y, CARD_W, CARD_H, 12, { contrast: QUALITY[i] });
      }

      drawHand(ctx, handX + 34, CARD_Y0 + shift - 4);
    };

    const tick = () => {
      render((performance.now() % LOOP_MS) / LOOP_MS);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-label="手在并排的四张印样上依次掀开放下，最后停在其中一张上按一下"
    />
  );
};

export default Analogy10;
