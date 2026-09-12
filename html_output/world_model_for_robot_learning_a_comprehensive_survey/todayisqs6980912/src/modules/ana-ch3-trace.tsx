import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import { PALETTE, drawScene, drawInkPath, drawGhostPath, drawBrush } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：描红——毛笔沿淡红范迹逐段描写，描完的段落从红渐变蓝，
// 每段末端浮现一小段虚线幽灵（预演下一笔）。循环 3.4 s。

const W = 560;
const H = 140;
const DUR = 3400;

const SEGS: { x: number; y: number }[][] = [
  [
    { x: 70, y: 100 },
    { x: 150, y: 58 },
    { x: 205, y: 72 },
  ],
  [
    { x: 205, y: 72 },
    { x: 280, y: 92 },
    { x: 340, y: 56 },
  ],
  [
    { x: 340, y: 56 },
    { x: 410, y: 42 },
    { x: 480, y: 66 },
  ],
];

export const AnaCh3Trace: React.FC<WidgetProps> = () => {
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
      const fade = cyc > 0.86 ? 1 - (cyc - 0.86) / 0.14 : 1;
      const prog = clamp(cyc / 0.84, 0, 1) * SEGS.length;
      const segIdx = Math.min(Math.floor(prog), SEGS.length - 1);
      const u = clamp(prog - segIdx, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      // 描红范本（淡红范迹）
      ctx.save();
      ctx.globalAlpha = 0.4 * fade;
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(SEGS[0][0].x, SEGS[0][0].y);
      for (const seg of SEGS) for (const p of seg) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();

      // 已描过的段：红→蓝渐变
      for (let i = 0; i < segIdx; i++) {
        drawInkPath(ctx, SEGS[i], {
          color: lerpColor(PALETTE.red, PALETTE.blue, (i + 1) / SEGS.length),
          width: 4,
        });
      }
      // 当前段：部分描红 + 毛笔
      const cur = SEGS[segIdx];
      const steps = Math.max(2, Math.round(u * 20));
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const f = (i / 20) * u;
        const segf = clamp(f, 0, 1) * (cur.length - 1);
        const si = Math.min(Math.floor(segf), cur.length - 2);
        const sf = segf - si;
        pts.push({
          x: cur[si].x + (cur[si + 1].x - cur[si].x) * sf,
          y: cur[si].y + (cur[si + 1].y - cur[si].y) * sf,
        });
      }
      drawInkPath(ctx, pts, {
        color: lerpColor(PALETTE.red, PALETTE.blue, segIdx / SEGS.length),
        width: 4,
      });
      if (pts.length > 0 && u < 1) {
        const tip = pts[pts.length - 1];
        drawBrush(ctx, tip.x, tip.y, 0.16, 28);
        // 段末虚线幽灵：预演下一笔
        if (segIdx < SEGS.length - 1 && u > 0.55) {
          drawGhostPath(ctx, SEGS[segIdx + 1], { color: PALETTE.blue, width: 2 });
        }
      } else if (u >= 1 && segIdx === SEGS.length - 1) {
        drawBrush(ctx, SEGS[SEGS.length - 1][SEGS[0].length - 1].x, SEGS[SEGS.length - 1][SEGS[0].length - 1].y, 0.16, 28);
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

  return <canvas id="cv-ana-ch3" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh3Trace;
