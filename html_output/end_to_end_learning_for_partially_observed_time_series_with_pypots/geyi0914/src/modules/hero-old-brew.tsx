import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { SCENE, drawKettle, drawDripper, drawBed, drawSharePot, drawCounter } from './pots-kit';

// Hero, old-method side：「先补好再学」——水沿着被冲出的通道直冲而下，杯里的液面留下一道缺口。
const W = 520;
const H = 180;

export const HeroOldBrew: React.FC<WidgetProps> = () => {
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

    // 同一层粉：中部被冲出一条通道
    const bedTop = (u: number) => {
      const d = Math.abs(u - 0.55);
      const channel = d < 0.13 ? 10 * (1 - d / 0.13) : 0;
      return 13 - channel;
    };

    const render = (time: number) => {
      const t = (time % 3200) / 3200;
      const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = SCENE.bg;
      ctx.fillRect(0, 0, W, H);
      drawCounter(ctx, W, 150);

      drawDripper(ctx, DRIP_CX, TOP_Y, BOT_Y, 124, 74);
      drawBed(ctx, DRIP_CX, BOT_Y - 6, 52, bedTop);

      // 通道口的洞
      const holeX = DRIP_CX - 52 + 0.55 * 104;
      ctx.fillStyle = SCENE.red;
      ctx.beginPath();
      ctx.ellipse(holeX, BOT_Y - 22, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = SCENE.red;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.35 + 0.5 * pulse;
      ctx.beginPath();
      ctx.arc(holeX, BOT_Y - 22, 11 + 3 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // 壶：与全站同一只壶，位置在右上方
      const tip = drawKettle(ctx, 420, 52, 23, -0.5, SCENE.blue);

      // 水沿通道直冲：细、快、色警示
      const fall = ((time % 1400) / 1400);
      const endY = BOT_Y - 18;
      ctx.strokeStyle = SCENE.orange;
      ctx.lineCap = 'round';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(tip.tipX, tip.tipY);
      ctx.quadraticCurveTo((tip.tipX + holeX) / 2, tip.tipY + 14, holeX, endY);
      ctx.stroke();
      ctx.fillStyle = SCENE.orange;
      const dropY = tip.tipY + (endY - tip.tipY) * fall;
      ctx.beginPath();
      ctx.arc(holeX, dropY, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // 分享壶：液面不满，且缺一块
      drawSharePot(ctx, DRIP_CX, BOT_Y + 8, 40, 30, {
        ratio: 0.55,
        color: 'rgba(196,63,82,0.35)',
      });
      ctx.fillStyle = SCENE.bg;
      ctx.fillRect(DRIP_CX - 4, BOT_Y + 22, 12, 15);
      ctx.strokeStyle = SCENE.red;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(DRIP_CX - 4, BOT_Y + 22, 12, 15);

      ctx.fillStyle = SCENE.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('先补再学', 24, 32);
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

  return <canvas id="cv-hero-old" ref={canvasRef} width={W} height={H} />;
};

export default HeroOldBrew;
