import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, rrect, text } from './kit';

const W = 560;
const H = 140;

// ana-9：两种配置卡交替浮起——no-had(8-bit 蓝) 与 had(4-bit 紫)（循环）
export const Ana9: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    const ph = (t % 4) / 4;
    const leftUp = ph < 0.5;

    drawCard(ctx, 56, leftUp ? 22 : 34, 'no-had', 'W4A8KV8', 8, C.blue, '12.1→1.6', leftUp);
    drawCard(ctx, 300, !leftUp ? 22 : 34, 'had', 'W4A4KV4', 4, C.purple, '64.0 分', !leftUp);
  });

  return <canvas ref={ref} width={W} height={H} />;
};

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string,
  tag: string,
  bits: number,
  col: string,
  stat: string,
  active: boolean
): void {
  rrect(ctx, x, y, 204, 86, C.white, col, active ? 2.5 : 1.2, 10);
  text(ctx, name, x + 102, y + 18, col, 15, 'center');
  // 位宽条：W / A / KV
  const labels = ['W', 'A', 'KV'];
  labels.forEach((lb, i) => {
    const bx = x + 16 + i * 62;
    const bh = bits === 8 ? 26 : 15;
    rrect(ctx, bx, y + 56 - bh / 2, 44, bh, col, col, 1, 3);
    ctx.globalAlpha = 0.28;
    rrect(ctx, bx, y + 56 - 13, 44, 26, C.bg, C.axis, 1, 3);
    ctx.globalAlpha = 1;
    rrect(ctx, bx, y + 56 - bh / 2, 44, bh, col, col, 1, 3);
    text(ctx, `${lb} ${bits}bit`, bx + 22, y + 56, C.white, 10, 'center');
  });
  text(ctx, stat, x + 102, y + 76, active ? col : C.muted, 13, 'center');
}

export default Ana9;
