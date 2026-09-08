import React from 'react';
import {
  PaperCanvas,
  PALETTE,
  clearDesk,
  drawGuideLine,
  drawManuscript,
  drawSceneLabel,
  drawTargetMark,
  drawTool,
  roundedRect,
  type PaperWidgetProps,
} from './cascade-vs-unified';

const walls = [
  { wall: '长输出慢', answer: 'DFlash', detail: '逐 token → 并行草拟后目标校验' },
  { wall: '长尾能力窄', answer: '数据 + 训练', detail: '弱点 → 定向数据要求与三阶段训练' },
  { wall: '视觉忠实性不足', answer: '奖励 + CHAOS', detail: '常识纠错 → 所见文字优先' },
];

export const HeroRestoration: React.FC<PaperWidgetProps> = ({ moduleId }) => {
  const isOld = moduleId === 'old';
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearDesk(ctx, 300, 150);
    const index = Math.floor(time / 1800) % walls.length;
    const item = walls[index];
    const tone = isOld ? PALETTE.red : PALETTE.green;

    drawManuscript(ctx, 18, 18, 92, 94, isOld ? PALETTE.blue : PALETTE.green);
    drawTool(ctx, 64, 69, tone, isOld ? 'lens' : 'stamp');
    drawGuideLine(ctx, 120, 66, 154, 66, tone, 4);
    drawTargetMark(ctx, 156, 66, tone);

    roundedRect(ctx, 168, 24, 118, 82, 10);
    ctx.fillStyle = isOld ? '#fde8ec' : '#e3f4ea'; ctx.fill();
    ctx.strokeStyle = tone; ctx.lineWidth = 3; ctx.stroke();
    drawSceneLabel(ctx, isOld ? item.wall : item.answer, 227, 54, tone, 'center');
    drawSceneLabel(ctx, isOld ? '1.0 仍有缺口' : '1.5 对应回答', 227, 80, PALETTE.ink, 'center');
    drawSceneLabel(ctx, item.detail, 150, 132, PALETTE.muted, 'center');
    drawSceneLabel(ctx, '约 1B · 端到端 · 目标模型裁决', 150, 146, PALETTE.blue, 'center');
  };
  return <PaperCanvas width={300} height={150} draw={draw} ariaLabel={isOld ? 'HunyuanOCR-1.0 三类剩余问题' : 'HunyuanOCR-1.5 对应解决方案'} />;
};

export default HeroRestoration;
