import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawManuscript, drawSceneLabel, drawTargetMark, drawTool, drawWrappedLabel, Feedback, roundedRect } from './cascade-vs-unified';

const tasks = [
  { id: 'page', label: '文档解析', note: '1.0 已有核心能力；1.5 在 OmniDocBench v1.6 继续强化', group: '继承并增强', benchmark: 'OmniDocBench', tone: PALETTE.blue },
  { id: 'spot', label: '文字定位', note: '1.0 已有核心能力；1.5 增加无文字负样本处理', group: '继承并增强', benchmark: 'Spotting Benchmark', tone: PALETTE.blue },
  { id: 'ancient', label: '古文字', note: '面向七类历史字形的重点边界扩展', group: '1.5 重点扩展', benchmark: 'Chronicles-OCR', tone: PALETTE.green },
  { id: 'low', label: '低资源语言', note: '训练数据覆盖 331 种语言；MORE 基准评测 149 种', group: '1.5 重点扩展', benchmark: 'MORE', tone: PALETTE.green },
  { id: 'multi', label: '多页问答', note: '从单页 OCR 扩展到跨页检索、比较与证据聚合', group: '1.5 重点扩展', benchmark: 'DUDE', tone: PALETTE.green },
  { id: 'faith', label: '视觉忠实性', note: '用无意义扰动词检查语言先验是否覆盖视觉证据', group: '新增可靠性监测', benchmark: 'CHAOS-Bench', tone: PALETTE.orange }
];

export const CapabilityScope: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [active, setActive] = useState(0);
  const item = tasks[active];
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 286); drawSceneLabel(ctx, '不要把“模型会做的事”都当成 1.5 新贡献', 280, 24, PALETTE.ink, 'center');
    drawManuscript(ctx, 42, 52, 162, 142, item.tone); drawTool(ctx, 123, 123, item.tone, active === 1 ? 'tag' : active === 2 ? 'lens' : active === 3 ? 'brush' : 'stamp');
    drawGuideLine(ctx, 222, 123, 315, 123, item.tone, 5);
    roundedRect(ctx, 294, 52, 234, 152, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = item.tone; ctx.lineWidth = 3; ctx.stroke();
    drawSceneLabel(ctx, item.group, 411, 82, item.tone, 'center'); drawSceneLabel(ctx, item.label, 411, 112, PALETTE.ink, 'center');
    drawWrappedLabel(ctx, item.note, 411, 140, 204, PALETTE.muted, 'center', 18); drawSceneLabel(ctx, `评测：${item.benchmark}`, 411, 185, item.tone, 'center');
    drawTargetMark(ctx, 411, 192, item.tone); drawSceneLabel(ctx, '蓝：继承并增强 · 绿：重点扩展 · 橙：新增可靠性监测', 280, 250, PALETTE.muted, 'center');
    drawSceneLabel(ctx, '完整模型还覆盖信息抽取、翻译、OCR QA 与视频字幕等既有能力', 280, 275, PALETTE.muted, 'center');
  };
  return <div><PaperCanvas height={286} draw={draw} ariaLabel={`${chapterId}-${moduleId} 1.0 基础与 1.5 扩展范围`} />
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tasks.map((task, i) => <button key={task.id} className={i === active ? 'active' : ''} onClick={() => setActive(i)}>{task.label}</button>)}</div>
    <Feedback tone={item.group === '继承并增强' ? 'blue' : 'green'}>{item.note}。这项定位为“{item.group}”，不能把整个能力都写成 1.5 首次提出。</Feedback></div>;
};

export default CapabilityScope;
