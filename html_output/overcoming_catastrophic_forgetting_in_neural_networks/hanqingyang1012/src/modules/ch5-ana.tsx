import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 类比（560×140，3.2s 循环）：攀岩者拉动张力调节环，绳子在“松弛下垂（红）”
// 与“绷直（蓝，把攀岩者拽回）”两极之间循环。无控件、Canvas 内不写字。
const W = 560;
const H = 140;
const LOOP = 3200;

const C = {
  bg: '#f5f8f0',
  rockL: '#b8c9a7',
  rockD: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  mute: '#68778f',
};

function mix(c1: string, c2: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const a = p(c1);
  const b = p(c2);
  const k = clamp(t, 0, 1);
  return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(
    lerp(a[2], b[2], k)
  )})`;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const Ch5Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();

    const drawHold = (x: number, y: number, s: number): void => {
      ctx.fillStyle = C.blue;
      rr(ctx, x - s / 2, y - s / 2, s, s, s / 3);
      ctx.fill();
    };

    const drawAnchor = (x: number, y: number): void => {
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x - 7, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y - 8, 6, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawClimber = (x: number, lean: number, hand: { x: number; y: number }): void => {
      const hx = x + lean;
      ctx.strokeStyle = C.ink;
      ctx.fillStyle = C.ink;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      // legs
      ctx.beginPath();
      ctx.moveTo(x, 110);
      ctx.lineTo(x - 9, 124);
      ctx.moveTo(x, 110);
      ctx.lineTo(x + 9, 124);
      ctx.stroke();
      // torso
      ctx.beginPath();
      ctx.moveTo(x, 110);
      ctx.lineTo(hx, 86);
      ctx.stroke();
      // head
      ctx.beginPath();
      ctx.arc(hx, 80, 6.5, 0, Math.PI * 2);
      ctx.fill();
      // back arm
      ctx.beginPath();
      ctx.moveTo(hx, 88);
      ctx.lineTo(x - 13, 102);
      ctx.stroke();
      // reaching arm toward the tensioner ring
      ctx.beginPath();
      ctx.moveTo(hx, 88);
      ctx.lineTo(hand.x, hand.y);
      ctx.stroke();
    };

    const render = (now: number): void => {
      const t = ((now - t0) % LOOP) / LOOP;
      const tension = (1 - Math.cos(t * Math.PI * 2)) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      // rock band (lower two-thirds)
      ctx.fillStyle = C.rockL;
      ctx.fillRect(0, 56, W, H - 56);
      ctx.strokeStyle = C.rockD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 56);
      ctx.lineTo(W, 56);
      ctx.stroke();
      drawHold(160, 96, 9);
      drawHold(330, 118, 9);
      drawAnchor(118, 62);

      const ringX = 255;
      const ringY = lerp(102, 42, tension);
      const climberX = lerp(408, 356, tension);
      const ropeColor =
        tension < 0.5
          ? mix(C.red, C.orange, tension * 2)
          : mix(C.orange, C.blue, (tension - 0.5) * 2);
      const sag = lerp(32, 0, tension);

      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 3 + tension * 1.5;
      ctx.lineCap = 'round';
      // rope: anchor -> ring
      ctx.beginPath();
      ctx.moveTo(118, 62);
      ctx.quadraticCurveTo((118 + ringX) / 2, (62 + ringY) / 2 + sag, ringX, ringY);
      ctx.stroke();
      // rope: ring -> climber harness
      const harnessX = climberX - 14;
      const harnessY = 86;
      ctx.beginPath();
      ctx.moveTo(ringX, ringY);
      ctx.quadraticCurveTo((ringX + harnessX) / 2, (ringY + harnessY) / 2 + sag, harnessX, harnessY);
      ctx.stroke();

      const sway = Math.sin((now - t0) / 550) * 1.5;
      drawClimber(climberX, -lerp(0, 5, tension) + sway, { x: ringX, y: ringY + 2 });

      // tensioner ring (the goal object, drawn over the hand)
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ringX, ringY, 5, 0, Math.PI * 2);
      ctx.stroke();
    };

    const tick = (now: number): void => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = (): void => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch5Ana;
