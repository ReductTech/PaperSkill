import React, { useState } from 'react';
import { Figure10Trend } from './longforcing-figure10';

type HistoryKind = 'real' | 'generated';

type HistoryItem = {
  label: string;
  kind: HistoryKind;
  risk?: boolean;
};

const STEPS = [
  {
    key: 'clean',
    label: 'clean history',
    title: 'Step 1 · clean history',
    text: '训练时，模型读取真实历史帧，并针对当前训练目标学习预测；此时历史中还没有模型自己的输出。',
  },
  {
    key: 'write',
    label: 'write back',
    title: 'Step 2 · write back',
    text: '部署开始后，模型生成 A；A 不会被丢弃，而是立即写回 History，成为下一轮输入的一部分。',
  },
  {
    key: 'rollout',
    label: 'self-rollout',
    title: 'Step 3 · self-rollout',
    text: '继续生成 B、C 后，浅橙色的模型生成块逐渐占据 History；早期生成误差也可能被后续轮次继续读取。',
  },
  {
    key: 'gap',
    label: 'distribution gap',
    title: 'Step 4 · distribution gap',
    text: 'Teacher Forcing 看到的是 clean history，实际部署却越来越依赖 self-generated history，因此 Train ≠ Deploy。',
  },
  {
    key: 'longforcing',
    label: 'LongForcing',
    title: 'Step 5 · LongForcing',
    text: 'LongForcing 在训练阶段覆盖更长的 self-rollout 历史分布，从而缓解 train-deployment mismatch；这不是“完全消除漂移”的保证。',
  },
] as const;

const REAL_HISTORY: HistoryItem[] = [
  { label: 'R₀', kind: 'real' },
  { label: 'R₁', kind: 'real' },
  { label: 'R₂', kind: 'real' },
];

const ROLLOUT_ROWS: Array<{ history: HistoryItem[]; output: HistoryItem }> = [
  { history: REAL_HISTORY, output: { label: 'A', kind: 'generated' } },
  {
    history: [{ label: 'R₁', kind: 'real' }, { label: 'R₂', kind: 'real' }, { label: 'A', kind: 'generated', risk: true }],
    output: { label: 'B', kind: 'generated', risk: true },
  },
  {
    history: [{ label: 'R₂', kind: 'real' }, { label: 'A', kind: 'generated', risk: true }, { label: 'B', kind: 'generated', risk: true }],
    output: { label: 'C', kind: 'generated', risk: true },
  },
];

function HistoryToken({ item }: { item: HistoryItem }) {
  return <span className={`act2-history-token ${item.kind} ${item.risk ? 'has-risk' : ''}`}>{item.label}</span>;
}

function HistoryStrip({ items, label }: { items: HistoryItem[]; label?: string }) {
  return <div className="act2-history-strip">
    {label ? <small>{label}</small> : null}
    <div>{items.map((item, index) => <HistoryToken key={`${item.label}-${index}`} item={item} />)}</div>
  </div>;
}

function RolloutRow({ row, index }: { row: (typeof ROLLOUT_ROWS)[number]; index: number }) {
  return <div className="act2-rollout-row">
    <HistoryStrip items={row.history} />
    <b aria-hidden="true">→</b>
    <span className="act2-model">模型</span>
    <b aria-hidden="true">→</b>
    <HistoryToken item={row.output} />
    <small className="act2-row-caption">第 {index + 1} 轮</small>
  </div>;
}

function finalHistory(step: number): HistoryItem[] {
  if (step === 0) return REAL_HISTORY;
  if (step === 1) return [...REAL_HISTORY, { label: 'A', kind: 'generated' }];
  return [
    { label: 'R₂', kind: 'real' },
    { label: 'A', kind: 'generated', risk: true },
    { label: 'B', kind: 'generated', risk: true },
    { label: 'C', kind: 'generated', risk: true },
  ];
}

export function PresentationActTwo() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const visibleRows = step === 0 ? 0 : step === 1 ? 1 : 3;

  return <div className="act-body presentation-act-two" data-testid="presentation-act-two" data-step={step + 1}>
    <div className="act2-training-pipeline" aria-label="三阶段训练流程">
      <div className="act2-pipeline-stage muted">
        <span>1</span><div><strong>Teacher Forcing</strong><small>建立因果学生</small></div>
      </div>
      <i aria-hidden="true">→</i>
      <div className="act2-pipeline-stage muted">
        <span>2</span><div><strong>ODE Distillation</strong><small>减少采样步数</small></div>
      </div>
      <i aria-hidden="true">→</i>
      <div className="act2-pipeline-stage longforcing">
        <span>3</span><div><strong>LongForcing</strong><small>适应长期自滚动</small></div>
      </div>
    </div>

    <div className={`act2-distribution-stage state-${current.key}`} aria-live="polite">
      <section className={`act2-distribution-side train ${step === 0 ? 'is-focus' : ''}`}>
        <header><span>训练时</span><strong>clean history</strong><small>真实历史帧</small></header>
        <div className="act2-train-flow">
          <HistoryStrip items={REAL_HISTORY} />
          <b aria-hidden="true">→</b>
          <span className="act2-model">模型</span>
          <b aria-hidden="true">→</b>
          <div className="act2-current-prediction">
            <strong>当前预测</strong>
            {step === 0 ? <small>训练目标（加噪）</small> : null}
          </div>
        </div>
        <p>Teacher Forcing 的条件来自真实数据。</p>
      </section>

      <div className={`act2-distribution-gap ${step === 3 ? 'is-active' : ''} ${step === 4 ? 'is-covered' : ''}`}>
        <strong>Train ≠ Deploy</strong>
        <span>训练分布与部署分布错位</span>
      </div>

      <section className={`act2-distribution-side deploy ${step >= 1 ? 'is-focus' : ''}`}>
        <header><span>部署时</span><strong>self-generated history</strong><small>模型输出会写回 History</small></header>
        <div className="act2-deploy-rollout">
          {visibleRows === 0 ? <div className="act2-rollout-empty">尚未进入 self-rollout</div> : null}
          {ROLLOUT_ROWS.slice(0, visibleRows).map((row, index) => <RolloutRow key={row.output.label} row={row} index={index} />)}
        </div>
        <div className="act2-history-result">
          <HistoryStrip items={finalHistory(step)} label="当前 History" />
          {step >= 1 ? <strong>↺ 写回并继续作为输入</strong> : null}
        </div>
        {step >= 2 ? <div className="act2-risk-note"><i aria-hidden="true" />红点：生成误差可能被后续轮次继续传播（机制示意）</div> : null}
        {step === 4 ? <div className="act2-longforcing-supervision">
          <strong>LongForcing supervision</strong>
          <span>在长期 self-rollout History 上继续训练</span>
          <small>训练阶段覆盖部署会遇到的历史分布，从而缓解 train-deployment mismatch。</small>
        </div> : null}
      </section>
    </div>

    <div className="act2-step-rail" role="tablist" aria-label="因果自滚动五步">
      {STEPS.map((item, index) => <button
        key={item.key}
        type="button"
        role="tab"
        aria-selected={step === index}
        className={step === index ? `active tone-${item.key}` : ''}
        onClick={() => setStep(index)}
      ><span>Step {index + 1}</span><strong>{item.label}</strong></button>)}
    </div>

    <div className={`act2-step-explain tone-${current.key}`}>
      <span>{step + 1}/5</span><div><strong>{current.title}</strong><p>{current.text}</p></div>
    </div>

    <div className="presentation-nav inline-nav act2-inline-nav">
      <button type="button" className="secondary-action" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>上一步</button>
      <button type="button" className="primary-action" data-testid="act-two-next" onClick={() => setStep((value) => value === STEPS.length - 1 ? 0 : value + 1)}>{step === STEPS.length - 1 ? '回到 Step 1' : '继续理解 →'}</button>
    </div>

    {step === 4 ? <details className="act2-evidence-disclosure">
      <summary><span>机制 → 论文证据</span><strong>查看 Figure 10：长期 self-rollout 的实验趋势</strong></summary>
      <p>先完成上面的五步机制，再展开论文 Figure 10 的趋势重绘；曲线不与机制解释同时争夺视觉中心。</p>
      <Figure10Trend compact />
    </details> : null}

    <details className="deep-reading compact-details act2-math-details">
      <summary>展开数学细节：ODE 蒸馏</summary>
      <p className="math-detail">zᶜ₀ = Φθc,s→0(zᶜₛ; Cₜ)；L<sub>ODE</sub> = E‖fθ(zᶜₛ,s,Cₜ) − sg(zᶜ₀)‖²₂</p>
      <p>参考模型与学生共享相同因果条件 Cₜ，学生直接学习同一概率流 ODE 轨迹的干净终点。</p>
    </details>
  </div>;
}
