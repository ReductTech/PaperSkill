import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 360;
const H = 150;

export const HeroMapWidget: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    let raf = 0;
    const isNew = moduleId === 'new';
    const render = (t: number) => {
      const p = (Math.sin(t / 900) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#b8c9a7';
      ctx.lineWidth = 1;
      for (let x = 30; x < W; x += 44) {
        ctx.beginPath(); ctx.moveTo(x, 15); ctx.lineTo(x + 10, H - 16); ctx.stroke();
      }
      ctx.font = '13px Segoe UI, sans-serif';
      ctx.fillStyle = '#21324a';
      ctx.fillText(isNew ? '显式路线图' : '一张提示纸条', 18, 24);
      if (isNew) {
        const pts = [[40,110],[105,78],[166,105],[230,58],[310,82]];
        ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); pts.forEach(([x,y], i)=> i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
        ctx.strokeStyle = '#228d5c'; ctx.lineWidth = 4;
        ctx.beginPath(); pts.forEach(([x,y], i)=> {
          const upto = Math.floor(p * (pts.length - 1));
          if (i === 0) ctx.moveTo(x,y); else if (i <= upto + 1) ctx.lineTo(x,y);
        }); ctx.stroke();
        pts.forEach(([x,y], i)=>{ ctx.fillStyle = i === 0 ? '#27446e' : i === pts.length - 1 ? '#228d5c' : '#fff'; ctx.strokeStyle = '#27446e'; ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.fill(); ctx.stroke();});
        ctx.fillStyle = '#d97706'; ctx.fillRect(302, 50, 10, 24);
      } else {
        ctx.strokeStyle = '#c43f52'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(55, 105);
        for (let i = 0; i < 6; i++) ctx.bezierCurveTo(85+i*25, 45+i*7, 95+i*25, 125-i*8, 118+i*25, 82);
        ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#c43f52'; ctx.lineWidth = 2; ctx.fillRect(48, 50, 190, 34); ctx.strokeRect(48, 50, 190, 34);
        ctx.fillStyle = '#c43f52'; ctx.fillText('检索 + 路由 + 聚合？', 62, 72);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [moduleId]);
  return <canvas ref={ref} width={W} height={H} />;
};
