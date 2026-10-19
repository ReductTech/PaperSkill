import React, { useEffect } from 'react';
import { useCanvas } from './useCanvas';
import { C, FLAT, clamp, clearScene, frame, hist, text } from './kit';

const W = 520;
const H = 200;
const OX = 250;
const AY = 150;
// 新方法：旋转后步长收窄 4.8 倍（刻度致密）
const S_NEW_PX = 4.2;

// hero-new：SpinQuant 学习旋转——摊平直方图 + 恢复正常的刻度
export const HeroNew: React.FC = () => {
  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    // 刻度尺（步长收窄，16 级桶密集排列）
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, AY);
    ctx.lineTo(496, AY);
    ctx.stroke();
    for (let b = -30; b <= 30; b++) {
      const bx = OX + b * S_NEW_PX;
      if (bx < 24 || bx > 496) continue;
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, AY - 5);
      ctx.lineTo(bx, AY + 5);
      ctx.stroke();
    }
    text(ctx, '旋转摊平分布 → 步长收窄，正常值各得其所', OX, AY + 26, C.green, 12.5, 'center');

    // 旋转框架（主题角标，缓慢转动）
    frame(ctx, 462, 46, 22, t * 0.7, C.green);

    // 摊平直方图（微呼吸）
    const breathe = 1 + Math.sin(t * 2 + 1) * 0.05;
    hist(
      ctx,
      FLAT.map((v) => clamp(v * breathe, 0, 1)),
      OX - 10 * 9.4,
      AY - 78,
      10 * 2 * 9.4,
      70,
      C.green
    );

    // 读数
    text(ctx, 'SpinQuant 学习旋转', 24, 26, C.green, 14);
    text(ctx, '64.0', 496, 26, C.green, 20, 'right');
    text(ctx, '距全精度仅 2.9（FP 66.9，0-shot 均值）', 496, 46, C.muted, 11, 'right');
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

export default HeroNew;
