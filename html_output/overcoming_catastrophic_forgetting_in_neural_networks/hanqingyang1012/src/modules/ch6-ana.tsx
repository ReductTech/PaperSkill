import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 类比（560×140，3s 循环）：攀岩者的手沿固定绳线依次把绳子扣进 3 个快挂，
// 每个快挂被扣上后从红变绿。无控件、Canvas 内不写字。
const W = 560;
const H = 140;
const LOOP = 3000;
const QDS = [190, 290, 390];
const CLIP_T = [0.22, 0.41, 0.58];

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

function easeInOut(k: number): number {
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
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

export const Ch6Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const drawQuickdraw = (x: number, color: string): void => {
      // bolt dot at the top
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(x, 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // sling + carabiner ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x, 34);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, 42, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawClimber = (x: number, handX: number): void => {
      ctx.strokeStyle = C.ink;
      ctx.fillStyle = C.ink;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      // legs
      ctx.beginPath();
      ctx.moveTo(x, 110);
      ctx.lineTo(x - 8, 124);
      ctx.moveTo(x, 110);
      ctx.lineTo(x + 8, 124);
      ctx.stroke();
      // torso
      ctx.beginPath();
      ctx.moveTo(x, 110);
      ctx.lineTo(x, 84);
      ctx.stroke();
      // head
      ctx.beginPath();
      ctx.arc(x, 78, 6.5, 0, Math.PI * 2);
      ctx.fill();
      // back arm
      ctx.beginPath();
      ctx.moveTo(x, 86);
      ctx.lineTo(x - 13, 100);
      ctx.stroke();
      // reaching arm along the fixed line
      ctx.beginPath();
      ctx.moveTo(x, 86);
      ctx.lineTo(handX, 44);
      ctx.stroke();
      // hand gripping the line
      ctx.beginPath();
      ctx.arc(handX, 44, 4.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (now: number): void => {
      const t = ((now - t0) % LOOP) / LOOP;
      const p = clamp(t * 1.18, 0, 1);
      const handX = 150 + 300 * easeInOut(p);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      // rock band (lower two-thirds)
      ctx.fillStyle = C.rockL;
      ctx.fillRect(0, 48, W, H - 48);
      ctx.strokeStyle = C.rockD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(W, 48);
      ctx.stroke();
      // holds
      ctx.fillStyle = C.blue;
      rr(ctx, 120 - 5, 70 - 5, 10, 10, 4);
      ctx.fill();
      rr(ctx, 250 - 5, 90 - 5, 10, 10, 4);
      ctx.fill();
      rr(ctx, 380 - 5, 76 - 5, 10, 10, 4);
      ctx.fill();
      // anchor of the fixed line
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.moveTo(70, 36);
      ctx.lineTo(76, 46);
      ctx.lineTo(64, 46);
      ctx.closePath();
      ctx.fill();

      // rope: runs through every clipped quickdraw up to the hand
      const pts: number[][] = [[70, 44]];
      for (let i = 0; i < 3; i++) {
        if (handX >= QDS[i] - 4) pts.push([QDS[i], 44]);
      }
      pts.push([handX, 44]);
      ctx.strokeStyle = C.rope;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        if (i === 0) ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo((a[0] + b[0]) / 2, 48, b[0], b[1]);
      }
      ctx.stroke();

      // quickdraws: red before clipping, green after
      for (let i = 0; i < 3; i++) {
        const clipped = handX >= QDS[i] - 4;
        drawQuickdraw(QDS[i], clipped ? C.green : C.red);
      }
      // brief green flash when a quickdraw is clipped
      for (let i = 0; i < 3; i++) {
        const fp = (t - CLIP_T[i]) / 0.16;
        if (fp > 0 && fp < 1) {
          ctx.strokeStyle = `rgba(34,141,92,${(1 - fp).toFixed(3)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(QDS[i], 42, 6.5 + 14 * fp, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // climber follows the hand along the line
      drawClimber(150 + p * 70, handX);
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

export default Ch6Ana;
