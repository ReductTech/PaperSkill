import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

export const MapAnalogyWidget: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const n = Number((chapterId.match(/\d+/) || ['1'])[0]);
    let raf = 0;
    const render = (t: number) => {
      const p = (Math.sin(t / 650 + n) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#b8c9a7'; ctx.lineWidth = 1;
      for (let y = 20; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(W - 8, y + Math.sin(y) * 4); ctx.stroke(); }
      const pts = [[24,96],[70,70],[116,90],[162,48],[214,64]];
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); pts.forEach(([x,y],i)=> i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
      const upto = Math.min(pts.length - 1, Math.floor(p * (pts.length - 1)) + 1);
      ctx.strokeStyle = n % 3 === 0 ? '#27446e' : n % 3 === 1 ? '#228d5c' : '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath(); pts.forEach(([x,y],i)=> { if (i === 0) ctx.moveTo(x,y); else if (i <= upto) ctx.lineTo(x,y); }); ctx.stroke();
      const [hx, hy] = pts[Math.min(upto, pts.length - 1)];
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#228d5c'; ctx.beginPath(); ctx.moveTo(214, 42); ctx.lineTo(214, 72); ctx.lineTo(228, 54); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#21324a'; ctx.font = '12px Segoe UI, sans-serif';
      const labels = ['路线', '路标', '检查', '分离', '路由', '存档', '谱系', '盖章', '系统', '终点'];
      ctx.fillText(labels[(n - 1) % labels.length], 16, 20);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [chapterId]);
  return <canvas ref={ref} width={W} height={H} />;
};
