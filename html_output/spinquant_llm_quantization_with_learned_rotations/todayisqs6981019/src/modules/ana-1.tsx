import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, FLAT, clearScene, hist, text } from './kit';

const W = 560;
const H = 140;

// ana-1：尖峰柱周期性长高，刻度尺被拉长，正常值柱被压扁（循环）
export const Ana1: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    const ph = (t % 3) / 3;
    const a = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2); // 0→1→0

    const bins = FLAT.map((v, i) => {
      const spike = i < 3 || i >= FLAT.length - 3;
      if (!spike) return 0.55 * v + (1 - a) * 0.1;
      return v * (0.25 + 0.75 * a);
    });
    hist(ctx, bins, 24, 14, W - 48, 64, C.blue, (i) =>
      i < 3 || i >= bins.length - 3 ? C.red : null
    );
    text(ctx, 'outlier', 38, 24, C.red, 13);

    // 刻度尺：s = 尖峰高度/7，随 a 伸缩
    const half = 40 + a * 205;
    const cy = 116;
    ctx.strokeStyle = a > 0.6 ? C.red : C.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - half, cy);
    ctx.lineTo(W / 2 + half, cy);
    ctx.stroke();
    const step = half / 7;
    for (let k = -7; k <= 7; k++) {
      ctx.strokeStyle = k === 0 ? C.ink : ctx.strokeStyle;
      ctx.lineWidth = k === 0 ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(W / 2 + k * step, cy - 5);
      ctx.lineTo(W / 2 + k * step, cy + 5);
      ctx.stroke();
    }
    text(ctx, 's', W / 2 + half + 12, cy, a > 0.6 ? C.red : C.blue, 15);
  });

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ana1;
