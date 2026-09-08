import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLighthouse, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §2: a hand flips open one roadbook page revealing the lighthouse photo.
export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const render = (time: number) => {
      const p = (time % 3000) / 3000;
      clearScene(ctx, W, H);
      // desk edge
      ctx.fillStyle = C.hill;
      ctx.fillRect(0, 108, W, 22);
      // open book base
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.fillRect(52, 34, 140, 76);
      ctx.strokeRect(52, 34, 140, 76);
      ctx.beginPath();
      ctx.moveTo(122, 34);
      ctx.lineTo(122, 110);
      ctx.stroke();
      // right page content: lighthouse photo
      ctx.fillStyle = C.hill;
      ctx.fillRect(128, 42, 58, 52);
      drawLighthouse(ctx, 157, 90, 0.9);
      // flipping page: width oscillates like a turning leaf
      const flip = Math.abs(Math.sin(p * Math.PI));
      const pw = 64 * flip;
      ctx.fillStyle = '#fbfbf7';
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(122, 34);
      ctx.lineTo(122 - pw, 30);
      ctx.lineTo(122 - pw, 106);
      ctx.lineTo(122, 110);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // hand wedge bottom-right
      ctx.fillStyle = '#e8c9a8';
      ctx.beginPath();
      ctx.moveTo(210, 130);
      ctx.quadraticCurveTo(196, 104, 176, 106);
      ctx.lineTo(190, 130);
      ctx.closePath();
      ctx.fill();
      sceneLabel(ctx, '路书', 60, 26, false, 10);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (t: number) => {
      render(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana2;
