import { useEffect, useRef, type RefObject } from 'react';
import { observeCanvas, observeCanvasContainer, setupCanvasHiDPI } from '../lib/canvasKit';
import { markCanvasReady } from './sharedDraw';

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/**
 * Responsive HiDPI canvas: container drives CSS width; height = width * aspectRatio.
 * ResizeObserver re-setup + redraw. Optional rAF loop while visible.
 */
export function useResponsiveCanvas(
  containerRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  aspectRatio: number,
  drawFn: DrawFn,
  deps: unknown[] = [],
  options?: { animate?: boolean }
) {
  const drawRef = useRef(drawFn);
  drawRef.current = drawFn;
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    let rafId = 0;

    const paint = () => {
      if (!ctx) return;
      drawRef.current(ctx, sizeRef.current.w, sizeRef.current.h);
      markCanvasReady(canvas);
    };

    const setup = (w: number, h: number) => {
      sizeRef.current = { w, h };
      try {
        ctx = setupCanvasHiDPI(canvas, w, h);
        paint();
      } catch {
        ctx = null;
      }
    };

    const disconnectResize = observeCanvasContainer(container, aspectRatio, setup);

    const start = () => {
      if (options?.animate && !rafId) {
        const loop = () => {
          paint();
          rafId = requestAnimationFrame(loop);
        };
        loop();
      }
    };
    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const disconnectVis = observeCanvas(canvas, start, stop);
    if (options?.animate) start();

    return () => {
      stop();
      disconnectVis();
      disconnectResize();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio, options?.animate, ...deps]);
}

/**
 * Fixed CSS-size HiDPI canvas (no container observer).
 * Prefer useResponsiveCanvas for production widgets.
 */
export function usePaperCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D) => void,
  deps: unknown[] = [],
  options?: { animate?: boolean }
) {
  const drawRef = useRef(drawFn);
  drawRef.current = drawFn;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvasHiDPI(canvas, width, height);
    } catch {
      return;
    }

    const paint = () => {
      drawRef.current(ctx);
      markCanvasReady(canvas);
    };

    paint();

    let rafId = 0;
    const loop = () => {
      paint();
      rafId = requestAnimationFrame(loop);
    };
    const start = () => {
      if (options?.animate && !rafId) rafId = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const disconnect = observeCanvas(canvas, start, stop);
    if (options?.animate) start();

    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, options?.animate, ...deps]);
}
