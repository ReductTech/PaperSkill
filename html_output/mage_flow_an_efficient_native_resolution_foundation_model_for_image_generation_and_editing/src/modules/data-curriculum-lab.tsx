import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const dataStages = [
  ['来源与任务覆盖', '同时准备文生图数据与指令编辑数据，能力上限首先受数据覆盖决定。'],
  ['质量与一致性过滤', '过滤低质量、图文不一致和不适合目标能力的样本。'],
  ['描述与编辑指令', '用更具体的描述和可执行编辑指令，减少监督信号含糊。'],
  ['任务配比', '生成与编辑数据按训练阶段组合，避免一种能力完全挤占另一种能力。'],
] as const;

const curriculumStages = [
  ['低分辨率预训练', '先学习广泛视觉概念与基本图文对应，控制早期训练成本。'],
  ['逐级提高分辨率', '从较低分辨率向 512²、1024² 等阶段推进，并逐步收紧数据质量。'],
  ['高质量 SFT', '用更严格的数据与任务配比校准生成和编辑能力。'],
  ['能力后训练', '再进入 Diffusion-NFT；它建立在基础模型已经学到的能力之上。'],
] as const;

export function DataCurriculumLab({ chapterId }: WidgetProps) {
  const isCurriculum = chapterId.includes('curriculum');
  const stages = isCurriculum ? curriculumStages : dataStages;
  const [active, setActive] = useState(0);
  return (
    <div className="framework-lab">
      <div className="curriculum-steps" role="group" aria-label={isCurriculum ? '课程学习阶段' : '数据工程阶段'}>
        {stages.map(([title], index) => (
          <button className={active === index ? 'active' : ''} onClick={() => setActive(index)} key={title}>
            <span>{index + 1}</span>{title}
          </button>
        ))}
      </div>
      <div className="framework-detail">
        <b>{stages[active][0]}</b>
        <p>{stages[active][1]}</p>
      </div>
      <div className="feedback good">
        {isCurriculum
          ? '课程学习安排“先学什么、后学什么”：先建立广泛概念，再提高分辨率、数据质量与任务难度。'
          : '数据工程决定模型能够接触哪些概念、文字与编辑操作，并直接影响能力覆盖范围。'}
      </div>
    </div>
  );
}
