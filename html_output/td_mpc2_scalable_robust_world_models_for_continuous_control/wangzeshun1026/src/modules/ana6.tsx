import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  GUIDE,
  EMPH,
  AUX,
  INK,
  LINE,
  clearScene,
  drawBall,
  drawShot,
  drawSceneLabel,
  drawLegend,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 隐喻动画：比分差距很大时，用档位记录而不是精确小数。
// 一颗球沿量级轴移动，落点用最近的档位桶表示；边界处给出相邻桶的软目标。
const W = 560;
const H = 140;
const DUR = 3200;
const X0 = 40;
const X1 = 520;
const BUCKETS = 8;
const BW = (X1 - X0) / BUCKETS;
const TOP = 70;
const BOT = 100;

export const Ana6: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const t0 = performance.now();

    const render = (now: number) => {
      const phase = ((now - t0) % DUR) / DUR;
      clearScene(ctx, W, H);

      // 档位桶
      for (let i = 0; i < BUCKETS; i++) {
        ctx.globalAlpha = i % 2 === 0 ? 0.22 : 0.1;
        ctx.fillStyle = LINE;
        ctx.fillRect(X0 + i * BW, TOP, BW - 1, BOT - TOP);
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.strokeRect(X0 + i * BW + 0.5, TOP + 0.5, BW - 1, BOT - TOP - 1);
      }

      const travel = clamp(phase / 0.75, 0, 1);
      const x = lerp(X0 + 12, X1 - 12, travel);
      const idx = clamp(Math.floor((x - X0) / BW), 0, BUCKETS - 1);

      ctx.globalAlpha = 1;
      ctx.fillStyle = EMPH;
      ctx.globalAlpha = 0.28;
      ctx.fillRect(X0 + idx * BW, TOP, BW - 1, BOT - TOP);

      if (phase > 0.52) {
        const center = X0 + (idx + 0.5) * BW;
        const dir = x < center ? -1 : 1;
        const nb = clamp(idx + dir, 0, BUCKETS - 1);
        if (nb !== idx) {
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = AUX;
          ctx.fillRect(X0 + nb * BW, TOP, BW - 1, BOT - TOP);
        }
      }

      // 精确值：一条细线
      ctx.globalAlpha = 1;
      drawShot(ctx, [[x, TOP - 10], [x, BOT + 4]], GUIDE, 2.5);

      // 球（唯一活动主体）
      const y = 85 + Math.sin(now / 220) * 1.5;
      drawBall(ctx, x, y, 8, '#f7f4e9', true);

      // 基线
      drawShot(ctx, [[X0, BOT + 4], [X1, BOT + 4]], INK, 1.5);

      drawSceneLabel(ctx, '比分跨量级', 40, 22, INK);
      drawSceneLabel(ctx, '按档位记', 330, 22, INK);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '精确值' },
          { color: EMPH, text: '档位' },
          { color: AUX, text: '软目标' },
        ],
        40,
        132
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana6;
