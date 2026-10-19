import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, arrow, clearScene, rrect, text } from './kit';

const W = 560;
const H = 140;

// ana-6：双管线同步跑 token，左列入口的旋转徽标周期性被吸进权重块（循环）
export const Ana6: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    // 左列：运行时旋转
    drawPipe(ctx, 96, '运行时', C.blue, true);
    // 右列：融合后
    drawPipe(ctx, 320, '融合后', C.green, false);

    // 同相位 token 流
    const flow = (t * 46) % 120;
    ([[70, C.blue], [294, C.green]] as const).forEach(([x0, col]) => {
      for (let k = 0; k < 3; k++) {
        const fx = x0 + 10 + ((flow + k * 40) % 120);
        ctx.fillStyle = col as string;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(fx, 62, 10, 10, 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    // 旋转徽标被吸入权重块（左列，周期 4s）
    const cyc = (t % 4) / 4;
    if (cyc < 0.55) {
      const suck = Math.min(1, cyc / 0.45);
      const bx = 128 + suck * 78;
      const alpha = suck > 0.85 ? (1 - suck) / 0.15 : 1;
      ctx.globalAlpha = alpha;
      rrect(ctx, bx - 12, 90 - 12, 24, 24, C.orange, C.orange, 1.5, 5);
      text(ctx, 'R', bx, 92, C.white, 13, 'center');
      ctx.globalAlpha = 1;
    }

    text(ctx, '输出差 0.000', 468, 118, C.green, 14, 'center');
  });

  return <canvas ref={ref} width={W} height={H} />;
};

function drawPipe(
  ctx: CanvasRenderingContext2D,
  x0: number,
  label: string,
  col: string,
  withR: boolean
): void {
  text(ctx, label, x0 + 60, 34, col, 13, 'center');
  rrect(ctx, x0, 54, 52, 26, C.white, col, 1.5, 6);
  text(ctx, 'X', x0 + 26, 68, C.ink, 13, 'center');
  rrect(ctx, x0 + 128, 54, 56, 26, C.white, col, 1.5, 6);
  text(ctx, withR ? 'W' : 'W̃', x0 + 156, 68, C.ink, 13, 'center');
  rrect(ctx, x0 + 250, 54, 52, 26, C.white, col, 1.5, 6);
  text(ctx, 'Y', x0 + 276, 68, C.ink, 13, 'center');
  const yMid = 67;
  arrow(ctx, x0 + 52, yMid, x0 + 128, yMid, C.muted, 1.6);
  arrow(ctx, x0 + 184, yMid, x0 + 250, yMid, C.muted, 1.6);
  if (withR) rrect(ctx, x0 + 76, 54, 44, 26, C.white, C.orange, 1.5, 6);
}

export default Ana6;
