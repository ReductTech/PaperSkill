import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawInkPath, drawGhostPath, drawTarget, drawBrush } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：悬笔择路——毛笔悬于纸上，虚线幽灵路径向目标试画 2 条，
// 其一变实并延伸一小段，毛笔前移，然后幽灵重新探路。循环 3.0 s。

const W = 560;
const H = 140;
const DUR = 3000;

const START = { x: 88, y: 88 };
const MID = { x: 300, y: 70 };
const TARGET = { x: 470, y: 56 };

const CAND_A = [
  { x: START.x, y: START.y },
  { x: 170, y: 44 },
  { x: 260, y: 34 },
  { x: 360, y: 36 },
  { x: TARGET.x, y: TARGET.y },
];
const CAND_B = [
  { x: START.x, y: START.y },
  { x: 180, y: 108 },
  { x: 280, y: 116 },
  { x: 380, y: 96 },
  { x: TARGET.x, y: TARGET.y },
];

export const AnaCh6Hover: React.FC<WidgetProps> = () => {
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
      const fade = cyc > 0.92 ? 1 - (cyc - 0.92) / 0.08 : 1;
      // A 0–0.3 两候选探出；B 0.3–0.42 选中上候选；C 0.42–0.72 变实延伸；D 0.72–1.0 重新探路
      const probeU = clamp(cyc / 0.3, 0, 1);
      const reProbeU = clamp((cyc - 0.72) / 0.28, 0, 1);
      const solidU = clamp((cyc - 0.42) / 0.3, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      drawTarget(ctx, TARGET.x, TARGET.y, { r: 9 });

      // 两条幽灵候选（探路阶段逐点画出）
      if (probeU > 0 && cyc < 0.72) {
        const nA = Math.max(2, Math.round(probeU * (CAND_A.length - 1)) + 1);
        const nB = Math.max(2, Math.round(probeU * (CAND_B.length - 1)) + 1);
        const sel = cyc > 0.3;
        drawGhostPath(ctx, CAND_B.slice(0, nB), {
          color: PALETTE.muted,
          width: 1.8,
          alpha: 0.4,
        });
        drawGhostPath(ctx, CAND_A.slice(0, nA), {
          color: sel ? PALETTE.blue : PALETTE.muted,
          width: sel ? 2.6 : 1.8,
          alpha: sel ? 0.85 : 0.4,
        });
      }

      // 选中后：前段变实延伸（沿候选 A 前两段）
      if (solidU > 0) {
        const n = Math.max(2, Math.round(solidU * 3) + 1);
        drawInkPath(ctx, CAND_A.slice(0, Math.min(n, 4)), { color: PALETTE.blue, width: 3.5 });
      }

      // 毛笔悬于当前位置上方（笔尖不落纸）
      const hoverPt =
        solidU > 0
          ? CAND_A[Math.min(Math.round(solidU * 3), 3)]
          : { x: START.x, y: START.y };
      drawBrush(ctx, hoverPt.x, hoverPt.y - 16, 0.18, 28);
      // 纸上投影（悬停暗示）
      ctx.save();
      ctx.globalAlpha = 0.25 * fade;
      ctx.fillStyle = PALETTE.muted;
      ctx.beginPath();
      ctx.ellipse(hoverPt.x, hoverPt.y + 2, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 重新探路阶段：从新位置再出幽灵
      if (reProbeU > 0) {
        const base = CAND_A[3];
        const nA = Math.max(2, Math.round(reProbeU * 1) + 1);
        const ghost = [base, { x: (base.x + TARGET.x) / 2, y: base.y - 14 }, TARGET];
        drawGhostPath(ctx, ghost.slice(0, nA + 1), { color: PALETTE.blue, width: 2.4 });
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

  return <canvas id="cv-ana-ch6" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh6Hover;
