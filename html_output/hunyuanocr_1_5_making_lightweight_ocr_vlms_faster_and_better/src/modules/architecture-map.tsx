import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawSceneLabel, drawTargetMark, Feedback, roundedRect } from './cascade-vs-unified';

const blocks = [
  { name: 'Hunyuan‑ViT', role: '读取原生分辨率页面', color: PALETTE.blue },
  { name: '自适应 MLP', role: '把视觉特征对齐到 token 空间', color: PALETTE.orange },
  { name: 'Hunyuan‑0.5B', role: '自回归生成 Markdown、HTML、LaTeX 等结构化结果', color: PALETTE.purple },
  { name: 'DFlash 旁路', role: '读取目标隐藏状态，并行草拟 B=16 个候选，再交回目标模型校验', color: PALETTE.green }
];

export const ArchitectureMap: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [active, setActive] = useState(0); const block = blocks[active];
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 340); drawSceneLabel(ctx, '目标路径负责答案，DFlash 只是一条加速旁路', 280, 24, PALETTE.ink, 'center');
    const main = blocks.slice(0,3); main.forEach((item, i) => { const x = 38 + i * 176; roundedRect(ctx, x, 70, 132, 72, 10); ctx.fillStyle = i === active ? item.color : '#fff'; ctx.fill(); ctx.strokeStyle = item.color; ctx.lineWidth = 3; ctx.stroke(); drawSceneLabel(ctx, item.name, x + 66, 101, i === active ? '#fff' : item.color, 'center'); drawSceneLabel(ctx, i === 0 ? '视觉编码' : i === 1 ? '模态连接' : '目标解码', x + 66, 126, i === active ? '#fff' : PALETTE.muted, 'center'); if (i < 2) drawGuideLine(ctx, x + 133, 106, x + 175, 106, PALETTE.blue, 4); });
    drawSceneLabel(ctx, '端到端目标路径', 280, 163, PALETTE.blue, 'center');
    drawGuideLine(ctx, 456, 145, 456, 202, PALETTE.green, 4); drawGuideLine(ctx, 456, 245, 456, 274, PALETTE.green, 4); drawGuideLine(ctx, 456, 274, 370, 274, PALETTE.green, 4);
    roundedRect(ctx, 286, 202, 244, 58, 10); ctx.fillStyle = active === 3 ? PALETTE.green : '#fff'; ctx.fill(); ctx.strokeStyle = PALETTE.green; ctx.lineWidth = 4; ctx.stroke(); drawSceneLabel(ctx, 'DFlash：并行草拟候选块', 408, 237, active === 3 ? '#fff' : PALETTE.green, 'center');
    roundedRect(ctx, 44, 213, 214, 70, 10); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = PALETTE.purple; ctx.lineWidth = 3; ctx.stroke(); drawSceneLabel(ctx, '目标模型并行校验', 151, 241, PALETTE.purple, 'center'); drawSceneLabel(ctx, '接受最长有效前缀', 151, 265, PALETTE.muted, 'center'); drawGuideLine(ctx, 284, 246, 260, 246, PALETTE.green, 4);
    drawTargetMark(ctx, 280, 307, block.color); drawSceneLabel(ctx, block.role, 280, 332, block.color, 'center');
  };
  return <div><PaperCanvas height={340} draw={draw} ariaLabel={`${chapterId}-${moduleId} 目标模型主路径与 DFlash 旁路`} />
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{blocks.map((item, i) => <button key={item.name} className={i === active ? 'active' : ''} onClick={() => setActive(i)}>{item.name}</button>)}</div>
    <Feedback tone="green">Hunyuan‑ViT、Adaptive MLP 和 Hunyuan‑0.5B 构成端到端目标模型；DFlash 不接管答案，只用闲置算力草拟候选并接受目标模型校验。</Feedback></div>;
};

export default ArchitectureMap;
