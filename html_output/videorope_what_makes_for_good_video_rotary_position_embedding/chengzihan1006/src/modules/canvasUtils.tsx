import { DependencyList, useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const CW = 1080;
export const CH = 280;
export const TECH_H = 420;

export const COLORS = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  brown: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  white: '#ffffff',
};

export function useStaticCanvas(
  draw: (ctx: CanvasRenderingContext2D) => void,
  deps: DependencyList
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, CW, CH);
    const render = () => {
      draw(ctx);
      canvas.classList.add('is-ready');
    };
    render();
    return observeCanvas(canvas, render, () => {});
  }, deps);
  return ref;
}

export function useSizedStaticCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  deps: DependencyList
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    const render = () => {
      draw(ctx);
      canvas.classList.add('is-ready');
    };
    render();
    return observeCanvas(canvas, render, () => {});
  }, deps);
  return ref;
}

export function useAnimatedCanvas(
  draw: (ctx: CanvasRenderingContext2D, time: number) => void,
  deps: DependencyList
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, CW, CH);
    let raf = 0;
    const tick = (time: number) => {
      draw(ctx, time);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, deps);
  return ref;
}

export function useSizedAnimatedCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, time: number) => void,
  deps: DependencyList
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    let raf = 0;
    const tick = (time: number) => {
      draw(ctx, time);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, deps);
  return ref;
}

export function clear(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CW, CH);
}

export function clearSized(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
}

export function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = COLORS.white;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = COLORS.text,
  size = 18
) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "Segoe UI", sans-serif`;
  ctx.fillText(text, x, y);
}

export function chipClass(active: boolean) {
  return `chip${active ? ' active' : ''}`;
}

export function feedbackClass(kind: 'good' | 'bad' | 'neutral') {
  return `feedback${kind === 'good' ? ' good' : kind === 'bad' ? ' bad' : ''}`;
}
