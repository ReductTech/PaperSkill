import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCanoe, drawLookaheadArrow, drawLabel } from './river-kit';

// §5 Module 5.1: chips switch the direction source (K-step unweighted MA vs EMA);
// a U-valley bend replay shows lag angle and lag distance (paper Fig 3 left, eq 7).

const W = 1080;
const H = 280;
const MODES = ['K=8', 'K=32', 'K=128', 'EMA γ=0.99'] as const;
// lag after the bend (illustrative of Fig 3 left; grows with K, small for EMA)
const LAG: Record<string, number> = { 'K=8': 0.3, 'K=32': 0.62, 'K=128': 0.85, 'EMA γ=0.99': 0.12 };

export const W5HorizonLag: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ mode: 'K=32', t0: 0 });
  const [mode, setMode] = useState<string>('K=32');
  const [fb, setFb] = useState({ text: '无加权平均：转弯后仍按旧航向前探。', cls: 'bad' });

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
      const s = stateRef.current;
      const replay = Math.min(1, (time - s.t0) / 1.6); // 0..1 progress after the bend
      const lag = LAG[s.mode];
      const isEma = s.mode.startsWith('EMA');
      clearScene(ctx, W, H);
      // U-valley: left straight, bend in middle, right straight going up
      drawRiver(ctx, W, H, 0.55, 0);
      ctx.fillStyle = C.waterLight;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);
      ctx.strokeStyle = C.waterDeep;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.55);
      ctx.lineTo(W, H * 0.55);
      ctx.stroke();
      // channel path with a bend
      const pathY = (x: number) => {
        if (x < W * 0.45) return H * 0.78;
        if (x > W * 0.62) return H * 0.58;
        const t = (x - W * 0.45) / (W * 0.17);
        return H * 0.78 - (H * 0.2) * (t * t * (3 - 2 * t));
      };
      ctx.strokeStyle = C.blue;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        if (x === 0) ctx.moveTo(x, pathY(x));
        else ctx.lineTo(x, pathY(x));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      const px = W * 0.52;
      const py = pathY(px);
      // heading lines: stale direction (fixed angle) vs adaptive
      const staleAngle = -0.32;
      const trendAngle = -0.12;
      if (isEma) {
        // adapts within 2-3 steps: angle interpolates quickly to trend
        const ang = staleAngle + (trendAngle - staleAngle) * Math.min(1, replay * 2.4);
        drawLookaheadArrow(ctx, px, py, 150 * Math.cos(ang), 150 * Math.sin(ang), C.green, 4);
      } else {
        // unweighted MA keeps the stale heading, decaying slowly with K
        const decay = Math.max(0, 1 - (replay * 0.35 * 32) / (8 * parseInt(s.mode.slice(2))));
        const ang = staleAngle * decay + trendAngle * (1 - decay);
        drawLookaheadArrow(ctx, px, py, 150 * Math.cos(ang), 150 * Math.sin(ang), C.purple, 4);
      }
      // true trend line
      ctx.strokeStyle = C.blue;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 190, py + 190 * trendAngle);
      ctx.stroke();
      ctx.setLineDash([]);
      drawCanoe(ctx, px, py, trendAngle * 0.4, C.blue, 0.85);
      // lag indicator
      const lagDeg = Math.round(Math.abs(staleAngle - trendAngle) * lag * 180 / Math.PI + (isEma ? 0 : 6));
      drawLabel(ctx, `滞后 ${lagDeg}°`, px + 160, py - 46, isEma ? C.green : C.red, 15);
      drawLabel(ctx, '趋势', px + 190, py + 190 * trendAngle - 8, C.blue, 13);
    };
    const tick = () => {
      render(stateRef.current.t0 === 0 ? 1.6 : (performance.now() - stateRef.current.t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stopRaf = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // simple always-on loop is fine here (small canvas); still add is-ready
    start();
    return stopRaf;
  }, []);

  const pick = (m: string) => {
    stateRef.current.mode = m;
    stateRef.current.t0 = performance.now();
    setMode(m);
    if (m.startsWith('EMA')) setFb({ text: `EMA：转弯后 2–3 步内跟上新趋势（几何权重自适应）。`, cls: 'good' });
    else setFb({ text: `${m}：无加权平均（式7），趋势转弯后滞后明显、不自适应。`, cls: 'bad' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        {MODES.map((m) => (
          <button key={m} className={m === mode ? 'chip active' : 'chip'} onClick={() => pick(m)}>
            {m}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W5HorizonLag;
