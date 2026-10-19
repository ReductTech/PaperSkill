import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, rrect, text } from './kit';

const W = 560;
const H = 140;

// ana-8：γ 小方块从 RMSNorm 滑出融入 W 框；底部 lm_head 与 Embedding 虚线闪烁（循环）
export const Ana8: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    // 上排：RMSNorm(含 γ) → W
    rrect(ctx, 56, 26, 130, 40, C.white, C.blue, 1.5, 8);
    text(ctx, 'RMSNorm', 96, 46, C.ink, 13, 'center');
    rrect(ctx, 232, 30, 96, 34, C.white, C.blue, 1.5, 8);
    text(ctx, 'W', 280, 48, C.ink, 14, 'center');

    const cyc = (t % 3) / 3;
    if (cyc < 0.7) {
      const k = Math.min(1, cyc / 0.55);
      const gx = 158 + (236 - 158) * (k * k * (3 - 2 * k));
      ctx.globalAlpha = k > 0.92 ? (1 - k) / 0.08 : 1;
      rrect(ctx, gx - 11, 40 - 11, 22, 22, C.orange, C.orange, 1.5, 4);
      text(ctx, 'γ', gx, 41, C.white, 13, 'center');
      ctx.globalAlpha = 1;
    } else {
      const flash = Math.max(0, 1 - (cyc - 0.7) / 0.3);
      ctx.globalAlpha = flash;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(232, 30, 96, 34, 8);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    text(ctx, 'γ 融合', 280, 88, C.orange, 13, 'center');

    // 下排：tie_word_embeddings
    rrect(ctx, 122, 100, 130, 30, C.white, C.purple, 1.5, 8);
    text(ctx, 'Embedding', 187, 116, C.ink, 12, 'center');
    rrect(ctx, 342, 100, 110, 30, C.white, C.purple, 1.5, 8);
    text(ctx, 'lm_head', 397, 116, C.ink, 12, 'center');
    const blink = 0.35 + 0.65 * (0.5 - 0.5 * Math.cos(t * 4));
    ctx.globalAlpha = blink;
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(252, 115);
    ctx.lineTo(342, 115);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    text(ctx, 'tie', 297, 100, C.purple, 12, 'center');
  });

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ana8;
