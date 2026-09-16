import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawInkPath, drawBrush } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：连笔——毛笔连贯书写多段"S"形连绵字，每段从上一段末端起笔，
// 接头处出现微小错位并逐段放大（红晕标记接头误差）。循环 2.8 s。

const W = 560;
const H = 140;
const DUR = 2800;

const NODES = [
  { x: 70, y: 78 },
  { x: 175, y: 46 },
  { x: 285, y: 96 },
  { x: 395, y: 50 },
  { x: 495, y: 84 },
];
// 接头错位：逐段放大，方向交替
const jointOffset = (i: number) => (i % 2 === 0 ? 1 : -1) * 3.5 * i;

export const AnaCh4Cursive: React.FC<WidgetProps> = () => {
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
      const fade = cyc > 0.82 ? 1 - (cyc - 0.82) / 0.18 : 1;
      const prog = clamp(cyc / 0.8, 0, 1) * (NODES.length - 1);
      const segIdx = Math.min(Math.floor(prog), NODES.length - 2);
      const u = clamp(prog - segIdx, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      // 写下的连笔：每段沿节点走，但接头处带错位
      const nodeAt = (i: number) => ({
        x: NODES[i].x,
        y: NODES[i].y + (i === 0 ? 0 : jointOffset(i)),
      });
      const pts: { x: number; y: number }[] = [nodeAt(0)];
      for (let i = 0; i < segIdx; i++) {
        const a = nodeAt(i);
        const b = nodeAt(i + 1);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 10 };
        const segLen = 14;
        for (let j = 1; j <= segLen; j++) {
          const t = j / segLen;
          const tt = 1 - t;
          pts.push({
            x: tt * tt * a.x + 2 * tt * t * mid.x + t * t * b.x,
            y: tt * tt * a.y + 2 * tt * t * mid.y + t * t * b.y,
          });
        }
      }
      // 当前段（部分）
      {
        const a = nodeAt(segIdx);
        const b = nodeAt(segIdx + 1);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 10 };
        const segLen = Math.max(2, Math.round(u * 14));
        for (let j = 1; j <= segLen; j++) {
          const t = (j / 14) * u;
          const tt = 1 - t;
          pts.push({
            x: tt * tt * a.x + 2 * tt * t * mid.x + t * t * b.x,
            y: tt * tt * a.y + 2 * tt * t * mid.y + t * t * b.y,
          });
        }
      }
      drawInkPath(ctx, pts, { color: PALETTE.blue, width: 3.5 });

      // 接头误差红晕（已写过的接头）
      for (let i = 1; i <= segIdx + (u > 0.15 ? 1 : 0); i++) {
        if (i >= NODES.length) break;
        const n = nodeAt(i);
        ctx.save();
        ctx.globalAlpha = 0.22 * fade;
        ctx.fillStyle = PALETTE.red;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4 + i * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (pts.length > 0 && prog < NODES.length - 1) {
        const tip = pts[pts.length - 1];
        drawBrush(ctx, tip.x, tip.y, 0.14, 28);
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

  return <canvas id="cv-ana-ch4" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh4Cursive;
