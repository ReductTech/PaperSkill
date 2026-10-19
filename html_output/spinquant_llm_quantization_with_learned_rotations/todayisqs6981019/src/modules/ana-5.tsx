import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, arrow, clearScene, legend, rrect, text } from './kit';

const W = 560;
const H = 140;

const NODES = [
  { x: 60, y: 92, label: 'Emb' },
  { x: 155, y: 92, label: 'Norm' },
  { x: 250, y: 92, label: 'Wqkv' },
  { x: 345, y: 92, label: 'Attn' },
  { x: 440, y: 92, label: 'Wo' },
  { x: 345, y: 34, label: 'FFN' },
  { x: 470, y: 34, label: 'down' },
];

// 徽标挂载点：R1 残差入口、R2 Wv/Wo、R3 K 前、R4 down 前
const MOUNTS = [
  { x: 60, y: 34, r: 'R1', learn: true },
  { x: 392, y: 92, r: 'R2', learn: true },
  { x: 296, y: 92, r: 'R3', learn: false },
  { x: 418, y: 34, r: 'R4', learn: false },
];

// ana-5：四个 R 徽标轮流飞向管线挂载（循环）
export const Ana5: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    // 管线
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i];
      const b = NODES[i + 1];
      if (a.y === b.y) arrow(ctx, a.x + 24, a.y, b.x - 24, b.y, C.muted, 1.6);
    }
    NODES.forEach((n) => {
      rrect(ctx, n.x - 24, n.y - 13, 48, 26, C.white, C.dark, 1.5, 6);
      text(ctx, n.label, n.x, n.y, C.ink, 12, 'center');
    });
    arrow(ctx, 440, 80, 360, 46, C.muted, 1.6);

    // 徽标轮流飞行：6s 周期，每个徽标 1.2s 窗口
    const ph = (t % 6) / 6;
    MOUNTS.forEach((m, i) => {
      const local = ph * 4 - i;
      const fly = Math.max(0, Math.min(1, local * 1.6));
      const landed = fly >= 1;
      const y0 = 8;
      const bx = m.x;
      const by = y0 + (m.y - 26 - y0) * (fly * fly * (3 - 2 * fly));
      const col = m.learn ? C.green : C.purple;
      rrect(ctx, bx - 14, by - 11, 28, 22, landed ? col : C.white, col, 1.5, 5);
      text(ctx, m.r, bx, by + 1, landed ? C.white : col, 12, 'center');
      if (landed) {
        const flash = Math.max(0, 1 - (local - 0.625) * 6);
        if (flash > 0) {
          ctx.globalAlpha = flash * 0.5;
          ctx.strokeStyle = col;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 20 + (1 - flash) * 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    });

    legend(
      ctx,
      [
        { label: '可融合·学习', color: C.green },
        { label: '在线固定', color: C.purple },
      ],
      34,
      128
    );
  });

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ana5;
