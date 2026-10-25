import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBirder } from './birdKit';

// ana-9 — 减一件，快一程：卸下背包里的石头，脚步明显变快（3.0s 循环）。

const W = 560;
const H = 140;

export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (now / 1000) % 3.0;
      clearScene(ctx, W, H);

      // 相位：0–1.1s 负重慢走；1.1–1.6s 停下卸石头；1.6–3.0s 轻装快走
      const dropF = easeInOutQuad(Math.max(0, Math.min(1, (t - 1.1) / 0.5)));
      const light = t >= 1.6;
      const stopX = 60 + 1.1 * 55; // 卸石头时人停下的位置
      const baseX = light ? stopX + (t - 1.6) * 150 : Math.min(60 + t * 55, stopX);
      const x = Math.min(baseX, 470);
      const y = 108;

      // 脚印（间距反映步速）
      ctx.save();
      ctx.fillStyle = PALETTE.muted;
      const gap = light ? 34 : 18;
      for (let i = 1; i <= 6; i++) {
        const fx = x - i * gap;
        if (fx < 20) break;
        ctx.globalAlpha = 0.5 - i * 0.06;
        ctx.beginPath();
        ctx.ellipse(fx, 122, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 观鸟者 + 背包（卸下后变瘪）
      drawBirder(ctx, x, y);
      const packW = 22 - dropF * 10;
      const packH = 26 - dropF * 10;
      ctx.save();
      ctx.fillStyle = PALETTE.wood;
      ctx.beginPath();
      ctx.roundRect(x - 8 - packW, y - 44, packW, packH, 5);
      ctx.fill();
      ctx.restore();

      // 石头：从背包落出后留在原地（人继续走，石头不跟着）
      if (dropF > 0) {
        ctx.save();
        ctx.fillStyle = PALETTE.muted;
        const landX = stopX - 20 - 26; // 落点固定：卸货完成瞬间石头的位置
        const sx = light ? landX : x - 20 - dropF * 26;
        const sy = y - 30 + dropF * 37; // 落到与地面脚印同一水平线
        ctx.beginPath();
        ctx.ellipse(sx, sy, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 快走后的小速度线
      if (light) {
        ctx.save();
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 46 - i * 12, y - 40 + i * 12);
          ctx.lineTo(x - 30 - i * 12, y - 40 + i * 12);
          ctx.stroke();
        }
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

export default Ana9;
