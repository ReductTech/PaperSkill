import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';

type WidgetProps = { chapterId: string; moduleId: string };

function useCanvas(draw: (ctx: CanvasRenderingContext2D) => void, deps: React.DependencyList) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 140);
    draw(ctx);
    return observeCanvas(canvas, () => draw(ctx), () => undefined);
  }, deps);
  return ref;
}

export function OPDScene({ chapterId, moduleId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => { setTick((v) => (v + 1) % 240); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 140);
    const old = moduleId === 'old';
    const t = tick / 240;
    ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, 560, 140);
    ctx.fillStyle = '#b8c9a7'; ctx.fillRect(32, 92, 496, 24);
    ctx.fillStyle = '#21324a';
    for (let i = 0; i < 12; i++) { ctx.fillRect(42 + i * 40, 92, 36, 24); }
    ctx.fillStyle = '#21324a'; ctx.font = '12px sans-serif'; ctx.fillText(old ? '固定示范' : '学生轨迹', 18, 20);
    const x = 44 + ((t * 11) % 11) * 40;
    ctx.fillStyle = old ? '#c43f52' : '#27446e'; ctx.beginPath(); ctx.arc(x, 82, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = old ? '#c43f52' : '#228d5c'; ctx.beginPath(); ctx.arc(old ? 480 : x, 72, 7, 0, Math.PI * 2); ctx.fill();
    if (!old) { ctx.strokeStyle = '#228d5c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 82); ctx.lineTo(x, 72); ctx.stroke(); }
  }, [tick, moduleId]);
  return <canvas ref={canvasRef} width={560} height={140} className="is-ready" aria-label="学生轨迹与教师目标的动画" />;

}
