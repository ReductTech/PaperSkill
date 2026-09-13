import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 analogy (560x140): one hand pushes a cabinet door that is nailed shut — it never opens.
const W = 560;
const H = 140;

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

export const Ch1Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);
      // cabinet
      const cx = 300;
      const cy = 30;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx, cy, 170, 86);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(cx + 10, cy + 8, 150, 32);
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(cx + 10, cy + 48, 150, 30);
      // nails pulse red softly (no hard blink edge)
      const blink = 0.55 + 0.4 * Math.sin(time / 200);
      ctx.fillStyle = `rgba(196,63,82,${blink})`;
      for (const [nx, ny] of [
        [cx + 18, cy + 16],
        [cx + 152, cy + 16],
        [cx + 18, cy + 32],
        [cx + 152, cy + 32],
      ]) {
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // hand: ease in, tremble while pressing the nailed door, ease back out —
      // phased so the loop wraps smoothly instead of teleporting to the start.
      const pushIn = easeInOutQuad(clamp(t / 0.35, 0, 1));
      const pushOut = easeInOutQuad(clamp((t - 0.72) / 0.28, 0, 1));
      const push = pushIn * (1 - pushOut);
      const hold = clamp((t - 0.35) / 0.06, 0, 1) * (1 - clamp((t - 0.68) / 0.06, 0, 1));
      const tremble = Math.sin(time / 55) * 2.5 * hold;
      const hx = 170 + push * 100 + tremble;
      // 猫站在台面（y=116）上，与柜子等高（86）；推到底时右缘贴合柜体左缘 cx=300
      if (!drawCatAt(ctx, time, hx + 30, 116, 86)) {
        ctx.fillStyle = '#21324a';
        ctx.fillRect(hx, cy + 12, 40, 16);
        ctx.beginPath();
        ctx.arc(hx + 42, cy + 20, 10, 0, Math.PI * 2);
        ctx.fill();
      }
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

export default Ch1Ana;
