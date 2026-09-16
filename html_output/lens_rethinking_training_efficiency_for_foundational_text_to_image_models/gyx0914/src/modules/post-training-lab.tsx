import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const stages = [
  {
    title: '准备提示词',
    short: 'Lens-RL-8K',
    detail: '先准备覆盖人物、动物、场景、文字、界面设计等多类需求的 8406 条提示词。覆盖面广，模型才不会只在少数题型上进步。',
    example: '示例：一只橘猫坐在蓝色椅子上。',
  },
  {
    title: '制定评分规则',
    short: 'GPT-4.1',
    detail: 'GPT-4.1 根据每条提示词生成 10 条有针对性的评分规则，再加 1 条检查整张图是否自然、结构是否合理的全局规则。',
    example: '示意规则：猫是橘色吗？椅子是蓝色吗？猫真的坐在椅面上吗？',
  },
  {
    title: '生成练习图片',
    short: 'Lens-Base',
    detail: '当前的 Lens-Base 根据这些提示词生成图片。论文每个优化步骤抽取 48 组“提示词＋规则”，每组生成 24 张不同分辨率的图片。',
    example: '同一要求可以得到多张不同图片；这里并没有一张预先指定的标准答案。',
  },
  {
    title: '按规则给奖励',
    short: 'GPT-4.1-mini',
    detail: '把生成图片和对应规则交给 GPT-4.1-mini 评估。它给出用于训练的奖励信号，反映图片满足要求、整体是否合理。',
    example: '示意：若猫没有坐在椅子上，相关规则的评估就会受到影响。',
  },
  {
    title: '继续优化模型',
    short: 'DiffusionNFT',
    detail: 'DiffusionNFT 利用奖励继续优化生成模型，让它更会遵守提示词、减少伪影并改善视觉质量。论文报告这一后训练阶段进行了 180 个优化步骤。',
    example: '奖励用于调整模型参数；不是在用户生成图片时临时修改模型。',
  },
];

export const PostTrainingLab: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  return <div className="lens-rl lens-widget">
    <div className="lens-widget-kicker">预训练完成后 · Lens-Base → Lens-RL</div>
    <p className="lens-widget-instruction">后训练像一次有检查标准的练习：点击下方五步，看奖励怎样从图片评估传回模型。</p>
    <div className="lens-rl-path" role="group" aria-label="后训练的五个环节">
      {stages.map((item, index) => <button key={item.title} type="button" className={`lens-rl-stage ${active === index ? 'is-active' : ''}`} onClick={() => setActive(index)} aria-pressed={active === index}>
        <span className="lens-rl-index">{index + 1}</span><strong>{item.title}</strong><small>{item.short}</small>
      </button>)}
    </div>
    <div className="lens-rl-detail" aria-live="polite">
      <div className="lens-rl-detail-heading"><span>第 {active + 1} 步</span><h5>{stage.title}</h5></div>
      <p>{stage.detail}</p>
      <div className="lens-rl-example"><b>帮助理解的示例</b><span>{stage.example}</span></div>
    </div>
    <div className="lens-rl-distinction"><b>不要混淆两种分数：</b>GPT-4.1-mini 的奖励用于后训练更新；下一模块展示的 GenEval 分数是训练完成后的外部测试结果。</div>
    <p className="lens-widget-source">依据：<a href="https://arxiv.org/html/2605.21573" target="_blank" rel="noopener noreferrer">Lens 论文第 2.4 节与表 1</a>。猫的例子和步骤卡片是教学示意，未实际运行模型或评分器。</p>
  </div>;
};
