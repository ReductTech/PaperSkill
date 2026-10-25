import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, lcg, text } from './kit';

const W = 560;
const H = 140;
const AX_Y = 96;
const X0 = 40;
const X1 = 400;
const S_LO = 40.5;
const S_HI = 53.5;

const rand = lcg(20240516);
const DOTS = Array.from({ length: 46 }, () => ({
  u: rand(),
  j: rand(),
}));
const OPT = 61.5;

const sx = (score: number) => X0 + ((score - 34) / (70 - 34)) * (X1 - X0);

// ana-3：散点逐个落在数轴上铺成 13 分散布带，绿点在右侧聚焦（循环）
export const Ana3: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    const ph = (t % 4.5) / 4.5;

    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X0, AX_Y);
    ctx.lineTo(X1, AX_Y);
    ctx.stroke();
    for (let v = 35; v <= 70; v += 5) {
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(v), AX_Y - 4);
      ctx.lineTo(sx(v), AX_Y + 4);
      ctx.stroke();
      if (v % 10 === 5) text(ctx, String(v), sx(v), AX_Y + 14, C.muted, 10, 'center');
    }

    // 散点逐个落下
    const shown = Math.floor(clampN(ph / 0.62) * DOTS.length);
    const fade = ph > 0.82 ? Math.max(0.2, 1 - (ph - 0.82) / 0.18) : 1;
    DOTS.slice(0, shown).forEach((d, i) => {
      ctx.globalAlpha = fade;
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(sx(S_LO + d.u * (S_HI - S_LO)), AX_Y - 10 - d.j * 42 - (i % 3), 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (ph > 0.45) {
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx(S_LO), AX_Y - 56);
      ctx.lineTo(sx(S_HI), AX_Y - 56);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 优化后的绿点：小方差抖动
    if (ph > 0.55) {
      const jitter = ph > 0.82 ? 1.2 : 5;
      const jx = Math.sin(t * 9) * jitter;
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(sx(OPT) + jx, AX_Y - 26, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, '随机 FP', sx(47), 24, C.red, 13, 'center');
    text(ctx, '优化后', sx(OPT) + 6, 40, C.green, 13, 'center');
  });

  return <canvas ref={ref} width={W} height={H} />;
};

function clampN(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export default Ana3;
