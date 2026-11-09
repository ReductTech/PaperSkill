import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const SOLVED = [
  { title: '单模型覆盖多任务', desc: '一个联合模型同时完成具身规划、视觉问答、图像描述与纯语言任务。' },
  { title: '跨域迁移收益', desc: '跨任务、跨具身形态联合训练带来迁移，低数据 ViT-4B 规划翻倍以上。' },
  { title: '规模抗遗忘', desc: '规模越大，端到端微调后相对语言退化越轻（12B 87.3% → 84B 61.6% → 562B 3.9%）。' },
  { title: '真机长程可完成', desc: '真机长程序列可完成，含扰动后的恢复执行。' },
];

const OPEN = [
  { title: '冻结路线偶有吃力', desc: '冻结 LLM、只训编码器路线在需要更具身数据的任务上偶有吃力，集中在 Language-Table 少样本。' },
  { title: 'OSRT 待大规模视觉数据', desc: 'OSRT 3D 物体表示尚未结合大规模视觉数据，论文列为未来工作。' },
  { title: '涌现尚需专门验证', desc: '562B 出现多图提示与链式思维推理，属定性涌现观察，未经专门训练验证。' },
  { title: '低层执行仍依赖既有策略', desc: '模型输出高层指令，闭环执行仍依赖既有策略，并非直接关节控制。' },
];

/**
 * §8 静态复盘：左绿已验证结果、右红开放问题；点击条目展开对应说明。
 * 记录论文自陈局限，不评判未报告的未来工作，也不否定冻结路线在语言保留上的价值。
 */
export const LimitationRecap: React.FC<WidgetProps> = (_props) => {
  const [open, setOpen] = useState<{ side: 'solved' | 'open'; idx: number } | null>(null);

  const toggle = (side: 'solved' | 'open', idx: number) =>
    setOpen((prev) => (prev && prev.side === side && prev.idx === idx ? null : { side, idx }));

  const renderCol = (side: 'solved' | 'open', items: typeof SOLVED, head: string, color: string) => (
    <div className="recap-col">
      <h4 style={{ color }}>{head}</h4>
      <div className="widget-grid" style={{ gap: 8 }}>
        {items.map((item, idx) => {
          const isOpen = open && open.side === side && open.idx === idx;
          return (
            <button
              key={item.title}
              type="button"
              className={`tap-card ${isOpen ? 'active' : ''}`}
              style={{ padding: '10px 12px' }}
              aria-pressed={!!isOpen}
              onClick={() => toggle(side, idx)}
            >
              <div className="card-title" style={{ fontSize: 14 }}>{item.title}</div>
              {isOpen && <div className="card-sub" style={{ marginTop: 4 }}>{item.desc}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="recap-board">
      {renderCol('solved', SOLVED, '论文已验证结果', '#228d5c')}
      {renderCol('open', OPEN, '论文自陈的开放问题', '#c43f52')}
    </div>
  );
};

export default LimitationRecap;
