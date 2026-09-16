import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero old-method side: a fine-looking cabinet whose door is nailed shut (static hollow shell).
const W = 440;
const H = 200;

// 耄耋猫（cat4）透明帧序列：预载 public/cat4，来回播放成无缝循环
const CAT_SRCS = Array.from(
  { length: 16 },
  (_, i) => `${import.meta.env.BASE_URL}cat4/f${String(i).padStart(2, '0')}.png`
);
const catImgs: HTMLImageElement[] = CAT_SRCS.map((s) => {
  const im = new Image();
  im.src = s;
  return im;
});
const CAT_ORDER = [
  ...Array.from({ length: 16 }, (_, i) => i),
  ...Array.from({ length: 14 }, (_, i) => 14 - i),
];
// anchor = 猫右缘 ax、底边 ay（站在地面上、侧身顶住柜子）；返回 false 时调用方画回退图形
const drawCatAt = (
  ctx: CanvasRenderingContext2D,
  time: number,
  ax: number,
  ay: number,
  h: number
): boolean => {
  const im = catImgs[CAT_ORDER[Math.floor(time / 66) % CAT_ORDER.length]];
  if (!im.complete || im.naturalWidth === 0) return false;
  const w = (h * im.naturalWidth) / im.naturalHeight;
  ctx.drawImage(im, ax - w, ay - h, w, h);
  return true;
};

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (time / 3000) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // bench
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 168, W, 8);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(0, 176, W, 3);
      // cabinet body
      const cx = 140;
      const cy = 60;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx, cy, 150, 108);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(cx + 10, cy + 12, 130, 40); // door recess
      // nailed door (never moves)
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(cx + 12, cy + 14, 126, 36);
      // nails with a soft red stress pulse (no hard on/off flicker)
      const blink = 0.55 + 0.4 * Math.sin(time / 210);
      ctx.fillStyle = `rgba(196,63,82,${blink})`;
      for (const [nx, ny] of [
        [cx + 20, cy + 22],
        [cx + 130, cy + 22],
        [cx + 20, cy + 42],
        [cx + 130, cy + 42],
      ]) {
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // pushing hand: ease in, tremble against the nailed door, ease back out —
      // phased so the loop wraps with no teleport.
      const pushIn = easeInOutQuad(clamp(t / 0.35, 0, 1));
      const pushOut = easeInOutQuad(clamp((t - 0.72) / 0.28, 0, 1));
      const push = pushIn * (1 - pushOut);
      const hold = clamp((t - 0.35) / 0.06, 0, 1) * (1 - clamp((t - 0.68) / 0.06, 0, 1));
      const tremble = Math.sin(time / 55) * 2 * hold;
      const hx = 60 + push * 46 + tremble;
      // 猫站在台面（y=168）上，与柜子等高（108）；推到底时右缘贴合柜体左缘 cx=140
      if (!drawCatAt(ctx, time, hx + 34, 168, 108)) {
        ctx.fillStyle = '#21324a';
        ctx.fillRect(hx, cy + 20, 34, 14);
        ctx.beginPath();
        ctx.arc(hx + 36, cy + 27, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      // drawer (also fixed)
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(cx + 12, cy + 62, 126, 34);
      // label
      ctx.fillStyle = '#c43f52';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('钉死 · 推不开', cx + 34, cy - 8);
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

export default HeroOld;
