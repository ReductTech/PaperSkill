import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBirder, drawBird } from './birdKit';

// ana-5 — 照“片”寻鸟：举照片对照枝头群鸟，最像的那只亮绿勾（2.8s 循环）。

const W = 560;
const H = 140;

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number) => {
      const t = (now / 1000) % 2.8;
      clearScene(ctx, W, H);

      // 观鸟者举照片
      drawBirder(ctx, 80, 108);
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = PALETTE.blue;
      ctx.lineWidth = 2;
      ctx.fillRect(108, 52, 40, 32);
      ctx.strokeRect(108, 52, 40, 32);
      drawBird(ctx, 124, 72, t, { body: PALETTE.orange });
      ctx.restore();

      // 右侧三只鸟（中间那只是同类）
      drawBird(ctx, 330, 60, t + 0.4, { body: PALETTE.muted });
      drawBird(ctx, 420, 84, t + 1.1, { body: PALETTE.orange });
      drawBird(ctx, 500, 52, t + 1.8, { body: PALETTE.treeDark });

      // 视线光束在照片与同类之间往返
      const sweep = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.4 * sweep;
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(150, 66);
      ctx.quadraticCurveTo(280, 40, 408, 78);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 同类亮绿勾
      const lit = t > 1.0;
      if (lit) {
        ctx.save();
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(408, 60);
        ctx.lineTo(416, 68);
        ctx.lineTo(430, 52);
        ctx.stroke();
        ctx.restore();
      }
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana5;
