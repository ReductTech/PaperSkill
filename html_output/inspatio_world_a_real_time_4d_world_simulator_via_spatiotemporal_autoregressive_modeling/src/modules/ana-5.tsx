import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, sceneLabel } from './scene-kit';

const W = 244;
const H = 130;

// Analogy §5: a hand turns the steering wheel; the road ahead bends in sync.
export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const p = (time % 3200) / 3200;
      const ang = Math.sin(p * Math.PI * 2) * (Math.PI / 10); // ±18°
      clearScene(ctx, W, H);
      // windshield road view (perspective wedge bending with ang)
      const bend = ang * 140;
      ctx.fillStyle = C.road;
      ctx.beginPath();
      ctx.moveTo(96, 116);
      ctx.lineTo(210, 116);
      ctx.quadraticCurveTo(190 + bend * 0.4, 70, 168 + bend, 36);
      ctx.lineTo(152 + bend, 36);
      ctx.quadraticCurveTo(140 + bend * 0.4, 70, 96, 116);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.roadEdge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(96, 116);
      ctx.quadraticCurveTo(140 + bend * 0.4, 70, 152 + bend, 36);
      ctx.moveTo(210, 116);
      ctx.quadraticCurveTo(190 + bend * 0.4, 70, 168 + bend, 36);
      ctx.stroke();
      // steering wheel with hand
      ctx.save();
      ctx.translate(52, 84);
      ctx.rotate(ang);
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(26, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 26);
      ctx.stroke();
      ctx.fillStyle = '#e8c9a8';
      ctx.beginPath();
      ctx.arc(-24, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      sceneLabel(ctx, '指令→几何', 150, 22, false, 11);
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

export default Ana5;
