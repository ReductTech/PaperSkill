import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawGuide, drawInkPath, drawBrush } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：毛笔沿字帖长横向右书写，笔迹逐渐向下漂离字帖，
// 偏距红晕标示；写完淡出重启。循环 3.2 s，无控件。

const W = 560;
const H = 140;
const DUR = 3200;

export const AnaCh1Blind: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const X0 = 60;
    const X1 = 500;
    const GY = 62;
    const drift = (u: number) => 20 * Math.pow(clamp(u, 0, 1), 1.6);

    const render = (ms: number) => {
      const cyc = (ms % DUR) / DUR;
      const fade = cyc > 0.8 ? 1 - (cyc - 0.8) / 0.2 : 1;
      const write = clamp(cyc / 0.78, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      drawGuide(ctx, [
        { x: X0, y: GY },
        { x: X1, y: GY },
      ]);

      const pts: { x: number; y: number }[] = [];
      const steps = Math.max(2, Math.round(write * 56));
      for (let i = 0; i <= steps; i++) {
        const u = (i / 56) * write;
        pts.push({ x: X0 + u * (X1 - X0), y: GY + drift(u) });
      }

      if (pts.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.13 * fade;
        ctx.fillStyle = PALETTE.red;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, GY);
        for (const p of pts) ctx.lineTo(p.x, p.y);
        ctx.lineTo(pts[pts.length - 1].x, GY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      drawInkPath(ctx, pts, { color: PALETTE.red, width: 4 });

      if (write > 0 && write < 1) {
        drawBrush(ctx, pts[pts.length - 1].x, pts[pts.length - 1].y, 0.18, 28);
      }

      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    let raf: number | null = null;
    const tick = (ms: number) => {
      render(ms);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-ana-ch1" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh1Blind;
