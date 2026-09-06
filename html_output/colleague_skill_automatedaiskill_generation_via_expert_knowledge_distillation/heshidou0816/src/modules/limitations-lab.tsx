import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const limitations = [
  { icon: '🎭', title: '行为忠实度', gap: '论文没有报告人体评审或匹配任务上的行为忠实度评估。', risk: 'Skill 可能读起来像目标人物，却在关键判断、拒绝方式或互动节奏上偏离。', next: '使用盲评、目标人物一致度和情境化成对偏好评估。' },
  { icon: '📈', title: '任务效用', gap: '论文没有提供在统一来源、任务、基线与指标下的下游效果实验。', risk: '可安装、可调用不能推出代码评审、决策或交接任务真的变好。', next: '与无 Skill、通用提示词、检索增强等匹配基线比较任务成功率与错误召回。' },
  { icon: '🩹', title: '纠错回归', gap: '版本化说明“可以改”，但没有证明每次修改都会单调改进。', risk: '一次局部补丁可能修好当前场景，却破坏别的规则或放大编辑者偏差。', next: '为每次纠正运行回归集、差分审查和可逆性测试。' },
  { icon: '🔐', title: '权利与同意', gap: '工件可以记录治理状态，但系统不能自行认证权利、同意、真伪或法律充分性。', risk: '技术上的发布门禁不能替代情境化的人类与法律审查。', next: '引入可撤销同意、用途限制、删除证明和独立审核。' },
  { icon: '🕰️', title: '长期漂移', gap: '论文展示生命周期机制，但没有长期跟踪目标人物观点变化与版本漂移。', risk: '历史材料、当前判断和后续纠正可能在时间上互相冲突。', next: '进行纵向评估：时间戳证据、版本漂移、过期检测与回滚质量。' },
];

export const LimitationsLab: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const [inspected, setInspected] = useState<number[]>([0]);
  const limitation = limitations[active];

  const choose = (index: number) => {
    setActive(index);
    setInspected(previous => previous.includes(index) ? previous : [...previous, index]);
  };

  return <div className="paper-widget limitations-lab">
    <header className="closing-module-header"><span>局限性检查</span><b>“能生成”之后，还有五个没有被实验回答的问题</b><small>已检查 {inspected.length}/5</small></header>
    <div className="limitation-tabs" role="tablist" aria-label="论文局限性">
      {limitations.map((item, index) => <button type="button" role="tab" aria-selected={active === index} key={item.title} className={`${active === index ? 'active' : ''}${inspected.includes(index) ? ' inspected' : ''}`} onClick={() => choose(index)}><span>{item.icon}</span><b>{item.title}</b></button>)}
    </div>
    <section className="limitation-detail" aria-live="polite">
      <article><span>证据缺口</span><p>{limitation.gap}</p></article>
      <article><span>为什么重要</span><p>{limitation.risk}</p></article>
      <article><span>下一步验证</span><p>{limitation.next}</p></article>
    </section>
    <p className="limitation-note">局限性不是否定工程贡献，而是防止把“系统存在”升级成论文尚未提供的效果结论。</p>
  </div>;
};

export default LimitationsLab;
