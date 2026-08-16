import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export function HeroFlow({ moduleId }: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, 250, 142); let raf = 0; let visible = false;
    const draw = (time: number) => {
      ctx.clearRect(0, 0, 250, 142); ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, 250, 142);
      ctx.strokeStyle = '#b8c9a7'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, 230, 122);
      const t = (time % 3000) / 3000; const isOld = moduleId === 'old';
      const points = isOld ? [[28,94],[78,52],[126,88],[176,46],[215,78]] : [[28,94],[78,52],[126,88],[176,46],[215,78],[145,112],[82,106]];
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
      ctx.strokeStyle = isOld ? '#c43f52' : '#228d5c'; ctx.lineWidth = 4; ctx.stroke();
      const position = Math.min(points.length - 1, Math.floor(t * points.length)); const [x,y] = points[position];
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(x,y,8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#21324a'; ctx.font = '12px sans-serif'; ctx.fillText(isOld ? '失败后停止' : '失败 → 经验 → 下一轮', 22, 28);
      if (visible) raf = requestAnimationFrame(draw);
    };
    const stop = () => { visible = false; cancelAnimationFrame(raf); };
    const start = () => { if (!visible) { visible = true; raf = requestAnimationFrame(draw); } };
    const disconnect = observeCanvas(canvas, start, stop); start(); return () => { stop(); disconnect(); };
  }, [moduleId]);
  return <canvas ref={ref} className="arc-canvas hero-flow-canvas" aria-label="研究流程对比动画" />;
}