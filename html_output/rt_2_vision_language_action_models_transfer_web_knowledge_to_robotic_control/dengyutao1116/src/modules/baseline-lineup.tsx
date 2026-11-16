import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { PAL } from './kit';

type Baseline = {
  id: string;
  name: string;
  color: string;
  role: string;
  question: string;
  facts: string[];
  detail: string;
};

const baselines: Baseline[] = [
  {
    id: 'rt1',
    name: 'RT-1',
    color: PAL.orange,
    role: '强策略基线',
    question: '先量纯动作能力有多强',
    facts: ['35M 参数', '同一批机器人数据', '不使用 VLM 预训练'],
    detail: 'RT-1 是同一间厨房中已经很强的机器人策略。它负责回答：如果不引入网页知识，只靠机器人数据训练，动作能力能到什么水平。RT-2 与它在已见任务上接近，主要差距体现在新物体、新背景和新环境。',
  },
  {
    id: 'vc1',
    name: 'VC-1',
    color: PAL.blue,
    role: '视觉表征路线',
    question: '只换视觉特征够不够',
    facts: ['RT-1 backbone', '输入换成 VC-1', '动作仍由 RT-1 输出'],
    detail: 'VC-1 把策略输入换成另一种预训练视觉表征，但动作模型仍是 RT-1 backbone。它检验的是“更好的视觉特征”能否单独解决泛化问题，而不是把网页语言知识直接接进动作模型。',
  },
  {
    id: 'r3m',
    name: 'R3M',
    color: PAL.purple,
    role: '视觉表征对照',
    question: '换一种视觉表征再量一次',
    facts: ['同一 backbone', '输入换成 R3M', '与 VC-1 控制变量'],
    detail: 'R3M 与 VC-1 成对出现。两者都保留 RT-1 式策略，只改变输入视觉表征，因此可以比较不同视觉预训练路线本身能带来多少泛化收益。',
  },
  {
    id: 'moo',
    name: 'MOO',
    color: PAL.green,
    role: 'VLM 感知路线',
    question: 'VLM 只做感知够不够',
    facts: ['VLM 生成语义图', '语义图再喂 RT-1', '动作不由 VLM 直接输出'],
    detail: 'MOO 让 VLM 负责把场景转成语义图，再把这张图交给 RT-1 输出动作。它代表“VLM 做感知、策略做动作”的分工路线；RT-2 则让同一个模型直接输出动作 token。',
  },
];

export const BaselineLineup: React.FC<WidgetProps> = () => {
  const [selectedId, setSelectedId] = useState('rt1');
  const selected = baselines.find((item) => item.id === selectedId)!;

  return (
    <div className="bl52">
      <div className="bl52-common">
        <b>共同前提</b>
        <span>四个基线使用完全相同的机器人数据</span>
        <small>比较的是“怎么用预训练”，不是“谁的数据更多”</small>
      </div>

      <div className="bl52-grid">
        {baselines.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`bl52-card ${selectedId === item.id ? 'is-active' : ''}`}
            onClick={() => setSelectedId(item.id)}
            style={{ '--accent': item.color } as React.CSSProperties}
          >
            <span className="bl52-name">{item.name}</span>
            <span className="bl52-role">{item.role}</span>
            <strong>{item.question}</strong>
            <span className="bl52-tags">
              {item.facts.map((fact) => <i key={fact}>{fact}</i>)}
            </span>
          </button>
        ))}
      </div>

      <section className="bl52-detail" style={{ '--accent': selected.color } as React.CSSProperties}>
        <div>
          <span>{selected.name}</span>
          <b>{selected.role}</b>
        </div>
        <p>{selected.detail}</p>
      </section>
    </div>
  );
};

export default BaselineLineup;
