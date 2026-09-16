import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10 analogy (560x140): acceptance test — the finished door opens/closes twice, green badge stamped.
const W = 560;
const H = 140;

export const Ch10Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (time / 4000) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);
      // cabinet body + interior (revealed as the door swings open)
      const CX = 240;
      const CY = 26;
      const CW = 130;
      const CH = 88;
      const DX = CX + 8; // door rect = front face inset; left edge = hinge line
      const DY = CY + 8;
      const DW = CW - 16;
      const DH = CH - 16;
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(CX, CY, CW, CH);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(DX, DY, DW, DH);
      // door swings open/closed twice; cosine profile → zero velocity at both
      // ends of every swing (no bounce kink), closed at loop start AND end.
      const cyc = clamp(t / 0.68, 0, 1);
      const swing = (1 - Math.cos(cyc * Math.PI * 4)) / 2; // two full open-close cycles
      // pivots on its LEFT edge: width foreshortens with cos(angle), free edge
      // lifts slightly (oblique depth) — a true hinge rotation, never a shear.
      const MAXD = 70;
      const rad = (swing * MAXD * Math.PI) / 180;
      const wApp = Math.max(DW * Math.cos(rad), 3);
      const lift = 10 * Math.sin(rad);
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.moveTo(DX, DY);
      ctx.lineTo(DX + wApp, DY - lift);
      ctx.lineTo(DX + wApp, DY + DH - lift);
      ctx.lineTo(DX, DY + DH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // handle knob rides the door's free edge
      ctx.fillStyle = '#d7deea';
      ctx.beginPath();
      ctx.arc(DX + wApp - 8, DY + DH / 2 - lift, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // two visible hinge knuckles on the pivot edge (over the door)
      ctx.fillStyle = '#228d5c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (const hy of [DY + 6, DY + DH - 6]) {
        ctx.beginPath();
        ctx.arc(DX, hy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      // faint sweep arc marking the opening envelope at the top hinge
      ctx.strokeStyle = 'rgba(34,141,92,0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(DX, DY, 20, (-MAXD * Math.PI) / 180, 0);
      ctx.stroke();
      // hinge label in the empty space left of the cabinet
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('铰链', DX - 38, DY + DH / 2 + 4);
      // stamp eases in after the swings, then fades out before the loop restarts
      const sp = t > 0.72 ? easeOutCubic(clamp((t - 0.72) / 0.14, 0, 1)) : 0;
      const sAlpha = t > 0.94 ? 1 - (t - 0.94) / 0.06 : 1;
      if (sp > 0 && sAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = sAlpha;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(430, 56, 20 * sp, 0, Math.PI * 2);
        ctx.stroke();
        const textA = clamp((sp - 0.6) / 0.4, 0, 1);
        if (textA > 0) {
          ctx.globalAlpha = sAlpha * textA;
          ctx.fillStyle = '#228d5c';
          ctx.font = 'bold 16px "Segoe UI", sans-serif';
          ctx.fillText('✓', 423, 62);
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText('合格', 418, 92);
        }
        ctx.restore();
      }
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

export default Ch10Ana;
