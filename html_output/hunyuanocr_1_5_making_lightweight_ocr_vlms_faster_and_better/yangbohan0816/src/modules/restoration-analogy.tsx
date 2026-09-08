import React from 'react';
import { PaperCanvas, PALETTE, clearDesk, drawManuscript, drawTool, drawGuideLine, drawTargetMark, drawSceneLabel, type PaperWidgetProps } from './cascade-vs-unified';

const actions = [
  { kind: 'lens' as const, label: '扫描褪色文字' }, { kind: 'lens' as const, label: '聚焦细小字形' },
  { kind: 'stamp' as const, label: '验证草拟前缀' }, { kind: 'tag' as const, label: '测量位置权重' },
  { kind: 'tag' as const, label: '标记能力薄弱页' }, { kind: 'brush' as const, label: '修复一个字形' },
  { kind: 'stamp' as const, label: '按任务规则校对' }, { kind: 'clip' as const, label: '夹稳整页结构' },
  { kind: 'lens' as const, label: '看清扰动字符' }, { kind: 'tag' as const, label: '同尺比较结果' }
];

export const RestorationAnalogy: React.FC<PaperWidgetProps> = ({ chapterId }) => {
  const n = Math.max(1, Math.min(10, Number(chapterId.replace('chap-', '')) || 1)); const action = actions[n - 1];
  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearDesk(ctx, 244, 130); drawManuscript(ctx, 22, 18, 150, 82, PALETTE.light); const p = (Math.sin(time / 480) + 1) / 2;
    if (n === 10) { for (let i = 0; i < 3; i++) { const x = 32 + p * (112 - i * 10); ctx.fillStyle = i === 0 ? PALETTE.green : PALETTE.blue; ctx.fillRect(x, 34 + i * 18, 8, 14); } drawGuideLine(ctx, 30, 90, 160, 90, PALETTE.axis, 2); }
    else { const x = 48 + p * 94; const y = n === 4 ? 84 : 62; drawTool(ctx, x, y, n === 9 && p > .45 ? PALETTE.green : n === 5 ? PALETTE.orange : PALETTE.blue, action.kind); }
    if (n === 3) drawTargetMark(ctx, 148, 62); if (n === 8) drawGuideLine(ctx, 38, 84, 154, 84, PALETTE.green, 3);
    drawSceneLabel(ctx, action.label, 122, 118, PALETTE.ink, 'center');
  };
  return <PaperCanvas width={244} height={130} draw={draw} ariaLabel={action.label} />;
};

export default RestorationAnalogy;
