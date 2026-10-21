import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, SPIKES, clearScene, frame, hist, text } from './kit';

const W = 560;
const H = 140;

// ana-2：框架带着尖峰直方图旋转，输出差恒为 0（循环）
export const Ana2: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    const th = ((1 - Math.cos((t % 5) * ((Math.PI * 2) / 5))) / 2) * (Math.PI / 2);

    ctx.save();
    ctx.translate(150, 66);
    ctx.rotate(th);
    hist(ctx, SPIKES, -120, -52, 240, 60, C.blue, (i) =>
      i < 3 || i >= SPIKES.length - 3 ? C.red : null
    );
    ctx.restore();
    frame(ctx, 150, 66, 58, th, C.blue);
    text(ctx, `θ=${Math.round((th * 180) / Math.PI)}°`, 150, 132, C.blue, 13, 'center');

    // 等式与读数
    text(ctx, 'Y = XW = (XR)(RᵀW)', 360, 52, C.ink, 15, 'center');
    text(ctx, '输出差 0.000', 360, 82, C.green, 15, 'center');
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(258, 82, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(254.5, 82);
    ctx.lineTo(257, 84.5);
    ctx.lineTo(261.5, 79);
    ctx.stroke();
  });

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ana2;
