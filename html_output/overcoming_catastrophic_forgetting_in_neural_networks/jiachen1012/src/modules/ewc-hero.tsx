import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 520;
const H = 220;
const C = {
  scene: '#f5f8f0', ground: '#b8c9a7', gd: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', ink: '#21324a',
};

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.scene;
  ctx.fillRect(0, 0, W, H);
}
function ground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.ground;
  ctx.fillRect(0, 178, W, 24);
  ctx.fillStyle = C.gd;
  ctx.fillRect(0, 178, W, 3);
}
function target(ctx: CanvasRenderingContext2D, cx: number, cy: number, lost: boolean) {
  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, 17 * i, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 1 ? C.scene : C.ground;
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fillStyle = lost ? C.red : C.green;
  ctx.fill();
}
function archer(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x + lean, y - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + lean, y - 46, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + lean, y - 30);
  ctx.lineTo(x + lean + 34, y - 20);
  ctx.stroke();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + lean + 34, y - 20, 26, -1.15, 1.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + lean + 34, y - 46);
  ctx.lineTo(x + lean + 34, y + 6);
  ctx.stroke();
}
function strap(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, k: number) {
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2 + 5 * k;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export const EwcHero: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (now: number) => {
      clearScene(ctx);
      ground(ctx);
      const k = (Math.sin(now / 850) + 1) / 2;
      const isOld = moduleId === 'old';
      const lean = isOld ? lerp(2, 28, k) : lerp(2, 10, k);
      target(ctx, 130, 148, isOld);
      target(ctx, 395, 148, false);
      if (isOld) {
        archer(ctx, 210, 168, lean, C.red);
      } else {
        strap(ctx, 186, 84, 250, 118, 0.85);
        archer(ctx, 210, 168, lean, C.blue);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const loop = (now: number) => {
      render(now);
      raf.current = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const disc = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disc();
    };
  }, [moduleId]);
  return <canvas ref={ref} width={W} height={H} />;
};

export default EwcHero;
