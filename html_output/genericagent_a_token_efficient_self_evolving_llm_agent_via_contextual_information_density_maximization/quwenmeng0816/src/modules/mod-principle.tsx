import React from 'react';
import type { WidgetProps } from './registry';

type Principle = {
  section: string;
  label: string;
  headline: string;
  lead: string;
  problem: { title: string; body: string };
  response: { title: string; body: string };
  rule: string;
  steps: string[];
};

const PRINCIPLES: Record<string, Principle> = {
  'chap-3': {
    section: '§2.1.1', label: 'TOOL MINIMALITY',
    headline: '能力来自原语组合，不来自工具数量。',
    lead: '每增加一个工具，系统同时付出两种成本：更多接口文本进入上下文，更大的动作空间进入模型决策。',
    problem: { title: '两个成本一起增长', body: 'Prompt 层扩大 schema 与 instructions；Policy 层增加选择歧义，使规划更脆弱并带来错误调用与重试。' },
    response: { title: '只保留可组合的原子能力', body: 'Atomicity 要求工具不可再分；Compositional generalization 要求复杂行为能够由这些原语的序列实现。' },
    rule: '更少接口，更短 Prompt，更稳定的选择。',
    steps: ['Atomic tools', 'Compose', 'Complex behavior'],
  },
  'chap-4': {
    section: '§2.1.2', label: 'HIERARCHICAL MEMORY',
    headline: '存储可以很深，活动上下文必须很薄。',
    lead: '通用智能体真正稀缺的不是磁盘容量，而是当前推理窗口里还能留给任务的信息预算。',
    problem: { title: '默认加载会掩埋当前任务', body: '历史交互、中间状态与执行轨迹持续进入 Prompt，会让低价值旧内容逐步挤走决策所需信息。' },
    response: { title: '常驻索引，正文按需读取', body: '默认只显示轻量方向信息；事实、流程和历史留在深层。模型看到指针后，再用工具取回当前需要的内容。' },
    rule: '能被找到，不等于必须一直出现在 Context。',
    steps: ['Thin index', 'On-demand retrieval', 'Relevant memory'],
  },
  'chap-5': {
    section: '§2.1.3', label: 'SELF-EVOLUTION',
    headline: '不改模型权重，改变模型下次看到的信息环境。',
    lead: '长程任务中的有效知识来自真实试错；如果会话结束后不巩固，智能体就会在下一次任务中重新探索。',
    problem: { title: '经验随情节结束而消失', body: '重复完整轨迹会破坏简洁性；只给短提示又会缺少关键步骤。任务数量增长，能力却保持停滞。' },
    response: { title: '选择性巩固验证经验', body: '把成功执行中稳定、可复用的部分压成 SOP、代码和技能，过滤临时状态、弱验证信息与情境噪声。' },
    rule: '下一次任务从已验证路径开始，而不是从零开始。',
    steps: ['Verified trajectory', 'Consolidate', 'Reusable capability'],
  },
  'chap-6': {
    section: '§2.1.4', label: 'CONTEXT COMPRESSION',
    headline: '按可稳定使用的长度设计，不按标称窗口设计。',
    lead: '更长窗口更昂贵，也会引入更多幻觉；论文认为当前模型的有效上限大约比标称窗口小一个数量级。',
    problem: { title: '能放进去，不等于能可靠使用', body: '当历史持续增长，低价值内容会占用正在推理所需的预算。扩大到 1M 并不能自动恢复信息密度。' },
    response: { title: '把工作上下文控制在 30k 以下', body: '优先截断单条工具输出，再压缩旧内容；超预算才淘汰最旧消息，同时用工作记忆锚保住任务状态。' },
    rule: '投资压缩，而不是投资稀释后的更大窗口。',
    steps: ['Truncate', 'Compress / Evict', 'Anchor task state'],
  },
};

export const ModPrinciple: React.FC<WidgetProps> = ({ chapterId }) => {
  const principle = PRINCIPLES[chapterId] ?? PRINCIPLES['chap-3'];
  return (
    <div className="principle-brief">
      <header className="principle-brief-head">
        <div><span>{principle.section}</span><small>{principle.label}</small></div>
        <h3>{principle.headline}</h3>
        <p>{principle.lead}</p>
      </header>
      {chapterId === 'chap-3' ? (
        <div className="tool-cost-visual">
          <section className="prompt-cost-mini">
            <header><span>PROMPT-LEVEL COST</span><b>接口文本持续占用 Context</b></header>
            <div className="schema-parts"><i>name</i><i>description</i><i>parameters / JSON Schema</i></div>
            <div className="context-budget-bar"><em>tool schema + instructions</em><strong>task-relevant budget</strong></div>
            <p>每增加一个工具，注入接口的 schema 与说明随之扩大。</p>
          </section>
          <section className="policy-cost-mini">
            <header><span>POLICY-LEVEL COST</span><b>动作空间扩大，选择更不稳定</b></header>
            <div className="policy-branch"><strong>current state</strong><i>→</i><div><span>tool_a</span><span>tool_b</span><span>tool_c</span><span>tool_…</span></div><i>→</i><em>ambiguity<br />errors · retries</em></div>
            <p>近似候选增加会提高选择歧义，使规划更脆弱并产生无效重试。</p>
          </section>
        </div>
      ) : null}
      <div className="principle-tension">
        <article className="problem"><span>01 · CORE TENSION</span><h4>{principle.problem.title}</h4><p>{principle.problem.body}</p></article>
        <div className="principle-turn" aria-hidden="true">→</div>
        <article className="response"><span>02 · DESIGN RESPONSE</span><h4>{principle.response.title}</h4><p>{principle.response.body}</p></article>
      </div>
      <div className="principle-path" aria-label="设计逻辑">
        {principle.steps.map((step, index) => <React.Fragment key={step}><b>{step}</b>{index < principle.steps.length - 1 ? <span>→</span> : null}</React.Fragment>)}
      </div>
      <div className="principle-rule"><span>ONE-LINE RULE</span><strong>{principle.rule}</strong></div>
    </div>
  );
};
