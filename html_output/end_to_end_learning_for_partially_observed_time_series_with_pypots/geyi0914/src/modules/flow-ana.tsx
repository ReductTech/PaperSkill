import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { SCENE, drawKettle, drawDripper, drawBed, drawSharePot, drawCounter } from './pots-kit';

// §5 稳流：壶口、滤杯、杯子都不动，只有水柱粗细在变——「写法不变，只有参数在变」。
const W = 560;
const H = 140;

export const FlowAna: React.FC<WidgetProps> = () => {
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
    const TOP_Y = 48;
    const BOT_Y = 94;

    const render = (time: number) => {
      const t = (time % 3000) / 3000;
      const wobble = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      const thickness = 3 + wobble * 7;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = SCENE.bg;
      ctx.fillRect(0, 0, W, H);
      drawCounter(ctx, W, 124);

      drawDripper(ctx, CX, TOP_Y, BOT_Y, 122, 72);
      drawBed(ctx, CX, BOT_Y - 6, 51, () => 12);

      // 壶固定不动
      const tip = drawKettle(ctx, 442, 50, 20, -0.55, SCENE.blue);

      // 水柱：粗细变化，落点不变
      ctx.strokeStyle = SCENE.green;
      ctx.lineCap = 'round';
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(tip.tipX, tip.tipY);
      ctx.quadraticCurveTo((tip.tipX + CX) / 2, tip.tipY + 10, CX, BOT_Y - 16);
      ctx.stroke();

      // 浸润范围随水量变化
      ctx.fillStyle = `rgba(34,141,92,${0.18 + wobble * 0.28})`;
      ctx.beginPath();
      ctx.ellipse(CX, BOT_Y - 15, 16 + wobble * 16, 4.5 + wobble * 2, 0, 0, Math.PI * 2);
      ctx.fill();

      drawSharePot(ctx, CX, BOT_Y + 6, 40, 22, {
        ratio: 0.4 + wobble * 0.4,
        color: 'rgba(34,141,92,0.35)',
      });

      ctx.fillStyle = SCENE.ink;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('同一个壶口', 20, 24);
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

  return <canvas id="cv-flow-ana" ref={canvasRef} width={W} height={H} />;
};

export default FlowAna;
