import React, { useEffect } from 'react';
import { useCanvas } from './useCanvas';
import { C, SPIKES, clamp, clearScene, hist, text } from './kit';

const W = 520;
const H = 200;
const OX = 250;
const AY = 150;
// 旧方法：outlier 把 4-bit 步长拉大（像素比例，刻度稀疏）
const S_OLD_PX = 20;

// hero-old：传统直接 W4A4KV4——尖峰直方图 + 被拉爆的刻度
export const HeroOld: React.FC = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    // 刻度尺（16 级桶，间距被 outlier 撑大）
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, AY);
    ctx.lineTo(496, AY);
    ctx.stroke();
    for (let b = -7; b <= 7; b++) {
      const bx = OX + b * S_OLD_PX;
      ctx.strokeStyle = b * S_OLD_PX > 190 ? C.red : C.axis;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, AY - 6);
      ctx.lineTo(bx, AY + 6);
      ctx.stroke();
    }
    text(ctx, '步长被 outlier 拉大 → 正常值挤进 0 附近', OX, AY + 26, C.red, 12.5, 'center');

    // 尖峰直方图（双端尖峰，微呼吸）
    const breathe = 1 + Math.sin(t * 2) * 0.04;
    hist(
      ctx,
      SPIKES.map((v) => clamp(v * breathe, 0, 1)),
      OX - 10 * 7.2,
      AY - 96,
      10 * 2 * 7.2,
      88,
      '#7d8aa0',
      (_i, v) => (v > 0.55 ? C.red : null)
    );

    // outlier 点（量化范围边缘，红色脉冲）
    const px = OX + 7 * S_OLD_PX;
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(px, AY - 24, 8 + Math.sin(t * 4) * 1.6, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'outlier', px + 2, AY - 44, C.red, 12, 'center');

    // 读数
    text(ctx, '直接 W4A4KV4', 24, 26, C.red, 14);
    text(ctx, '37.1 / 36.8', 496, 26, C.red, 20, 'right');
    text(ctx, 'RTN / GPTQ（LLaMA-2 7B，0-shot 均值）', 496, 46, C.muted, 11, 'right');
  });

  // setupCanvas 会钉死像素宽度；Hero 列更窄，改回流式尺寸避免被裁切
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.style.width = '100%';
    c.style.height = 'auto';
  });

  return <canvas ref={ref} width={W} height={H} />;
};

export default HeroOld;
