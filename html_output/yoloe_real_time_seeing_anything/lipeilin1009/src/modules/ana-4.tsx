import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBook } from './birdKit';

// ana-4 — 把笔记烙进图鉴：小笔记的页贴进大图鉴，笔记淡出，图鉴变厚发亮（3.2s 循环）。

const W = 560;
const H = 140;

export const Ana4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const t = (now / 1000) % 3.2;
      clearScene(ctx, W, H);

      // 两页纸的飞行相位
      const fly1 = easeInOutQuad(Math.max(0, Math.min(1, (t - 0.3) / 0.8)));
      const fly2 = easeInOutQuad(Math.max(0, Math.min(1, (t - 1.2) / 0.8)));
      const merged = Math.max(fly1, fly2) > 0.95 && t > 2.0;

      // 小笔记本（蓝皮、明显比图鉴小一号；随两页飞走而变淡）
      ctx.save();
      ctx.globalAlpha = 1 - 0.75 * Math.max(fly2, t > 2.0 ? 1 : 0);
      ctx.fillStyle = PALETTE.blue;
      ctx.fillRect(169, 85, 22, 18);
      ctx.fillStyle = '#fff';
      ctx.fillRect(172, 88, 16, 12);
      ctx.strokeStyle = PALETTE.muted;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(175, 88 + i * 4);
        ctx.lineTo(185, 88 + i * 4);
        ctx.stroke();
      }
      ctx.restore();

      // 飞页 1 / 飞页 2（放大、带旋转与字行）
      const drawPage = (f: number) => {
        if (f <= 0 || f >= 1) return;
        const x = 200 + (360 - 200) * f;
        const y = 84 - Math.sin(f * Math.PI) * 26;
        ctx.save();
        ctx.globalAlpha = 1 - f * 0.4;
        ctx.translate(x, y);
        ctx.rotate(Math.sin(f * Math.PI) * 0.5);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = PALETTE.blue;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-10, -14, 20, 28);
        ctx.strokeRect(-10, -14, 20, 28);
        ctx.strokeStyle = PALETTE.muted;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -5);
        ctx.lineTo(6, -5);
        ctx.moveTo(-6, 2);
        ctx.lineTo(6, 2);
        ctx.stroke();
        ctx.restore();
      };
      drawPage(fly1);
      drawPage(fly2);

      // 大图鉴：吸收后变厚 + 绿色描边
      const thick = 1.4 + fly1 * 0.5 + fly2 * 0.5;
      drawBook(ctx, 380, 100, t, { thick, glow: merged ? PALETTE.green : undefined });
      if (merged) {
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5);
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(342, 56);
        ctx.lineTo(350, 64);
        ctx.lineTo(364, 48);
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

export default Ana4;
