import { useEffect, useRef, useState, type RefObject } from 'react';

export interface CanvasSceneOptions<Model> {
  width: number;
  height: number;
  model: Model;
  draw: (ctx: CanvasRenderingContext2D, model: Model, width: number, height: number) => void;
  onOutOfView?: () => void;
}

export interface CanvasSceneHandle {
  canvasRef: RefObject<HTMLCanvasElement>;
  ready: boolean;
  contextUnavailable: boolean;
  fallbackText: string;
}

export function useCanvasScene<Model>({
  width,
  height,
  model,
  draw,
  onOutOfView,
}: CanvasSceneOptions<Model>): CanvasSceneHandle {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef(model);
  const drawRef = useRef(draw);
  const onOutOfViewRef = useRef(onOutOfView);
  const [ready, setReady] = useState(false);
  const [contextUnavailable, setContextUnavailable] = useState(false);
  modelRef.current = model;
  drawRef.current = draw;
  onOutOfViewRef.current = onOutOfView;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let context: CanvasRenderingContext2D | null = null;
    let disposed = false;

    const drawCurrent = () => {
      if (disposed) return;
      context = canvas.getContext('2d');
      if (!context) {
        setContextUnavailable(true);
        return;
      }

      const cssWidth = Math.max(1, canvas.clientWidth || width);
      const cssHeight = cssWidth * (height / width);
      const dpr = typeof window === 'undefined' ? 1 : Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.aspectRatio = `${width} / ${height}`;
      context.setTransform(dpr * cssWidth / width, 0, 0, dpr * cssWidth / width, 0, 0);
      context.clearRect(0, 0, width, height);
      drawRef.current(context, modelRef.current, width, height);
      canvas.classList.add('is-ready');
      setReady(true);
    };

    drawCurrent();
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(drawCurrent);
    resizeObserver?.observe(canvas);
    window.addEventListener('resize', drawCurrent);

    const intersectionObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) onOutOfViewRef.current?.();
          else drawCurrent();
        });
      }, { threshold: 0.05 });
    intersectionObserver?.observe(canvas);

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', drawCurrent);
    };
  }, [height, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const cssWidth = Math.max(1, canvas.clientWidth || width);
    const dpr = typeof window === 'undefined' ? 1 : Math.max(1, window.devicePixelRatio || 1);
    context.setTransform(dpr * cssWidth / width, 0, 0, dpr * cssWidth / width, 0, 0);
    context.clearRect(0, 0, width, height);
    drawRef.current(context, modelRef.current, width, height);
  }, [height, model, ready, width]);

  return {
    canvasRef,
    ready,
    contextUnavailable,
    fallbackText: '当前浏览器无法使用 Canvas，请阅读下方文字说明。',
  };
}
