import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 analogy (560x140): a 2D-mask stencil presses onto the cabinet face; the
// face is divided into matching parts — coarse 2x2 grid crossfades into a fine
// 4x4 grid and back, looping. No free-floating shapes: the stencil is always
// either seated on the cabinet or visibly approaching/leaving it.
const W = 560;
const H = 140;
const T = 4400; // full loop (ms)

export const Ch5Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const CX = 200; // cabinet
    const CY = 36;
    const CW = 220;
    const CH = 80;

    const render = (time: number) => {
      const t = (time / T) % 1;
      // timeline: stencil descends 0–0.25 → seated hold 0.25–0.8 (grid density
      // breathes coarse→fine→coarse) → lifts away 0.8–1.0, so the last frame
      // matches the first (stencil away, bare cabinet) — seamless wrap
      const descend = easeInOutQuad(clamp(t / 0.25, 0, 1));
      const lift = easeInOutQuad(clamp((t - 0.8) / 0.2, 0, 1));
      const seat = descend * (1 - lift); // 1 = stencil fully pressed on
      // density mix: 0 = coarse 2x2, 1 = fine 4x4 (cosine breath, zero
      // velocity at both ends, symmetric so the hold loops without a pop)
      const k = t > 0.25 && t < 0.8 ? (1 - Math.cos(((t - 0.25) / 0.55) * Math.PI * 2)) / 2 : 0;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);

      // cabinet body (wood brown)
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(CX, CY, CW, CH);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(CX + 6, CY + 6, CW - 12, CH - 12);

      // grid the mask imprints on the cabinet face: coarse lines fade out as
      // fine lines fade in (green = PhysForge's correct part split)
      const gridLines = (n: number, alpha: number) => {
        if (alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 1; i < n; i++) {
          const gx = CX + 6 + ((CW - 12) * i) / n;
          const gy = CY + 6 + ((CH - 12) * i) / n;
          ctx.moveTo(gx, CY + 6);
          ctx.lineTo(gx, CY + CH - 6);
          ctx.moveTo(CX + 6, gy);
          ctx.lineTo(CX + CW - 6, gy);
        }
        ctx.stroke();
        ctx.restore();
      };
      gridLines(2, seat * (1 - k));
      gridLines(4, seat * k);

      // stencil plate: same footprint as the cabinet face; glides down from
      // above-left while approaching and lifts straight off when leaving
      const sx = CX + (1 - seat) * -16;
      const sy = CY + (1 - seat) * -48;
      const plateA = clamp(descend * 1.4, 0, 1) * (1 - lift);
      ctx.save();
      ctx.globalAlpha = plateA;
      ctx.fillStyle = 'rgba(39,68,110,0.14)';
      ctx.fillRect(sx, sy, CW, CH);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, CW, CH);
      ctx.fillStyle = '#27446e';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('2D 掩码模板', sx + 6, sy - 6);
      ctx.restore();

      // density labels crossfade with the grid mix, right-aligned inside canvas edge
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      if (seat * (1 - k) > 0.02) {
        ctx.save();
        ctx.globalAlpha = seat * (1 - k);
        ctx.fillStyle = '#228d5c';
        ctx.textAlign = 'right';
        ctx.fillText('粗粒度 2×2', 552, 64);
        ctx.fillText('→ 4 个零件', 552, 84);
        ctx.restore();
      }
      if (seat * k > 0.02) {
        ctx.save();
        ctx.globalAlpha = seat * k;
        ctx.fillStyle = '#228d5c';
        ctx.textAlign = 'right';
        ctx.fillText('细粒度 4×4', 552, 64);
        ctx.fillText('→ 16 个零件', 552, 84);
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

export default Ch5Ana;
