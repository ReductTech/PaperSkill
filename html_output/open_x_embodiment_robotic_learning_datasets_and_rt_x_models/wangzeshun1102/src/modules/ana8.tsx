import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawVehicle,
  drawLicense,
  drawSceneLabel,
  drawLegend,
  seeded,
  GUIDE,
  OK,
  BAD,
  EMPH,
  PAINT,
  LINE,
  INK,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 隐喻 8：驾照上写着能开哪些车，但没人说得清哪段经验真能搬过去。
// 四段经验飞向新车：每轮谁成功、谁落空都在变，暗示“没有判定准则”。自动循环 3.2s。

const W = 560;
const H = 140;

export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const elapsed = now - t0;
      const t = (elapsed / 3200) % 1;
      const cycle = Math.floor(elapsed / 3200);
      clearScene(ctx, W, H);

      drawLicense(ctx, 28, 62, 62, 36, GUIDE);
      drawSceneLabel(ctx, '旧经验', 28, 36, INK);

      drawVehicle(ctx, 470, 112, 'van', 1.0, PAINT);
      drawSceneLabel(ctx, '新车', 452, 80, INK);

      drawLegend(
        ctx,
        [
          { color: OK, text: '迁移成功' },
          { color: BAD, text: '迁移失败' },
        ],
        28,
        130
      );

      // 四段经验的轨迹（淡虚线）
      const rnd = seeded(cycle * 137 + 11);
      const jitter = [rnd(), rnd(), rnd(), rnd()];
      const start = { x: 100, y: 80 };
      const end = { x: 446, y: 94 };

      for (let i = 0; i < 4; i++) {
        const cy = 10 + i * 11 + jitter[i] * 6;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(250, cy, end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 每轮成败组合都在换：没有可提前判断的规律
      const shift = cycle % 4;
      const fates = [true, false, true, false].map((_, i) => (i + shift) % 4 < 2);

      for (let i = 0; i < 4; i++) {
        const tStart = 0.06 + i * 0.07;
        const local = clamp((t - tStart) / 0.52, 0, 1);
        if (local <= 0) continue;
        const cy = 10 + i * 11 + jitter[i] * 6;
        const u = local;
        const x =
          (1 - u) * (1 - u) * start.x + 2 * (1 - u) * u * 250 + u * u * end.x;
        const y =
          (1 - u) * (1 - u) * start.y + 2 * (1 - u) * u * cy + u * u * end.y;

        const success = fates[i];
        let color = GUIDE;
        let alpha = 1;
        if (success && local > 0.72) color = OK;
        if (!success) {
          color = local > 0.42 ? BAD : GUIDE;
          alpha = 1 - clamp((local - 0.42) / 0.32, 0, 1);
        }
        if (alpha <= 0) continue;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 抵达新车的绿色对勾
      const anySuccess = fates.some(Boolean);
      if (anySuccess && t > 0.66) {
        const a = clamp((t - 0.66) / 0.16, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(505, 76);
        ctx.lineTo(513, 85);
        ctx.lineTo(527, 66);
        ctx.stroke();
        ctx.restore();
      }

      // 没有准则：手绘问号（图形，不是文字）
      const qa = clamp((t - 0.5) / 0.2, 0, 1) * (0.55 + 0.45 * Math.sin(t * Math.PI * 6));
      if (qa > 0) {
        ctx.save();
        ctx.globalAlpha = clamp(qa, 0, 1);
        ctx.strokeStyle = EMPH;
        ctx.fillStyle = EMPH;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(262, 96, 10, Math.PI * 0.95, Math.PI * 2.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(268, 104);
        ctx.lineTo(262, 113);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(262, 122, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana8;
