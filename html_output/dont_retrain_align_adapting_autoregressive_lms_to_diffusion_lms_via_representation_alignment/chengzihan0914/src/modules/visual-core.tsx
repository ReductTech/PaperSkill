import { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const W = 1080;
export const H = 320;

export const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  road: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mixColor(from: string, to: string, amount: number) {
  const a = from.match(/\w\w/g)?.map((v) => parseInt(v, 16)) ?? [0, 0, 0];
  const b = to.match(/\w\w/g)?.map((v) => parseInt(v, 16)) ?? [0, 0, 0];
  const parts = a.map((v, i) => Math.round(lerp(v, b[i], clamp(amount, 0, 1))));
  return `rgb(${parts.join(',')})`;
}

export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, time: number) => void,
  deps: React.DependencyList,
  width = W,
  height = H,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    let frame = 0;
    let running = false;
    const epoch = performance.now();
    const tick = (now: number) => {
      draw(ctx, (now - epoch) / 1000);
      canvas.classList.add('is-ready');
      if (running) frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, deps);
  return ref;
}
