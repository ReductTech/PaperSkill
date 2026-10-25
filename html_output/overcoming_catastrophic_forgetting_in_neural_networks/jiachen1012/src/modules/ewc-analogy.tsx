import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const C = {
  scene: '#f5f8f0', ground: '#b8c9a7', gd: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.scene;
  ctx.fillRect(0, 0, W, H);
}
function ground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.ground;
  ctx.fillRect(0, 108, W, 20);
  ctx.fillStyle = C.gd;
  ctx.fillRect(0, 108, W, 2);
}
function target(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, state: string, rot: number) {
  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * i * 0.33, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 1 ? C.scene : C.ground;
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = state === 'lost' ? C.red : C.green;
  ctx.fill();
  ctx.restore();
}
function archer(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number, color: string, bowAng: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x + lean, y - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + lean, y - 42, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.translate(x + lean, y - 26);
  ctx.rotate(bowAng);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(30, 6);
  ctx.stroke();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(30, 6, 20, -1.15, 1.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(30, -14);
  ctx.lineTo(30, 26);
  ctx.stroke();
  ctx.restore();
}
function strap(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, k: number) {
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2 + 5 * k;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export const EwcAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
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
      const t = now / 1000;
      const k = (Math.sin(t / 1.5) + 1) / 2;
      const n = Number(String(chapterId).split('-')[1] || 0);
      if (n === 1) {
        const turn = k;
        target(ctx, 170, 82, 40, turn > 0.5 ? 'lost' : 'ok', 0);
        target(ctx, 400, 82, 40, 'ok', 0);
        archer(ctx, 280, 96, 6 + turn * 20, turn > 0.5 ? C.red : C.blue, turn * 1.0);
      } else if (n === 2) {
        target(ctx, 280, 82, 42, 'ok', k * Math.PI);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(150, 40, 260, 84);
      } else if (n === 3) {
        target(ctx, 150, 82, 40, 'ok', 0);
        target(ctx, 410, 82, 40, 'ok', 0);
        archer(ctx, 280, 96, 2 + k * 8, C.blue, k * 0.25);
      } else if (n === 4) {
        target(ctx, 420, 82, 40, 'ok', 0);
        strap(ctx, 190, 40, 300, 70, k);
        archer(ctx, 240, 96, 2, C.blue, 0.1);
      } else if (n === 5) {
        target(ctx, 420, 82, 40, 'ok', 0);
        strap(ctx, 180, 40, 300, 40 + k * 40, 1 - k);
        archer(ctx, 240, 96, 2, C.blue, 0.1);
      } else if (n === 6) {
        target(ctx, 420, 82, 40, 'ok', 0);
        ctx.fillStyle = k > 0.5 ? C.blue : C.ground;
        ctx.fillRect(190, 30, 90, 56);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(190, 30, 90, 56);
        ctx.fillStyle = C.ink;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(k > 0.5 ? '任务A' : '任务B', 205, 66);
      } else if (n === 7) {
        target(ctx, 420, 82, 40, 'ok', 0);
        strap(ctx, 200, 44, 300, 70, 0.8);
        archer(ctx, 250, 96, 2 + k * 10, C.blue, 0.3 + k * 0.5);
      } else if (n === 8) {
        target(ctx, 420, 82, 40, 'ok', 0);
        const s = Math.floor(t / 0.9) % 3;
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = i === s ? C.red : C.support;
          ctx.lineWidth = i === s ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(200 + i * 26, 44);
          ctx.lineTo(200 + i * 26, 100);
          ctx.stroke();
        }
      } else if (n === 9) {
        target(ctx, 420, 82, 40, 'ok', 0);
        ctx.fillStyle = k > 0.5 ? C.green : C.ground;
        ctx.fillRect(210, 30, 80, 60);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(210, 30, 80, 60);
        ctx.strokeStyle = C.green;
        ctx.beginPath();
        ctx.moveTo(226, 62);
        ctx.lineTo(244, 78);
        ctx.lineTo(272, 44);
        ctx.stroke();
      } else if (n === 10) {
        for (let lane = 0; lane < 2; lane++) {
          const x0 = 140 + lane * 280;
          const prog = lane === 0 ? Math.min(1, k * 1.4) : Math.min(1, k * 0.7);
          const isEwc = lane === 1;
          target(ctx, x0, 82, 30, prog > 0.5 ? (isEwc ? 'ok' : 'lost') : 'ok', 0);
          archer(ctx, x0 + 60, 96, isEwc ? 2 : 10, isEwc ? C.blue : C.red, 0.2);
          if (isEwc) strap(ctx, x0 + 10, 34, x0 + 90, 66, 0.8);
        }
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
  }, [chapterId]);
  return <canvas ref={ref} width={W} height={H} />;
};

export default EwcAnalogy;
