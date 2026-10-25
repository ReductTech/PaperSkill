import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 每个组件共用一个 rAF 绘制循环：t 为秒；离开视口自动暂停（IntersectionObserver）。
// draw 闭包每帧读取最新 state（drawRef 始终指向最新一次渲染的 draw）。
export function useCanvas(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, t: number) => void
): MutableRefObject<HTMLCanvasElement | null> {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, w, h);
    } catch {
      return;
    }
    let raf = 0;
    let running = false;
    const loop = (ts: number) => {
      drawRef.current(ctx, ts / 1000);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [w, h]);

  return ref;
}
