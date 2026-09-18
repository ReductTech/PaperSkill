import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, COLORS, drawDrop, drawPipe } from './aiflow-shared';
import type { WidgetProps } from './registry';

const W = 520;
const H = 200;

export const HeroOld: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      drawPipe(ctx, 40, 30, 40, 150, 12);
      ctx.fillStyle = COLORS.lightEnv;
      ctx.fillRect(30, 145, 60, 40);
      const fillH = (Math.sin(t * 0.02) * 0.5 + 0.5) * 35;
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(32, 180 - fillH, 56, fillH);
      for (let i = 0; i < 5; i++) {
        const dy = ((t * 1.5 + i * 30) % 120);
        drawDrop(ctx, 40, 30 + dy, 3, COLORS.blue);
      }
      ctx.fillStyle = COLORS.red;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('等待全部累积后处理', W / 2, 20);
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('TTFPT = 等待全部完成', W / 2, 195);
      tRef.current += 1;
    };

    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export const HeroNew: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      drawPipe(ctx, 40, 30, 40, 60, 12);
      for (let i = 0; i < 3; i++) {
        const dy = ((t * 2 + i * 40) % 30);
        drawDrop(ctx, 40, 30 + dy, 3, COLORS.green);
      }
      const branches = [
        { x: 40, y: 60, x2: 150, y2: 120, color: COLORS.green, label: '推理' },
        { x: 40, y: 60, x2: 280, y2: 100, color: COLORS.orange, label: '回答' },
        { x: 40, y: 60, x2: 400, y2: 140, color: COLORS.purple, label: '安全标签' },
      ];
      branches.forEach((b) => {
        drawPipe(ctx, b.x, b.y, b.x2, b.y2, 8);
        const phase = (t * 0.03) % 1;
        const dx = b.x + (b.x2 - b.x) * phase;
        const dy2 = b.y + (b.y2 - b.y) * phase;
        drawDrop(ctx, dx, dy2, 4, b.color);
        ctx.fillStyle = b.color;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.label, b.x2, b.y2 + 20);
      });
      ctx.fillStyle = COLORS.green;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('令牌到达即分流处理', W / 2, 20);
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('TTFPT = 首令牌到达即处理', W / 2, 195);
      tRef.current += 1;
    };

    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};
