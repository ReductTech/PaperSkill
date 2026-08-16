import React from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, rounded, label, arrow, token, pacedPhase } from './studio-kit';
export const HeroContrast: React.FC<WidgetProps> = ({ moduleId }) => {
  const isOld = moduleId === 'old';
  const startedAt = React.useRef<number | null>(null);
  const ref = useCanvas((ctx, time) => {
    if (startedAt.current === null) startedAt.current = time;
    const p = pacedPhase(time - startedAt.current, 18000);
    ctx.clearRect(0, 0, 360, 190); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 360, 190);
    if (isOld) {
      ['理解', '视频', '控制'].forEach((n, i) => {
        rounded(ctx, 24 + i * 112, 72, 82, 50, 9, C.white, i === 2 ? C.red : C.line);
        label(ctx, n, 65 + i * 112, 97, C.ink, 13);
        if (i < 2) arrow(ctx, 107 + i * 112, 97, 130 + i * 112, 97, i === 1 ? C.red : C.muted, 2);
      });
      const stage = Math.min(2, Math.floor(p * 3));
      const tokenX = 31 + stage * 112;
      token(ctx, tokenX, 29, 70, '', stage === 2 ? 'noisy' : 'clean');
      if (stage === 0) {
        label(ctx, '杯子 · 位置', tokenX + 35, 43, C.ink, 10);
        label(ctx, '目标', tokenX + 35, 58, C.ink, 10);
      } else {
        label(ctx, stage === 1 ? '杯子 · 目标' : '目标', tokenX + 35, 50, C.ink, stage === 1 ? 10 : 12);
      }
      if (stage === 2) label(ctx, '线索丢失', 292, 149, C.red, 12);
    } else {
      rounded(ctx, 27, 69, 132, 58, 10, '#eef4fb', C.blue); rounded(ctx, 202, 69, 132, 58, 10, '#f5f0ff', C.purple);
      label(ctx, 'AR 推理塔', 93, 98, C.blue, 14); label(ctx, 'DM 生成塔', 268, 98, C.purple, 14);
      arrow(ctx, 159, 98, 202, 98, C.blue, 4);
      const x = 35 + p * 240; token(ctx, x, 29, 72, '完整 token', 'ar');
      if (p > .72) { rounded(ctx, 238, 139, 74, 28, 7, '#e9f6ed', C.green); label(ctx, '闭环完成', 275, 153, C.green, 11); }
    }
  }, 360, 190, [isOld], true);
  return <canvas ref={ref} width={360} height={190} aria-label={isOld ? '传统多模型链路动画' : 'Cosmos 3 统一序列动画'} />;
};
