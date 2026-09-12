import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTrail, drawLegend, type Pt } from './dogKit';
import type { WidgetProps } from './registry';

// §7 analogy card — 反复陪练: the dog rehearses one fixed loop around two cones.
// Green trail residue from the earlier laps fades slowly and the gait (trail
// jitter) steadies with each lap — fine-tuning trains the route, not a new dog.
const W = 560;
const H = 140;
const LOOP = 3200;
const LAPS = 3;
const CX = 280;
const CY = 82;
const RX = 178;
const RY = 26;
const JIT = [7, 3.5, 1.2]; // wobble amplitude per lap — steadier each lap

export const Ch7Analogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const A0 = -Math.PI / 2;

    const lapPoint = (lap: number, ang: number): Pt => {
      const jit = JIT[Math.min(lap, LAPS - 1)];
      const wob = Math.sin(ang * 3 + lap * 2.1) * jit;
      return {
        x: CX + (RX + wob) * Math.cos(ang),
        y: CY + (RY + wob * 0.5) * Math.sin(ang),
      };
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      const lap = Math.min(Math.floor(t * LAPS), LAPS - 1);
      const frac = t * LAPS - lap;
      const ang = A0 + frac * Math.PI * 2;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // the fixed rehearsal route (faint guide)
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // two training cones
      [CX - 64, CX + 64].forEach((x) => {
        ctx.fillStyle = C.orange;
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(x, CY - 10);
        ctx.lineTo(x - 7, CY + 8);
        ctx.lineTo(x + 7, CY + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      // fading green residue of the earlier laps
      for (let k = 1; k <= lap; k++) {
        const prev: Pt[] = [];
        for (let i = 0; i <= 36; i++) prev.push(lapPoint(lap - k, A0 + (i / 36) * Math.PI * 2));
        ctx.save();
        ctx.globalAlpha = k === 1 ? 0.32 : 0.14;
        drawTrail(ctx, prev, C.green, false);
        ctx.restore();
      }
      // current lap trail
      const pts: Pt[] = [];
      const n = Math.max(2, Math.ceil(frac * 36));
      for (let i = 0; i <= n; i++) pts.push(lapPoint(lap, A0 + (i / 36) * Math.PI * 2));
      ctx.save();
      ctx.globalAlpha = 0.75;
      drawTrail(ctx, pts, C.green, false);
      ctx.restore();
      // the rehearsing dog
      const p = lapPoint(lap, ang);
      drawDog(ctx, p.x, p.y + 6, 0.55, { mood: 'walk', t: ms / 600, flip: -Math.sin(ang) < 0 });
      drawLegend(ctx, [['锥桶', C.orange], ['练习轨迹', C.green]], 14, H - 14);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch7Analogy;
