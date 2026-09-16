import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawGuide, drawGhostPath, drawInkPath, drawBrush, drawTarget } from './theme-kit';
import type { WidgetProps } from './registry';

// Hero new side: 同一书案——毛笔悬停，虚线幽灵笔迹先在空中预演整段走势
// （意在笔先），随后实笔墨迹沿预演落笔贴合字帖，末端盖上小绿环（命中目标）。

const W = 560;
const H = 240;
const DUR = 3000;

export const HeroPredictive: React.FC<WidgetProps> = () => {
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
    // 预演与实笔都沿字帖走，仅带极小有界摆动（预演 1.5px，实笔 2.5px）
    const ghostY = (u: number) => GY + 1.5 * Math.sin(u * Math.PI * 2);
    const inkY = (u: number) => GY + 2.5 * Math.sin(u * Math.PI * 2 + 0.6);

    const samplePts = (uMax: number, yFn: (u: number) => number) => {
      const pts: { x: number; y: number }[] = [];
      const steps = Math.max(2, Math.round(uMax * 60));
      for (let i = 0; i <= steps; i++) {
        const u = (i / 60) * uMax;
        pts.push({ x: X0 + u * (X1 - X0), y: yFn(u) });
      }
      return pts;
    };

    const render = (ms: number) => {
      const cyc = (ms % DUR) / DUR;
      const fade = cyc > 0.92 ? 1 - (cyc - 0.92) / 0.08 : 1;
      // A 0–0.36 预演；B 0.36–0.88 落笔；C 收尾（目标环脉冲）
      const ghostU = clamp(cyc / 0.36, 0, 1);
      const inkU = clamp((cyc - 0.36) / 0.52, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 12 });
      ctx.save();
      ctx.globalAlpha = fade;

      drawGuide(ctx, [
        { x: X0, y: GY },
        { x: X1, y: GY },
      ]);

      // 幽灵预演（虚线，先于实笔画完整段）
      if (ghostU > 0) {
        drawGhostPath(ctx, samplePts(ghostU, ghostY), { color: PALETTE.blue, width: 2 });
      }

      // 实笔墨迹
      if (inkU > 0) {
        const pts = samplePts(inkU, inkY);
        drawInkPath(ctx, pts, { color: PALETTE.blue, width: 4 });
        if (inkU < 1) {
          drawBrush(ctx, pts[pts.length - 1].x, pts[pts.length - 1].y, 0.18);
        }
      } else if (ghostU > 0 && ghostU < 1) {
        // 预演阶段：毛笔悬在幽灵笔迹上方 20px 跟随
        const gp = samplePts(ghostU, ghostY);
        const tip = gp[gp.length - 1];
        drawBrush(ctx, tip.x, tip.y - 20, 0.18);
      }

      // 命中目标：末端小绿环（落笔完成后脉冲出现）
      if (inkU >= 1) {
        const pulse = 1 + 0.25 * Math.sin(clamp((cyc - 0.88) / 0.12, 0, 1) * Math.PI);
        ctx.save();
        ctx.translate(X1, GY);
        ctx.scale(pulse, pulse);
        ctx.translate(-X1, -GY);
        drawTarget(ctx, X1, GY, { r: 9 });
        ctx.restore();
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

  return <canvas id="cv-hero-new" ref={canvasRef} width={W} height={H} />;
};

export default HeroPredictive;
