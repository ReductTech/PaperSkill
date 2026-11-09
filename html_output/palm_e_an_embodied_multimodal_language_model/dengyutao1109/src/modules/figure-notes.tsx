import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 通用图表精读板：三张可点击要点卡（前提 / 读法 / 边界），配合上方论文原图与说明文字使用。
// 不内置论文数值，具体读数由模块 desc 与原图承担，避免与特定章节数据错配。
const NOTES = [
  {
    title: '先看前提',
    desc: '读图前先确认数据口径：规模档位、是否预训练、冻结或微调、单域或完整混合；前提不同，分数不能横向直接比较。',
  },
  {
    title: '再读数值',
    desc: '对照原图的行列、图例与单位读出报告值，注意是成功率、相对退化还是 F1；不要把相对退化百分比说成保留率。',
  },
  {
    title: '最后守边界',
    desc: '这些数字只在论文报告的设定与任务内成立，不外推到未测量的场景；定性样例不等同于大样本统计结论。',
  },
];

/**
 * 论文图表精读辅助板：点击卡片展开对应读图要点。
 * 原图由 module.figure 渲染，本组件只提供通用的读图三步提示。
 */
export const FigureNotes: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [open, setOpen] = useState<number | null>(0);
  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <div className="widget-grid three" id={`${chapterId}-${moduleId}`} role="group" aria-label="图表读图要点">
      {NOTES.map((n, i) => (
        <button
          key={n.title}
          type="button"
          className={`tap-card ${open === i ? 'active' : ''}`}
          aria-pressed={open === i}
          onClick={() => toggle(i)}
        >
          <div className="card-title">{n.title}</div>
          {open === i && <div className="card-sub">{n.desc}</div>}
        </button>
      ))}
    </div>
  );
};

export default FigureNotes;
