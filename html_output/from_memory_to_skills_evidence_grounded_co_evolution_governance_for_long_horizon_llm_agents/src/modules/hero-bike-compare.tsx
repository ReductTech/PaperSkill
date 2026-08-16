import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 360;
const H = 180;

const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
}

function drawBike(ctx: CanvasRenderingContext2D, x: number, y: number, repaired: number) {
  const rearX = x;
  const frontX = x + 82;
  const wheelY = y;
  const r = 25;
  drawWheel(ctx, rearX, wheelY, r);
  drawWheel(ctx, frontX, wheelY, r);

  const hubX = x + 39;
  const hubY = y;
  const seatX = x + 27;
  const seatY = y - 41;
  const headX = x + 65;
  const headY = y - 40;
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(rearX, wheelY);
  ctx.lineTo(hubX, hubY);
  ctx.lineTo(seatX, seatY);
  ctx.lineTo(rearX, wheelY);
  ctx.moveTo(hubX, hubY);
  ctx.lineTo(headX, headY);
  ctx.lineTo(frontX, wheelY);
  ctx.moveTo(seatX, seatY);
  ctx.lineTo(headX, headY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(seatX - 9, seatY - 2);
  ctx.lineTo(seatX + 8, seatY - 2);
  ctx.moveTo(headX, headY);
  ctx.lineTo(headX + 8, headY - 12);
  ctx.lineTo(headX + 16, headY - 12);
  ctx.stroke();

  ctx.strokeStyle = repaired > 0.65 ? C.green : C.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rearX + 3, wheelY + 3);
  ctx.quadraticCurveTo(hubX - 4, wheelY + 8 * (1 - repaired), hubX + 5, wheelY + 2);
  ctx.stroke();
}

function drawRider(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(x, y - 66, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - 57);
  ctx.lineTo(x + 13, y - 38);
  ctx.lineTo(x + 31, y - 30);
  ctx.moveTo(x + 12, y - 39);
  ctx.lineTo(x + 4, y - 18);
  ctx.moveTo(x + 12, y - 39);
  ctx.lineTo(x + 27, y - 12);
  ctx.stroke();
}

function drawOld(ctx: CanvasRenderingContext2D, t: number) {
  drawBike(ctx, 78, 130, 0);
  drawRider(ctx, 105, 127);

  const flap = Math.sin(t * Math.PI * 2) * 3;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  roundedRect(ctx, 226, 50 + flap, 78, 68, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(238, 67 + i * 13 + flap);
    ctx.lineTo(291 - i * 5, 67 + i * 13 + flap);
    ctx.stroke();
  }

  ctx.strokeStyle = C.red;
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.moveTo(55, 158);
  ctx.lineTo(185, 158);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.red;
  ctx.font = '700 14px "Segoe UI", sans-serif';
  ctx.fillText('仍需重新判断', 213, 148);
}

function drawNew(ctx: CanvasRenderingContext2D, t: number) {
  const progress = Math.min(t / 0.72, 1);
  const eased = easeInOutQuad(progress);
  drawBike(ctx, 78 + eased * 22, 130, progress);
  drawRider(ctx, 105 + eased * 22, 127);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = progress > 0.25 ? C.green : C.blue;
  ctx.lineWidth = 2;
  roundedRect(ctx, 226, 45, 92, 77, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.font = '700 13px "Segoe UI", sans-serif';
  ctx.fillText('触发 · 边界', 239, 67);
  ctx.fillText('程序 · 验证', 239, 89);
  if (progress > 0.72) {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(245, 103);
    ctx.lineTo(252, 110);
    ctx.lineTo(266, 96);
    ctx.stroke();
  }

  ctx.strokeStyle = C.green;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(55, 158);
  ctx.lineTo(55 + 130 * eased, 158);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(55 + 130 * eased, 158, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.green;
  ctx.font = '700 14px "Segoe UI", sans-serif';
  ctx.fillText(progress >= 1 ? '执行后验证' : '受治理调用', 218, 148);
}

export const HeroBikeCompare: React.FC<WidgetProps> = ({ moduleId }) => {
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
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (now: number) => {
      const phase = reduced ? 0.86 : (now % 3600) / 3600;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(0, 160, W, 20);
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.lineTo(W, 160);
      ctx.stroke();
      if (moduleId === 'new') drawNew(ctx, phase);
      else drawOld(ctx, phase);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={
        moduleId === 'new'
          ? 'MSCE 从同一掉链故障出发，检查触发与边界，执行程序后进行验证'
          : '传统记忆从掉链故障出发，反复查阅维修记录后仍需重新判断'
      }
    />
  );
};

export default HeroBikeCompare;
