import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawInkPath, drawGhostPath, drawBrush, drawSceneLabel } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：空中练字——毛笔悬空反复写同一笔画，空中留渐隐淡蓝轨迹；
// 每三轮落纸一次留下实墨。循环 3.2 s。

const W = 560;
const H = 140;
const DUR = 3200;
const PASSES = 4; // 前 3 空中，第 4 落纸
const PASS_LEN = 0.72;

const X0 = 92;
const X1 = 468;
const Y = 96;

function strokePts(u: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const n = Math.max(2, Math.round(u * 40));
  for (let i = 0; i <= n; i++) {
    const rel = (i / 40) * u;
    pts.push({
      x: X0 + rel * (X1 - X0),
      y: Y + Math.sin(rel * Math.PI * 2) * 5,
    });
  }
  return pts;
}

export const AnaCh7Air: React.FC<WidgetProps> = () => {
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

    const render = (ms: number) => {
      const cyc = (ms % DUR) / DUR;
      const fade = cyc > 0.94 ? 1 - (cyc - 0.94) / 0.06 : 1;

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      drawSceneLabel(ctx, 66, Y - 46, '空中 ×3', { size: 12, align: 'right' });
      drawSceneLabel(ctx, 66, Y + 30, '落纸 ×1', { size: 12, align: 'right', color: PALETTE.blue });

      for (let p = 0; p < PASSES; p++) {
        const start = p * PASS_LEN;
        const end = start + 0.64;
        const isAir = p < PASSES - 1;
        if (cyc < start) continue;
        const u = clamp((cyc - start) / 0.64, 0, 1);
        const pts = strokePts(u);

        if (isAir) {
          // 已完成的空中轨迹渐隐：越早写的越淡
          const age = cyc - end;
          const alpha = u < 1 ? 0.75 : clamp(0.75 - age * 0.5, 0.12, 0.75);
          if (u >= 1) {
            drawGhostPath(ctx, strokePts(1), {
              color: PALETTE.blue,
              width: 2,
              alpha,
              dash: [5, 4],
            });
          } else {
            drawGhostPath(ctx, pts, { color: PALETTE.blue, width: 2, alpha, dash: [5, 4] });
            // 悬空毛笔：笔尖抬高 14px
            const tip = pts[pts.length - 1];
            drawBrush(ctx, tip.x, tip.y - 14, 0.16, 26);
          }
        } else {
          drawInkPath(ctx, pts, { color: PALETTE.blue, width: 4 });
          if (u < 1) {
            const tip = pts[pts.length - 1];
            drawBrush(ctx, tip.x, tip.y, 0.16, 26);
          }
        }
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

  return <canvas id="cv-ana-ch7" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh7Air;
