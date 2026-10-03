import { useState } from 'react';
import { C, CanvasScene, Controls, Chip, Feedback, line, label } from './scene-kit';

const categories = [
  { title: '推理错误', react: 47, cot: 16, detail: '检索到信息后，也可能错误推断或整合事实。', feedback: '在抽样失败轨迹中，ReAct 推理错误占 47%；这是失败类型占比，不是总体错误率。' },
  { title: '搜索错误', react: 23, cot: null, detail: '检索可能找不到相关信息，或走入错误的查询路径。', feedback: 'ReAct 搜索错误占 23%；CoT 没有检索，此项不适用，不能记为 0%。' },
  { title: '幻觉', react: 0, cot: 56, detail: '人工分析关注没有依据的内容；外部证据能帮助约束答案，但仍需核验。', feedback: '该抽样中 ReAct 幻觉为 0%，不代表 ReAct 不会幻觉，也不是总体幻觉率的估计。' },
  { title: '标签歧义', react: 29, cot: 28, detail: '评测标签可能有歧义，未匹配标准答案不一定等同于推理失败。', feedback: '标签歧义是独立的失败类型；不能将所有未匹配答案都解释为推理失败。' },
];

export function FailureModes() {
  const [selected, setSelected] = useState(0);
  const item = categories[selected];
  return <div>
    <CanvasScene key={selected} label={`${item.title}：抽样失败案例中，ReAct ${item.react}%，CoT ${item.cot === null ? '不适用' : `${item.cot}%`}`} draw={(ctx,_w,_h,time) => {
      const progress=Math.min(1,Math.max(0,time/1100));
      for (let i = 0; i <= 4; i++) line(ctx, 100 + i * 220, 40, 100 + i * 220, 228, C.border, 1);
      [item.react, item.cot].forEach((value, index) => {
        const y = 72 + index * 85;
        label(ctx,index===0?'ReAct':'CoT',13,y+25,index===0?C.blue:C.purple,19);
        label(ctx,value===null?'不适用':`${value}%`,value===null?440:Math.max(117,110+value*8.8),y+25,C.text,18);
        if (value === null) {
          ctx.setLineDash([6, 6]); ctx.strokeStyle = C.contour; ctx.lineWidth = 2; ctx.strokeRect(100, y, 880, 36); ctx.setLineDash([]);
          line(ctx, 100, y, 980, y + 36, C.contour, 2);
        } else {
          ctx.fillStyle = C.light; ctx.globalAlpha = 0.2; ctx.fillRect(100, y, 880, 36); ctx.globalAlpha = 1;
          ctx.fillStyle = index === 0 ? C.blue : C.purple; ctx.fillRect(100, y, value * 8.8 * progress, 36);
          if (value === 0) { ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.strokeRect(100, y, 4, 36); }
        }
      });
      label(ctx, '0%', 92, 260, C.muted, 20); label(ctx, '100%', 928, 260, C.muted, 20);
    }} />
    <p>条形由上到下：<strong style={{ color: C.blue }}>ReAct</strong>、<strong style={{ color: C.purple }}>CoT</strong>；划线空框表示不适用。</p>
    <Controls>{categories.map((category, index) => <Chip key={category.title} active={selected === index} onClick={() => setSelected(index)}>{category.title}</Chip>)}</Controls>
    <div style={{ minHeight: 85 }} aria-live="polite"><p><strong>{item.title}：</strong>ReAct {item.react}%；CoT {item.cot === null ? '不适用' : `${item.cot}%`}。{item.detail}</p></div>
    <Feedback>{item.feedback}</Feedback>
  </div>;
}
