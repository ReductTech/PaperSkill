import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCanoe, drawLookaheadArrow, drawTarget, drawLabel, drawLegend } from './river-kit';

// §1 Module 1.2: synchronized before/after — same beta, standard vs EMA lookahead.
// Two equal panels share one start timestamp (paper Fig 2: red solid vs green dashed).

const W = 540;
const H = 280;

export const W1EmaRepair: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ beta: 0.1, start: -1, time: 0, running: false });
  const [beta, setBeta] = useState(0.1);
  const [fb, setFb] = useState({ text: '拖动 β 后按下按钮：两艘船同一起点、同一时间基准出发。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      const s = stateRef.current;
      clearScene(ctx, W, H);
      drawRiver(ctx, W, H, 0.4, 0.35);
      // divider
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      // wave sequence shared by both panels
      const waveAt = (tt: number) => Math.sin(tt * 4) * 0.6 + Math.sin(tt * 9.3) * 0.4;
      const tRun = s.running ? Math.min(1.6, s.time - s.start) : 0;
      // left panel: standard lookahead
      {
        const px = 90 + (W / 2 - 170) * Math.min(1, tRun / 1.6);
        const py = 120;
        const wv = waveAt(s.time);
        const len = 30 + s.beta * 160;
        drawLookaheadArrow(ctx, px, py, len, -0.5 * len + wv * 40, C.red, 3.5);
        drawCanoe(ctx, px, py, -0.08, C.red, 0.85);
        drawLabel(ctx, '标准前瞻', 20, 36, C.red);
      }
      // right panel: EMA lookahead (gamma=0.995 -> smoothed trend)
      {
        const px = W / 2 + 90 + (W / 2 - 170) * Math.min(1, tRun / 1.6);
        const py = 120;
        const smooth = Math.sin(s.time * 1.1) * 0.12; // low-pass residual
        const len = 30 + s.beta * 160;
        drawLookaheadArrow(ctx, px, py, len, smooth * 60, C.green, 3.5);
        drawCanoe(ctx, px, py, 0.02, C.green, 0.85);
        drawLabel(ctx, 'EMA 前瞻', W / 2 + 20, 36, C.green);
      }
      drawTarget(ctx, W - 46, H * 0.55);
      drawLegend(ctx, [[C.red, '旧方向'], [C.green, 'EMA 方向']], 24, H - 14);
    };
    const tick = () => {
      stateRef.current.time += 1 / 60;
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stopRaf = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    }, stopRaf);
    return () => {
      stopRaf();
      disconnect();
    };
  }, []);

  const start = () => {
    stateRef.current.start = stateRef.current.time;
    stateRef.current.running = true;
    const b = stateRef.current.beta;
    const lStd = (4.78 + 0.9 * b * b + 0.55 * b ** 4).toFixed(2);
    const lEma = (4.79 + 0.05 * b * b).toFixed(2);
    setFb({
      text: `同一 β=${b.toFixed(2)}：标准前瞻位置损失 ${lStd}（探上高岸），EMA 前瞻位置损失 ${lEma}（仍在河道内）。`,
      cls: 'good',
    });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <label>
          前瞻步长 β <span className="val">{beta.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={10}
          max={90}
          value={Math.round(beta * 100)}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            stateRef.current.beta = v;
            setBeta(v);
          }}
        />
        <button onClick={start}>同时出发</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W1EmaRepair;
