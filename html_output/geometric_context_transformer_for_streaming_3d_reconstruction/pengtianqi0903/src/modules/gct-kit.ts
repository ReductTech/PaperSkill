import { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const WIDTH = 640;

export const COLORS = {
  ground: '#f5f8f0',
  campus: '#b8c9a7',
  campusDark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  pale: '#eef3fb',
  white: '#ffffff',
};

export const canvasStyle = (maxWidth = WIDTH) => ({
  width: '100%',
  maxWidth,
  height: 'auto',
  display: 'block',
  margin: '0 auto',
});

export function useStaticCanvas(
  draw: (ctx: CanvasRenderingContext2D) => void,
  height = 300,
  width = WIDTH,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    draw(ctx);
    canvas.classList.add('is-ready');
  }, [draw, height, width]);
  return ref;
}

export function useAnimatedCanvas(
  draw: (ctx: CanvasRenderingContext2D, progress: number) => void,
  height = 220,
  width = WIDTH,
  duration = 2600,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame: number | null = null;
    let running = false;
    let start = performance.now();
    const tick = (now: number) => {
      if (!running) return;
      const progress = reduced ? 0.72 : ((now - start) % duration) / duration;
      draw(ctx, progress);
      canvas.classList.add('is-ready');
      if (!reduced) frame = requestAnimationFrame(tick);
    };
    const begin = () => {
      if (running) return;
      running = true;
      start = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const disconnect = observeCanvas(canvas, begin, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [draw, duration, height, width]);
  return ref;
}

export function clear(ctx: CanvasRenderingContext2D, width = WIDTH, height = 300) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, 0, width, height);
}

export function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = COLORS.text,
  size = 13,
  weight = 650,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillText(value, x, y);
}

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke = COLORS.border,
  radius = 10,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = COLORS.blue,
  width = 2,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(angle - Math.PI / 6), y2 - 9 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 9 * Math.cos(angle + Math.PI / 6), y2 - 9 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function camera(ctx: CanvasRenderingContext2D, x: number, y: number, color = COLORS.blue) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.fillRect(-13, -9, 26, 18);
  ctx.beginPath();
  ctx.moveTo(13, -7);
  ctx.lineTo(25, -14);
  ctx.lineTo(25, 14);
  ctx.lineTo(13, 7);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function token(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  textValue = '',
  size = 14,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  if (textValue) label(ctx, textValue, x + 3, y + size - 3, COLORS.white, Math.max(8, size - 5), 800);
}

export function route(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color: string,
  dashed = false,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath();
  points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
}
