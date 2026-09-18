import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { SCENE, drawKettle, drawDripper, drawBed, drawSharePot, drawCounter } from './pots-kit';

// Hero, new-method side：「带着缺口直接学」——同一层粉、同一只壶，
// 一次连续注水扫过整层直接萃取，中间不产生「假完整」的产物。
const W = 520;
const H = 180;

export const HeroNewBrew: React.FC<WidgetProps> = () => {
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

    const DRIP_CX = 250;
    const TOP_Y = 52;
    const BOT_Y = 110;

    // 与左图完全相同的粉层形状（对照必须从同一状态出发）
    const bedTop = (u: number) => {
      const d = Math.abs(u - 0.55);
      const channel = d < 0.13 ? 10 * (1 - d / 0.13) : 0;
      return 13 - channel;
    };

    const render = (time: number) => {
      const t = (time % 2600) / 2600;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = SCENE.bg;
      ctx.fillRect(0, 0, W, H);
      drawCounter(ctx, W, 150);

      drawDripper(ctx, DRIP_CX, TOP_Y, BOT_Y, 124, 74);
      drawBed(ctx, DRIP_CX, BOT_Y - 6, 52, bedTop);

      const tip = drawKettle(ctx, 420, 52, 23, -0.5, SCENE.blue);

      // 一次连续注水：落点沿粉层横向扫过，水层均匀渗开
      const sweep = 0.12 + t * 0.76;
      const landingX = DRIP_CX - 52 + sweep * 104;
      ctx.strokeStyle = SCENE.green;
      ctx.lineCap = 'round';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(tip.tipX, tip.tipY);
      ctx.quadraticCurveTo((tip.tipX + landingX) / 2, tip.tipY + 12, landingX, BOT_Y - 20);
      ctx.stroke();

      // 浸润区（是均匀渗开，不是缺陷）
      ctx.fillStyle = 'rgba(34,141,92,0.35)';
      ctx.beginPath();
      ctx.ellipse(landingX, BOT_Y - 16, 15, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 分享壶：液面平稳上升并保持完整
      const ratio = 0.35 + 0.6 * Math.min(1, t * 1.4);
      drawSharePot(ctx, DRIP_CX, BOT_Y + 8, 40, 30, {
        ratio,
        color: 'rgba(34,141,92,0.4)',
      });

      ctx.fillStyle = SCENE.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('端到端', 24, 32);
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

  return <canvas id="cv-hero-new" ref={canvasRef} width={W} height={H} />;
};

export default HeroNewBrew;
