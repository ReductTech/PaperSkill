import React from 'react';
import type { WidgetProps } from './registry';

const variants = [
  { label: 'FULL', scope: 'work.md + persona.md', purpose: '检验能力与互动方式联合加载的整体效果' },
  { label: 'WORK ONLY', scope: 'work.md', purpose: '隔离专业流程、规则和判断方法的贡献' },
  { label: 'PERSONA ONLY', scope: 'persona.md', purpose: '隔离表达偏好、互动规则和行为约束的影响' },
  { label: 'GENERIC PROMPT', scope: 'Matched instructions', purpose: '比较结构化 Skill 与普通提示词的差异' },
  { label: 'RETRIEVAL', scope: 'Same source D', purpose: '比较蒸馏工件与直接检索来源材料的差异' },
  { label: 'NO SKILL', scope: 'Base model', purpose: '提供不加载任何目标人物工件的基础对照' },
];

const tasks = [
  { icon: '🧩', label: 'Code Review', detail: '发现 authentication、validation 等关键风险，并解释对应来源。' },
  { icon: '🚨', label: 'Incident Decision', detail: '在相同约束下排序行动、升级路径与 rollback 判断。' },
  { icon: '📝', label: 'Handover', detail: '准确传递规则、例外、来源边界和不可公开内容。' },
];

const metricGroups = [
  { label: '忠实度', metrics: '目标人物一致度 · 行为忠实度' },
  { label: '任务效用', metrics: '任务成功率 · 关键问题召回率' },
  { label: '证据落地', metrics: '证据支撑度 · 来源归因准确性' },
  { label: '生命周期', metrics: '纠错回归 · 回滚一致性' },
  { label: '治理', metrics: '边界违规 · 未授权分享' },
];

const protocol = [
  { number: '01', title: '冻结实验条件', text: '所有条件使用相同来源 D、相同案例、相同模型和相同推理预算。' },
  { number: '02', title: '评估初始版本', text: '在三类任务上盲测 v1，并记录忠实度、任务效果、来源与治理指标。' },
  { number: '03', title: '执行匹配纠正', text: '对同一错误生成 Capability Patch 或 Behavior Record，形成 v2。' },
  { number: '04', title: '重复测试与回滚', text: '使用同一测试集比较 v1、v2 和 rollback 后状态，检查局部修正是否引入回归。' },
];

export const FutureEvaluation: React.FC<WidgetProps> = () => (
  <div className="paper-widget future-evaluation future-evaluation-fixed">
    <header className="closing-module-header">
      <span>FUTURE WORK · FIXED EVALUATION PROTOCOL</span>
      <b>下一篇论文可以直接执行的统一验证方案</b>
      <small>这是建议的未来实验，不是原论文已经报告的结果</small>
    </header>

    <section className="fixed-research-question">
      <span>CORE QUESTION</span>
      <b>在相同来源 D 与相同任务条件下，结构化 Skill 是否比 Prompt、检索和基础模型更忠实、更有效，也更容易追溯与维护？</b>
      <p>FULL、WORK ONLY 与 PERSONA ONLY 共享 Metadata 和 Lifecycle，只改变本次加载的 Artifact 范围。</p>
    </section>

    <section className="fixed-eval-section">
      <header><span>1</span><div><b>固定对照组</b><small>一次性比较全部条件，不让读者自行拼装实验。</small></div></header>
      <div className="fixed-variant-grid">
        {variants.map(item => <article key={item.label}>
          <b>{item.label}</b><code>{item.scope}</code><p>{item.purpose}</p>
        </article>)}
      </div>
    </section>

    <section className="fixed-eval-section">
      <header><span>2</span><div><b>固定任务集</b><small>同时覆盖专业判断、紧急决策与知识交接。</small></div></header>
      <div className="fixed-task-grid">
        {tasks.map(item => <article key={item.label}><span>{item.icon}</span><b>{item.label}</b><p>{item.detail}</p></article>)}
      </div>
    </section>

    <section className="fixed-eval-section">
      <header><span>3</span><div><b>固定指标组</b><small>不能只测“像不像”，也不能只测“任务做没做完”。</small></div></header>
      <div className="fixed-metric-grid">
        {metricGroups.map(item => <article key={item.label}><b>{item.label}</b><span>{item.metrics}</span></article>)}
      </div>
    </section>

    <section className="fixed-eval-section">
      <header><span>4</span><div><b>固定生命周期协议</b><small>同一套案例必须在纠正前、纠正后和回滚后重复运行。</small></div></header>
      <div className="fixed-protocol-track">
        {protocol.map(item => <article key={item.number}><span>{item.number}</span><b>{item.title}</b><p>{item.text}</p></article>)}
      </div>
    </section>

    <aside className="fixed-evidence-boundary">
      <b>结论边界</b>
      <p>只有完成上述对照实验，才能讨论行为忠实度、任务提升和纠错可靠性。原论文当前证明的是工件、工作流与分发表面成立，并未报告这套实验结果。</p>
    </aside>
  </div>
);

export default FutureEvaluation;
