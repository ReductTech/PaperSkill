import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Phase = 'explore' | 'decide';
type Outcome = 'improve' | 'tie' | 'decline';

const OUTCOMES: Record<Outcome, { label: string; relation: string; merge: boolean; feedback: string }> = {
  improve: {
    label: '严格提高',
    relation: '>',
    merge: true,
    feedback: "O(Etest(M')) 严格大于 O(Etest(Mbest))，满足 Algorithm 1 的合并条件：用 M' 替换 Mbest。",
  },
  tie: {
    label: '持平',
    relation: '=',
    merge: false,
    feedback: '持平不满足“严格改善”，候选不合并，Mbest 保持不变。',
  },
  decline: {
    label: '下降',
    relation: '<',
    merge: false,
    feedback: '候选的留出目标值更低，不合并，Mbest 保持不变。',
  },
};

export const HeldoutMergeGate: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState<Phase>('explore');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const current = outcome ? OUTCOMES[outcome] : null;

  const enterDecide = () => {
    setPhase('decide');
    setOutcome(null);
  };

  const returnExplore = () => {
    setPhase('explore');
    setOutcome(null);
  };

  const feedback = phase === 'explore'
    ? '候选已经由 Edev 选出，但 Etest 仍然锁定；协调器不能提前知道留出结果，也不能利用它调整假设。'
    : current
      ? current.feedback
      : 'Etest 现在只用于准入。请选择“严格提高”“持平”或“下降”，验证严格改善规则。';

  const status = phase === 'explore'
    ? '尚不能知道留出关系，也不能据此构思。'
    : !current
      ? '请选择一种留出目标值关系。'
      : current.merge
        ? "合并：Mbest ← M'"
        : '不合并：保持当前 Mbest';

  return (
    <div className={`merge-rule-lab phase-${phase} ${current?.merge ? 'is-merge' : current ? 'is-reject' : ''}`}>
      <div className="merge-rule-heading">
        {phase === 'explore' ? 'EXPLORE：候选由 Edev 产生，Etest 保持锁定' : 'DECIDE：Etest 只执行合并准入'}
      </div>

      <p className="merge-rule-selection">
        <strong>Algorithm 1：</strong>当前批次叶节点执行完成后，先选开发分数最高的
        {' '}n† = argmax<sub>n∈L</sub> sₙ；Etest 只评估这个待准入候选，而不是反复指导整个探索过程。
      </p>

      <div className="merge-rule-diagram" aria-live="polite">
        <section className="merge-artifact candidate">
          <strong>候选 M'</strong>
          <span>隔离 worktree 产生</span>
        </section>

        <section className="merge-gate-panel">
          <strong>Etest</strong>
          <span className="merge-gate-relation">{phase === 'explore' ? 'LOCKED' : current?.relation ?? '?'}</span>
          <span>{phase === 'explore' ? '不可用于探索' : '比较目标方向 O'}</span>
        </section>

        <section className="merge-artifact best">
          <strong>当前 Mbest</strong>
          <span>已通过留出验证的主干</span>
        </section>
      </div>

      <div className="merge-rule-status">{status}</div>

      <div className="ctrl" role="group" aria-label="切换 Explore 与 Decide">
        <button type="button" aria-pressed={phase === 'explore'} onClick={returnExplore}>Explore · Etest 锁定</button>
        <button type="button" aria-pressed={phase === 'decide'} onClick={enterDecide}>进入 Decide</button>
      </div>

      {phase === 'decide' ? (
        <div className="ctrl" role="group" aria-label="选择留出目标值关系">
          {(Object.keys(OUTCOMES) as Outcome[]).map((key) => (
            <button key={key} type="button" aria-pressed={outcome === key} onClick={() => setOutcome(key)}>
              {OUTCOMES[key].label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`feedback ${phase === 'decide' && current ? (current.merge ? 'good' : 'bad') : ''}`} aria-live="polite">
        {feedback}
      </div>
      <p className="merge-rule-note">
        候选在新工作树中接受留出验证。这是 Algorithm 1 合并条件的教学演示，不对应论文 Figure 6 中某个节点的具体 Etest 分数。
      </p>
    </div>
  );
};

export default HeldoutMergeGate;
