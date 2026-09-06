import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', text: '#21324a', muted: '#68778f', line: '#d7deea',
};

function scene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 420, 180);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 420, 180);
  ctx.fillStyle = C.light; ctx.fillRect(0, 138, 420, 42);
  ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 138); ctx.lineTo(420, 138); ctx.stroke();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, blur: number, color: string) {
  ctx.save();
  ctx.globalAlpha = .14; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 7 + blur, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.lineTo(x + 11, y); ctx.moveTo(x, y - 11); ctx.lineTo(x, y + 11); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, Math.max(2.5, 6 - blur * .18), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, weight = 700) {
  ctx.fillStyle = color; ctx.font = `${weight} 13px "PingFang SC", sans-serif`; ctx.fillText(text, x, y);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 10, y2 - 6); ctx.lineTo(x2 - 10, y2 + 6); ctx.closePath(); ctx.fill();
}

function drawOld(ctx: CanvasRenderingContext2D, p: number) {
  const step = Math.min(3, Math.floor(p * 4));
  const local = easeInOutQuad((p * 4) % 1);
  const xs = [52, 138, 224, 310, 368];
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.setLineDash([7, 7]);
  ctx.beginPath(); ctx.moveTo(xs[0], 72); ctx.lineTo(xs[4], 72); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i <= step ? C.blue : '#fff'; ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(xs[i + 1], 72, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    label(ctx, `${i + 1}`, xs[i + 1] - 4, 104, C.muted, 600);
  }
  const x = xs[step] + (xs[step + 1] - xs[step]) * local;
  star(ctx, x, 72, 15 - (step + local) * 3, C.blue);
  label(ctx, `第 ${step + 1}/4 次模型校正`, 132, 127, C.blue);
  label(ctx, '四次网络前向 · 逐步修正', 118, 160, C.text);
}

function drawNew(ctx: CanvasRenderingContext2D, p: number) {
  const jump = easeInOutQuad(Math.min(1, Math.max(0, (p - .18) / .38)));
  star(ctx, 62, 72, 16, C.muted);
  arrow(ctx, 88, 72, 337, 72, C.green);
  const x = 62 + 306 * jump;
  star(ctx, x, 72, 16 * (1 - jump), C.green);
  ctx.fillStyle = C.green; ctx.globalAlpha = .14 * Math.max(0, 1 - Math.abs(p - .55) * 4);
  ctx.beginPath(); ctx.arc(368, 72, 30, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  label(ctx, jump < 1 ? '一次直接跃迁' : '一步到达清晰终点', 136, 127, C.green);
  label(ctx, '一次网络前向 · 平均速度直达', 104, 160, C.text);
}

const epoch = typeof performance === 'undefined' ? 0 : performance.now();

export const DmfHero: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || chapterId !== 'hero') return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, 420, 180); } catch { return; }
    let raf: number | null = null;
    const frame = (now: number) => {
      const p = ((now - epoch) % 4200) / 4200;
      scene(ctx);
      if (moduleId === 'old') drawOld(ctx, p); else drawNew(ctx, p);
      canvas.classList.add('is-ready'); raf = requestAnimationFrame(frame);
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(frame); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [chapterId, moduleId]);
  return <canvas ref={canvasRef} aria-hidden="true" />;
};
