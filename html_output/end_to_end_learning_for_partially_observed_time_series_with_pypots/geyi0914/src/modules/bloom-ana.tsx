import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { SCENE, drawKettle, drawDripper, drawBed, drawSharePot, drawCounter } from './pots-kit';

// §4 绕圈注水：壶嘴绕小圈移动，水均匀落在粉层上；粉层里的洞随注水形态缓慢重排。
const W = 560;
const H = 140;

export const BloomAna: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const CX = 268;
    const TOP_Y = 46;
    const BOT_Y = 94;

    const render = (time: number) => {
      const t = (time % 3400) / 3400;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = SCENE.bg;
      ctx.fillRect(0, 0, W, H);
      drawCounter(ctx, W, 124);

      drawDripper(ctx, CX, TOP_Y, BOT_Y, 122, 72);
      drawBed(ctx, CX, BOT_Y - 6, 51, () => 12);

      // 洞：散开 ↔ 连成带状，用同一条循环驱动
      const phase = Math.sin(t * Math.PI * 2);
      const spread = 0.5 + 0.5 * phase;
      ctx.fillStyle = SCENE.red;
      for (let i = 0; i < 9; i++) {
        const row = i % 3;
        const jitter = ((i * 37) % 13) / 13;
        const base = CX - 48 + i * 11;
        const hx = base + (jitter - 0.5) * 26 * spread;
        const hy = BOT_Y - 22 + row * 3.5 + (1 - spread) * 1.5;
        ctx.beginPath();
        ctx.ellipse(hx, hy, 2.8, 2.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 壶：壶嘴绕小圈（绕圈注水）
      const ang = t * Math.PI * 2;
      const kx = 442 + Math.cos(ang) * 4;
      const tip = drawKettle(ctx, kx, 48, 20, -0.55, SCENE.blue);

      const landingX = CX + Math.cos(ang) * 28;
      ctx.strokeStyle = SCENE.green;
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tip.tipX, tip.tipY);
      ctx.quadraticCurveTo((tip.tipX + landingX) / 2, tip.tipY + 8, landingX, BOT_Y - 16);
      ctx.stroke();

      // 粉层上的水流痕迹（绕圈轨迹）
      ctx.strokeStyle = 'rgba(39,68,110,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(CX, BOT_Y - 14, 26, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      drawSharePot(ctx, CX, BOT_Y + 6, 40, 22, {
        ratio: 0.45 + 0.25 * phase,
        color: 'rgba(34,141,92,0.35)',
      });

      ctx.fillStyle = SCENE.ink;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('洞的形状会变', 20, 24);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-bloom-ana" ref={canvasRef} width={W} height={H} />;
};

export default BloomAna;
