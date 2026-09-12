import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawGuide, drawInkPath, drawBrush } from './theme-kit';
import type { WidgetProps } from './registry';

// Hero old side: 毛笔"盲写"长横——只凭当前笔感延伸，随时间向下漂出字帖，
// 偏距红晕渐大；角落一枚小的误差上翘曲线。纯循环动画，无控件。

const W = 560;
const H = 240;
const DUR = 3000;

export const HeroReactive: React.FC<WidgetProps> = () => {
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

    const X0 = 70;
    const X1 = 470;
    const GY = 158;
    const drift = (u: number) => 30 * Math.pow(clamp(u, 0, 1), 1.7);

    const render = (ms: number) => {
      const cyc = (ms % DUR) / DUR;
      const fade = cyc > 0.86 ? 1 - (cyc - 0.86) / 0.14 : 1;
      const write = clamp(cyc / 0.82, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 12 });
      ctx.save();
      ctx.globalAlpha = fade;

      // 字帖范迹（虚线棕）
      drawGuide(ctx, [
        { x: X0, y: GY },
        { x: X1, y: GY },
      ]);

      // 已执行笔迹：向下漂离
      const pts: { x: number; y: number }[] = [];
      const steps = Math.max(2, Math.round(write * 60));
      for (let i = 0; i <= steps; i++) {
        const u = (i / 60) * write;
        pts.push({ x: X0 + u * (X1 - X0), y: GY + drift(u) });
      }

      // 偏差红晕（偏移区半透明填充）
      if (pts.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.12 * fade;
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
        drawBrush(ctx, pts[pts.length - 1].x, pts[pts.length - 1].y, 0.18);
      }

      // 角落误差上翘曲线插栏
      const ix = 452;
      const iy = 22;
      const iw = 92;
      const ih = 52;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.strokeStyle = PALETTE.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix + 0.5, iy + 0.5, iw, ih);
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const u = i / 30;
        const x = ix + 6 + u * (iw - 12);
        const y = iy + ih - 6 - Math.pow(u, 1.7) * (ih - 12);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

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

  return <canvas id="cv-hero-old" ref={canvasRef} width={W} height={H} />;
};

export default HeroReactive;
