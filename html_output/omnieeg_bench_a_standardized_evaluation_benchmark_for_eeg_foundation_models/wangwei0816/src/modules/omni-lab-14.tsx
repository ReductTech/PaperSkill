import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STEPS = [
  { label: '论文观测', short: '0 项锁定' },
  { label: '匹配数据', short: '1 项锁定' },
  { label: '再匹配时期', short: '2 项锁定' },
  { label: '再匹配设计', short: '3 项锁定' },
] as const;

const FACTORS = [
  {
    id: 'scale',
    label: '模型规模',
    left: '较小',
    right: '较大',
    lockAt: 4,
    matched: '保留差异',
  },
  {
    id: 'data',
    label: '预训练数据',
    left: '较窄',
    right: '较广',
    lockAt: 1,
    matched: '同一数据配方',
  },
  {
    id: 'era',
    label: '模型年代',
    left: '较早',
    right: '较新',
    lockAt: 2,
    matched: '同一时期',
  },
  {
    id: 'design',
    label: '架构与训练目标',
    left: '方案 A',
    right: '方案 B',
    lockAt: 3,
    matched: '同一设计',
  },
] as const;

export const OmniLab14: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const remaining = 3 - step;
  const identifiable = step === 3;

  return <div className="oi-unit oc-causal-v2">
    <div className="oc-paper-observation">
      <div>
        <span>论文真实统计</span>
        <b>模型规模与更好名次相关</b>
      </div>
      <strong>中位 ρ = −0.21</strong>
      <small>Wilcoxon p = 7.0×10⁻⁴</small>
    </div>

    <div className="oc-match-steps" role="radiogroup" aria-label="逐步锁定规模之外的模型差异">
      {STEPS.map((item, index) => <button
        type="button"
        key={item.label}
        role="radio"
        aria-checked={step === index}
        className={step === index ? 'active' : step > index ? 'done' : ''}
        onClick={() => setStep(index)}
      >
        <span>{index}</span>
        <b>{item.label}</b>
        <small>{item.short}</small>
      </button>)}
    </div>

    <div className="oi-caption">
      <span>教学配对：逐项固定规模之外的差异</span>
      <strong>{identifiable ? '识别条件齐备，效应值仍待实验' : `仍有 ${remaining} 项混杂`}</strong>
    </div>

    <div className="oc-match-stage">
      <div className="oc-match-header" aria-hidden="true">
        <span>较小模型</span><span>是否一致</span><span>较大模型</span>
      </div>
      <div className="oc-match-body">
        {FACTORS.map((factor) => {
          const matched = step >= factor.lockAt;
          const isScale = factor.id === 'scale';
          const leftValue = matched ? factor.matched : factor.left;
          const rightValue = matched ? factor.matched : factor.right;
          const status = isScale
            ? identifiable ? '唯一差异' : '目标差异'
            : matched ? '已锁定' : '同时变化';
          return <div className={`oc-match-row ${isScale ? 'scale' : matched ? 'matched' : 'confounded'}`} key={factor.id}>
            <div className="oc-factor-name"><span>{factor.label}</span></div>
            <div className="oc-model-value left"><b>{leftValue}</b></div>
            <div className="oc-match-link" aria-hidden="true"><i /><span>{status}</span><i /></div>
            <div className="oc-model-value right"><b>{rightValue}</b></div>
          </div>;
        })}
      </div>

      <div className={`oc-match-outcome ${identifiable ? 'ready' : ''}`}>
        <span>{identifiable ? '可识别的比较结构' : `仍有 ${remaining} 项混杂`}</span>
        <b>{identifiable ? '只保留规模差异，独立效应仍待测量' : '排名差暂时无法归给参数量'}</b>
        <p>{identifiable
          ? '论文没有报告这组匹配实验，因此这里不填入虚构的效应值。'
          : '数据、模型年代或模型设计仍可解释两组之间的表现差异。'}</p>
      </div>
      <div className="oc-source-line">论文报告观测关联；配对过程用于解释控制变量原理，不对应论文中的新增实验数据。</div>
    </div>

    <div className={`oi-feedback ${identifiable ? 'good' : 'neutral'}`}><b>{identifiable
      ? '控制条件回答“怎样才能测规模效应”，问号回答“论文是否已经测过”。OmniEEG-Bench 给出了前面的相关，尚未提供后面的匹配效应值。'
      : '当前比较中，较大模型往往也使用更丰富的数据、更新的训练方案或不同架构。排名改善可以沿多条路径产生，ρ 无法把贡献分配给参数量。'}</b></div>
  </div>;
};
