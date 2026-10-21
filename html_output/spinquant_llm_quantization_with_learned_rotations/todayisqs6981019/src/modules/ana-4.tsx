import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, text } from './kit';

const W = 560;
const H = 140;
const CX = 130;
const CY = 72;
const R = 52;

// ana-4：绿点沿流形圆弧滑动留轨迹，圆外红点被紫线拉回圆上（循环）
export const Ana4: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();

    // 轨迹（渐隐弧段）
    const ang = t * 0.9;
    for (let k = 1; k <= 14; k++) {
      ctx.globalAlpha = 0.3 * (1 - k / 14);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CX, CY, R, ang - k * 0.07, ang - (k - 1) * 0.07);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(CX + R * Math.cos(ang), CY + R * Math.sin(ang), 7, 0, Math.PI * 2);
    ctx.fill();

    // 圆外红点周期出现，被紫线拉回
    const cyc = (t % 3) / 3;
    if (cyc < 0.4) {
      const pull = Math.min(1, cyc / 0.3);
      const ox = CX + R + 46;
      const oy = CY - 34;
      const px = CX + R * Math.cos(-0.65);
      const py = CY + R * Math.sin(-0.65);
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + (px - ox) * pull, oy + (py - oy) * pull);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(ox + (px - ox) * pull, oy + (py - oy) * pull, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    text(ctx, '正交流形', CX, CY + R + 20, C.blue, 13, 'center');
    text(ctx, '每步都回到流形上', 370, 60, C.muted, 13, 'center');
    text(ctx, "RᵀR = I", 370, 84, C.green, 15, 'center');
  });

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ana4;
