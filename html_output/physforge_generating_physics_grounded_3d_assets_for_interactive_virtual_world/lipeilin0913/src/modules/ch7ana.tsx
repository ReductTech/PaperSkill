import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 analogy (560x140): on the cabinet door, concentric target rings mark the
// hinge-hole position; a pointer needle oscillates with decaying amplitude and
// settles dead-center (λ_kine = 10 — joint error is supervised 10x harder).
// Amplitude eases back before the wrap so the loop is seamless.
const W = 560;
const H = 140;
const T = 4200; // full loop (ms)

export const Ch7Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const TX = 418; // target center (hinge hole on the door face)
    const TY = 70;
    const A0 = 26; // starting wobble amplitude (px)

    const render = (time: number) => {
      const t = (time / T) % 1;
      // amplitude: decays 0–0.55 → dwell centered 0.55–0.75 → eases back
      // 0.75–1.0; oscillation is driven by absolute time, so the wrap frame
      // matches the first (full amplitude, same phase) — no pop
      let amp: number;
      if (t < 0.55) amp = A0 * (1 - easeInOutQuad(t / 0.55));
      else if (t < 0.75) amp = 0;
      else amp = A0 * easeInOutQuad((t - 0.75) / 0.25);
      const off = Math.cos(time / 110) * amp;
      const nx = TX + off;

      // alignment glow: fades in as the needle seats, out before wobble returns
      let al = 0;
      if (t >= 0.55 && t < 0.62) al = easeOutCubic((t - 0.55) / 0.07);
      else if (t >= 0.62 && t < 0.8) al = 1;
      else if (t >= 0.8 && t < 0.95) al = 1 - easeInOutQuad((t - 0.8) / 0.15);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);

      // cabinet (wood browns): body frame + door front face
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(300, 26, 220, 90);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(308, 34, 204, 74);

      // concentric target rings + green bullseye at the hinge-hole position
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 2;
      [26, 17, 8].forEach((r) => {
        ctx.beginPath();
        ctx.arc(TX, TY, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.arc(TX, TY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // faint dashed sweep line showing the needle's oscillation extent
      ctx.strokeStyle = 'rgba(33,50,74,0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(TX - A0, TY);
      ctx.lineTo(TX + A0, TY);
      ctx.stroke();
      ctx.setLineDash([]);

      // soft contact shadow under the needle tip
      ctx.fillStyle = 'rgba(33,50,74,0.18)';
      ctx.beginPath();
      ctx.ellipse(nx, TY + 2, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // pointer needle: shaft from above, tip seating on the bullseye
      ctx.fillStyle = '#27446e';
      ctx.fillRect(nx - 2.5, 12, 5, 48);
      ctx.beginPath();
      ctx.moveTo(nx - 6, 58);
      ctx.lineTo(nx + 6, 58);
      ctx.lineTo(nx, TY);
      ctx.closePath();
      ctx.fill();

      // alignment glow ring + check label (green = PhysForge correct)
      if (al > 0) {
        ctx.save();
        ctx.globalAlpha = al;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(TX, TY, 31, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('✓ 孔位对准', 460, 44);
        ctx.restore();
      }

      // annotations (terms from the §7 text)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('λ_kine = 10', 20, 34);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('关节误差 ×10 较真', 20, 52);
      ctx.fillText('铰链孔位（靶心）', 300, 132);

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

export default Ch7Ana;
