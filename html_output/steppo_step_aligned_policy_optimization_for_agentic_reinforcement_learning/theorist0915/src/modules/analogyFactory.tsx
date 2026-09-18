import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { drawAnalogyScene, type AnalogyScene } from './analogyKit';

const W = 560, H = 140;

function makeAnalogy(scene: AnalogyScene): React.FC<WidgetProps> {
  return function AnalogyWidget() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    useEffect(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      let ctx: CanvasRenderingContext2D;
      try { ctx = setupCanvas(canvas, W, H); } catch { return; }
      let t0 = performance.now();
      const tick = (t: number) => {
        const u = ((t - t0) % 3600) / 3600;
        drawAnalogyScene(ctx, W, H, u, scene);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        rafRef.current = requestAnimationFrame(tick);
      };
      const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
      const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
      const disconnect = observeCanvas(canvas, start, stop);
      return () => { stop(); disconnect(); };
    }, []);
    return <canvas ref={canvasRef} width={W} height={H} />;
  };
}

export const Analogy1 = makeAnalogy('jitter');
export const Analogy2 = makeAnalogy('ledger');
export const Analogy3 = makeAnalogy('turn');
export const Analogy4 = makeAnalogy('stations');
export const Analogy5 = makeAnalogy('scorecard');
export const Analogy6 = makeAnalogy('hops');
export const Analogy7 = makeAnalogy('trailer');
export const Analogy8 = makeAnalogy('dispatch');
export const Analogy9 = makeAnalogy('fairrace');
export const Analogy10 = makeAnalogy('finishboard');
