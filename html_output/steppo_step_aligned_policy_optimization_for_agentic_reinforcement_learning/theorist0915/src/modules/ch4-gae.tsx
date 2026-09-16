import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoad, drawCar, drawFlag, drawLabel, drawLegend } from './roadKit';

const W = 1080, H = 280;
export const Ch4Gae: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ gamma: 0.99 });
  const [gamma, setGamma] = useState(0.99);
  const [fb, setFb] = useState({ text: '调节 γ，观察延迟奖励在 token 轴与步轴上的衰减差异。', cls: '' });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const g = stateRef.current.gamma;
      clearScene(ctx, W, H);
      drawRoad(ctx, 210, W);
      drawCar(ctx, 200, 202, C.blue);
      drawFlag(ctx, W - 70, 190, C.orange);
      drawLabel(ctx, '终点奖励在这里才到', W - 220, 170, C.orange);
      const signal = Math.pow(g, 8);
      ctx.fillStyle = C.orange;
      ctx.fillRect(40, 40, 20, 120 * signal + 10);
      drawLabel(ctx, '传回的延迟信号', 70, 60, C.muted);

      // technical curves
      ctx.strokeStyle = C.axis; ctx.strokeRect(320, 30, 700, 150);
      drawLabel(ctx, '优势衰减', 340, 55, C.muted);
      const drawCurve = (color: string, steps: number, labelX: number) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const x = 340 + i * 16;
          const decay = Math.pow(g, (i / 40) * steps);
          const y = 160 - decay * 100;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawCurve(C.red, 80, 0); // token-like long chain
      drawCurve(C.green, 8, 0); // step chain
      drawLegend(ctx, [
        { color: C.red, label: 'token 链' },
        { color: C.green, label: '步链' },
        { color: C.orange, label: '延迟信号' },
      ], 340, 200);
      const dropTok = (1 - Math.pow(g, 80)) * 100;
      const dropStep = (1 - Math.pow(g, 8)) * 100;
      drawLabel(ctx, dropStep.toFixed(0), 900, 70, C.green);
      drawLabel(ctx, dropTok.toFixed(0), 900, 95, C.red);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>折扣 γ <span className="val">{gamma.toFixed(2)}</span></label>
        <input type="range" min={90} max={99} value={Math.round(gamma * 100)}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            stateRef.current.gamma = v; setGamma(v);
            setFb({
              text: v < 0.95
                ? 'γ 偏低时，token 长链上的延迟奖励几乎消失；步链仍保留更多信号。'
                : v > 0.98
                ? 'γ 接近 1，两条链都还能传回奖励，但步级更贴合决策边界。'
                : '中等 γ：步级衰减更缓，利于多轮稀疏奖励。',
              cls: v < 0.95 ? 'bad' : v > 0.98 ? 'good' : '',
            });
          }} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch4Gae;
