import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const layers = [
  {
    id: 'artifact', label: 'A · ARTIFACT', icon: '📦', title: '可检查、可组合的 Skill Package',
    delivered: ['work.md / persona.md', 'SKILL.md + manifest / metadata', 'Full / capability-only / persona-only 入口'],
    boundary: '文件结构存在，不等于内容已经忠实呈现目标人物。',
  },
  {
    id: 'workflow', label: 'M/L · WORKFLOW', icon: '🔁', title: '从来源到生命周期的显式工作流',
    delivered: ['p、c、D 的来源边界', 'Capability Patch / Behavior Record', 'Version history / rollback / deletion controls'],
    boundary: '可纠正不保证每次纠正都更好，也不自动消除编辑者偏差。',
  },
  {
    id: 'surface', label: 'DEPLOYMENT SURFACE', icon: '🌐', title: '本地、Agent Host 与 Gallery 的部署面',
    delivered: ['manifest 驱动安装', 'Publication Gate', '论文报告的仓库与 Gallery 公开计数'],
    boundary: '公开 star、fork 与技能数是分发信号，不是任务性能、行为忠实度或采用质量。',
  },
];

export const ContributionMap: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const layer = layers[active];
  return <div className="paper-widget contribution-map">
      <header className="closing-module-header"><span>CONTRIBUTION MAP</span><b>贡献不是一句“模型已经复制了目标人物”</b><small>点击三层工件表面逐层检查</small></header>
    <div className="contribution-stack" role="tablist" aria-label="论文贡献层">
      {layers.map((item, index) => <button type="button" role="tab" aria-selected={index === active} key={item.id} className={index === active ? 'active' : ''} onClick={() => setActive(index)}><span>{item.icon}</span><b>{item.label}</b></button>)}
    </div>
    <section className="contribution-detail" aria-live="polite">
      <div className="contribution-delivered"><span>PAPER DELIVERS / REPORTS</span><h4>{layer.title}</h4>{layer.delivered.map(item => <p key={item}>✓ {item}</p>)}</div>
      <div className="contribution-boundary"><span>DO NOT INFER</span><b>{layer.boundary}</b></div>
    </section>
  </div>;
};

export default ContributionMap;
