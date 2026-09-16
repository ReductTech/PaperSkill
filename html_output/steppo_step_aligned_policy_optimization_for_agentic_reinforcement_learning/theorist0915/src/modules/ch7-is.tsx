import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoad, drawCar, drawFlag, drawLabel, drawLegend } from './roadKit';

const W = 1080, H = 280;
export const Ch7Is: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [len, setLen] = useState(6);
  const dragging = useRef(false);
  const [fb, setFb] = useState({ text: '拖动动作长度：步级比率 = token 比率连乘；信用仍落在整步。', cls: '' });
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      clearScene(ctx, W, H);
      drawRoad(ctx, 210, W);
      const L = len;
      ctx.fillStyle = C.blue;
      ctx.fillRect(120, 160, 40 + L * 28, 40);
      drawCar(ctx, 100, 202, C.blue);
      drawFlag(ctx, W - 70, 190);
      const tokenRatio = 1.08;
      const prod = Math.pow(tokenRatio, L);
      const clipped = clamp(prod, 0.8, 1.2);
      ctx.fillStyle = C.axis; ctx.fillRect(500, 50, 500, 18); ctx.fillRect(500, 100, 500, 18);
      ctx.fillStyle = C.orange; ctx.fillRect(500, 50, clamp(Math.log(prod + 1) * 90, 0, 500), 18);
      ctx.fillStyle = C.green; ctx.fillRect(500, 100, clamp((clipped - 0.8) / 0.4 * 500, 0, 500), 18);
      drawLabel(ctx, `w_t≈${prod.toFixed(2)}`, 520, 40, C.orange);
      drawLabel(ctx, `clip(w_t)≈${clipped.toFixed(2)}`, 520, 90, C.green);
      drawLegend(ctx, [
        { color: C.orange, label: '步级连乘比率' },
        { color: C.green, label: '裁剪后比率' },
        { color: C.blue, label: '动作长度 L' },
      ], 40, 250);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const onPtr = (e: PointerEvent) => {
      if (!dragging.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const v = clamp(Math.round((x - 120) / 28), 2, 16);
      setLen(v);
      setFb({
        text: v > 10
          ? '长动作使连乘比率变大，但仍用步级 w_t 进入裁剪目标（论文 §5.1–5.2）。'
          : '步级比率可因式分解到 token；改变的是信用单位，不是放弃分词。',
        cls: v > 10 ? '' : 'good',
      });
    };
    canvas.addEventListener('pointerdown', (e) => { dragging.current = true; canvas.setPointerCapture(e.pointerId); onPtr(e); });
    canvas.addEventListener('pointermove', onPtr);
    canvas.addEventListener('pointerup', () => { dragging.current = false; });
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [len]);
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ cursor: 'grab' }} />
      <div className="ctrl">
        <label>动作长度 L <span className="val">{len}</span></label>
        <input type="range" min={2} max={16} value={len} onChange={(e) => {
          const v = Number(e.target.value); setLen(v);
          setFb({
            text: v > 10
              ? '连乘形式保留 token 似然；演员目标在步级比率上裁剪。'
              : '论文强调：不放弃 token 因式分解，但把责任对齐到交互步。',
            cls: 'good',
          });
        }} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch7Is;
