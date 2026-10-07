import React, { useState } from 'react';
import { RecallBars } from './recall-bars';

const configurations = [
  { label: '无正则 · 无增强', value: 25.88, title: '起点：少样本表达容易过拟合', explanation: '作者去掉正则与增强，检查只优化概念向量是否足够。这个配置的名称 recall 为 25.88%，说明完整方法中的泛化措施不能被忽略。' },
  { label: '有正则 · 无增强', value: 72.77, title: '加入正则：相对起点 +46.89 个百分点', explanation: '保留正则后，recall 从 25.88% 提高到 72.77%。这支持正则措施在该设置下的作用；原表没有分别隔离范数处理与注意力损失。' },
  { label: '完整：正则 + 增强', value: 84.87, title: '再加入增强：相对上一配置 +12.10 个百分点', explanation: '正则与增强一起使用达到 84.87%。与有正则、无增强的配置相比，进一步提高 12.10 个百分点，支持训练增强的作用。' },
];

export function AblationExplorer() {
  const [selected, setSelected] = useState(0);
  const record = configurations[selected];
  return (
    <div className="mv-widget" data-testid="ablation-explorer">
      <p className="mv-scope-note">BLIP-2 · Personalized Captioning · 5 物品 + 5 人物 · 五次随机划分</p>
      <div className="mv-controls" role="group" aria-label="消融实验配置">
        {configurations.map((configuration, index) => <button key={configuration.label} className={'mv-button ' + (selected === index ? 'mv-selected' : '')} aria-pressed={selected === index} onClick={() => setSelected(index)}>{configuration.label}</button>)}
      </div>
      <div className="mv-detail" aria-live="polite"><small>当前配置 · Concept-name recall ↑</small><div className="mv-metric-value">{record.value.toFixed(2)}<span>%</span></div><h5>{record.title}</h5></div>
      <RecallBars rows={configurations.map((configuration, index) => ({ ...configuration, selected: selected === index, paperMethod: index === 2 }))} />
      <div className="mv-feedback" role="status">{record.explanation}</div>
      <p className="mv-source"><a href="https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf#page=10" target="_blank" rel="noreferrer">S Table 3，p.10</a> · 点击选择作者实际报告的三种配置；不增加“只有增强”等未报告组合。此处 10 概念的 84.87% 与主实验 45 概念的数值不属于同一协议。</p>
    </div>
  );
}
