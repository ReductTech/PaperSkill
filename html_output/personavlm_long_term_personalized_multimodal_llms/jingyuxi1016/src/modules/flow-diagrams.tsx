import type { ReactNode } from 'react';

export type MemoryFocus = 'core' | 'semantic' | 'episodic' | 'procedural' | 'profile' | 'history';
type Phase = 'input' | 'conditions' | 'retrieval' | 'answer' | 'update';

function Node({ id, title, children, active = false }: { id: string; title: string; children?: ReactNode; active?: boolean }) {
  return <div className={`pv-flow-node ${active ? 'is-highlighted' : ''}`} data-node={id} data-highlighted={active}><strong>{title}</strong>{children && <small>{children}</small>}</div>;
}
function Arrow({ from, to, active = false, children }: { from: string; to: string; active?: boolean; children?: ReactNode }) {
  return <div className={`pv-flow-arrow ${active ? 'is-highlighted' : ''}`} data-from={from} data-to={to}><span aria-hidden="true">↓</span>{children && <small>{children}</small>}</div>;
}

export function RetrievalDiagram({ focus, phase, bypass = false }: { focus?: MemoryFocus; phase?: Phase; bypass?: boolean }) {
  const isMemory = focus === 'semantic' || focus === 'procedural' || focus === 'episodic' || focus === 'history';
  const searching = !bypass && (isMemory || phase === 'retrieval');
  const answering = phase === 'answer';
  return <div className="pv-flow" data-diagram="retrieval" data-focus={focus || phase} data-bypassed={bypass} role="group" aria-label="教学示意：时间过滤、三类并行检索及回答路径">
    <div className={`pv-retrieval-path ${bypass ? 'is-bypassed' : ''}`}>
      <div className="pv-flow-section-title">按需检索路径 · 高亮表示当前讲解</div>
      <Node id="retrieval-conditions" title="检索条件" active={phase === 'conditions'}>模型生成关键词与时间范围{bypass ? ' · 本分支未调用' : ''}</Node>
      <Arrow from="retrieval-conditions" to="temporal-filter" active={searching} />
      <Node id="temporal-filter" title="时间过滤" active={searching}>先按时间条件限制候选记录</Node>
      <Arrow from="temporal-filter" to="parallel-memories" active={searching}>三类并行检索</Arrow>
      <div className="pv-parallel-memories" data-parallel="procedural semantic episodic">
        <Node id="procedural" title="Procedural" active={!bypass && (focus === 'procedural' || phase === 'retrieval')}>top-2 · 目标 / 习惯</Node>
        <Node id="semantic" title="Semantic" active={!bypass && (focus === 'semantic' || phase === 'retrieval')}>top-4 · 事实 / 视觉概念</Node>
        <Node id="episodic" title="Episodic" active={!bypass && (focus === 'episodic' || focus === 'history' || phase === 'retrieval')}>top-2 · 话题 / 轮次索引<span className={`pv-history-ref ${focus === 'history' ? 'is-highlighted' : ''}`} data-node="history">→ History 原始图文</span></Node>
      </div>
      <Arrow from="parallel-memories" to="evidence" active={searching}>汇总各类检索结果</Arrow>
    </div>
    <div className="pv-prompt-sources">
      <Node id="core" title="已有 Core" active={focus === 'core' || phase === 'input'}>每轮直接提供</Node>
      <Node id="evidence" title="Evidence 回填" active={searching || answering}>{bypass ? '本分支无新增检索证据' : '相关事实与历史图文'}</Node>
      <Node id="profile" title="已有人格 P" active={focus === 'profile' || phase === 'input'}>数值状态 → 文本化描述</Node>
    </div>
    <Arrow from="evidence-core-profile" to="prompt" active={!!focus || phase === 'input' || answering}>与当前 Q、近期上下文合并</Arrow>
    <Node id="prompt" title="结构化 Prompt / Context" active={!!focus || phase === 'input' || answering}>Core / P 直接提供；有关证据按需加入</Node>
    <Arrow from="prompt" to="answer" active={!!focus || answering} />
    <Node id="answer" title="生成回答 Answer" active={!!focus || answering}>结合当前图文、人格与可用证据</Node>
    {phase === 'update' && <><Arrow from="answer" to="future-state" active /><Node id="future-state" title="回答后按规则更新" active>供后续交互使用，不倒流到本轮回答</Node></>}
  </div>;
}

export function RLDiagram({ step }: { step: number }) {
  return <div className="pv-flow pv-rl-flow" data-diagram="rl" role="group" aria-label="教学示意：Policy生成、奖励评估与GRPO优化">
    <div className="pv-flow-section-title">生成支路</div>
    <Node id="policy-input" title="Policy 输入" active={step === 0}>问题 Q、对应上下文与检索反馈</Node>
    <Arrow from="policy-input" to="policy" active={step === 0} />
    <Node id="policy" title="Policy πθ" active={step === 0}>生成 think + retrieve / answer 轨迹</Node>
    <Arrow from="policy" to="trajectory" active={step === 0} />
    <Node id="trajectory" title="生成轨迹与回答 Rτ" active={step < 2}>同一问题采样一组候选轨迹</Node>
    <Arrow from="trajectory" to="reward-evaluation" active={step === 1}>送入奖励评估</Arrow>
    <div className="pv-reward-branch" data-scope="reward-evaluation">
      <div className="pv-flow-section-title">奖励评估支路</div>
      <div className="pv-evaluation-inputs">
        <Node id="generated-response" title="轨迹回答 Rτ" active={step === 1}>来自上方生成支路</Node>
        <Node id="reference" title="Reference answer R̂" active={step === 1}>奖励评估专用</Node>
      </div>
      <div className="pv-evaluation-arrows"><Arrow from="generated-response" to="accuracy" active={step === 1} /><Arrow from="reference" to="accuracy" active={step === 1} /></div>
      <Node id="accuracy" title="Accuracy：与参考答案比较" active={step === 1}>另评估 Consistency 与 Format</Node>
      <Arrow from="accuracy-consistency-format" to="reward" active={step === 1} />
      <Node id="reward" title="Reward" active={step === 1}>accuracy × consistency + 0.5 × format</Node>
    </div>
    <Arrow from="reward" to="optimization" active={step === 2} />
    <Node id="optimization" title="GRPO Optimization" active={step === 2}>组内比较形成 advantage；带 KL 约束优化 policy</Node>
    <p className="pv-flow-caption">参考答案只连接奖励评估，不连接 Policy 生成输入。路径为教学示意，不展示虚构奖励分数。</p>
  </div>;
}
