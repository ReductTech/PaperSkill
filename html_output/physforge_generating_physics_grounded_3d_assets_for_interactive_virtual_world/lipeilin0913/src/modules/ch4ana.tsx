import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 analogy (560x140): a cabinet door swings on its hinge — the three hinge
// essentials are annotated directly: origin dot O, axis pin A, range arc L.
const W = 560;
const H = 140;
const T = 3600; // full loop (ms)

export const Ch4Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const CX = 250; // cabinet left edge = hinge line
    const CY = 28;
    const CW = 132;
    const CH = 88;
    const MAXD = 75; // max opening angle (deg)

    const render = (time: number) => {
      const t = (time / T) % 1;
      // cosine profile: 0 → MAX → 0, zero velocity at both ends, seamless wrap
      const open = ((1 - Math.cos(t * Math.PI * 2)) / 2) * MAXD;
      const rad = (open * Math.PI) / 180;
      const wApp = Math.max(CW * Math.cos(rad), 2); // foreshortened width
      const lift = 14 * Math.sin(rad); // free edge drifts up (oblique view)

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);

      // cabinet body + interior (revealed as the door opens)
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(CX, CY, CW, CH);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(CX + 8, CY + 8, CW - 16, CH - 16);

      // door: hinged along the cabinet's left edge, foreshortens as it opens
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + wApp, CY - lift);
      ctx.lineTo(CX + wApp, CY + CH - lift);
      ctx.lineTo(CX, CY + CH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // handle knob rides the door's free edge
      ctx.fillStyle = '#d7deea';
      ctx.beginPath();
      ctx.arc(CX + wApp - 10, CY + CH / 2 - lift, 4, 0, Math.PI * 2);
      ctx.fill();

      // A: axis pin along the hinge edge (blue), through the origin
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(CX, CY - 8);
      ctx.lineTo(CX, CY + CH + 8);
      ctx.stroke();
      // O: hinge origin dot (orange) on the pin
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(CX, CY + CH / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // L: range arc (green) at the top hinge corner, marking 0–75° envelope
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CX, CY, 34, -(MAXD * Math.PI) / 180, 0);
      ctx.stroke();

      // annotations
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#f07e47';
      ctx.fillText('O', CX - 18, CY + CH / 2 + 4);
      ctx.fillStyle = '#27446e';
      ctx.fillText('A', CX - 5, CY - 14);
      ctx.fillStyle = '#228d5c';
      ctx.fillText('L', CX + 40, CY - 20);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

export default Ch4Ana;
