import React, { useState } from 'react';

// 第 2 章模块：拆开“裁剪”和“KL 正则”各自的职责。
// 交互模式 P5：可点击热点 / 卡片展开。
// 学习者动作：点击三张职责卡。
// 可见状态变化：卡片展开职责说明与耦合关系。
// 即时反馈：高亮“共用一组常数”这一冲突点。

type CardId = 'clip' | 'kl' | 'couple';

const CARDS: Record<
  CardId,
  { icon: string; title: string; job: string; knob: string; problem: string; accent: string }
> = {
  clip: {
    icon: '✂️',
    title: '裁剪：单步能走多远',
    job: '重要性采样比 ρ = π_θ / π_old 可能非常大。裁剪把每个 token 的梯度权重限制在一个范围内，防止个别样本单步把参数拽飞。',
    knob: '超参：裁剪阈值 ε',
    problem: '阈值定小了，合理梯度被切掉（学不动）；定大了，极端样本照样冲进来（训崩）。而这个“合理范围”本身取决于这批数据有多同策略。',
    accent: 'var(--blue)',
  },
  kl: {
    icon: '🧷',
    title: 'KL 正则：整体别跑偏',
    job: '在目标里减去 β·KL(π_θ ‖ π_ref)，把新策略拴在参考策略附近，防止模型为了刷分把语言能力一起丢掉。',
    knob: '超参：KL 系数 β',
    problem: 'β 定小了压不住方差，训到一半 reward 上去了但人话不会说了；β 定大了模型根本走不动，reward 曲线一条水平线。',
    accent: 'var(--purple)',
  },
  couple: {
    icon: '⛓️',
    title: '真正的病根：两件事被绑死',
    job: '裁剪阈值和 KL 系数其实在回答同一个问题的两面——这批数据有多可信。数据越像同策略，就越敢用大梯度、越可以放松正则。',
    knob: '现状：两个常数各调各的',
    problem: '因为没有一个统一的度量，实践者只能对着验证集反复试 (ε, β) 的组合。批次成分一变，之前调好的组合就失效——这就是第一节看到的“脆”。',
    accent: 'var(--red)',
  },
};

export function MTwoJobs() {
  const [open, setOpen] = useState<CardId>('clip');
  const keys: CardId[] = ['clip', 'kl', 'couple'];

  return (
    <div className="module-body">
      <div className="chip-row">
        {keys.map((k) => (
          <button
            key={k}
            className={`chip ${open === k ? 'selected' : ''}`}
            onClick={() => setOpen(k)}
          >
            {CARDS[k].icon} {CARDS[k].title.split('：')[0]}
          </button>
        ))}
      </div>

      <div className="three-col-demo">
        {keys.map((k) => {
          const c = CARDS[k];
          const active = open === k;
          const cls = k === 'couple' ? 'noisy' : active ? 'clean' : '';
          return (
            <div
              key={k}
              className={`three-col-panel ${cls}`}
              onClick={() => setOpen(k)}
              style={{ cursor: 'pointer', opacity: active || k === 'couple' ? 1 : 0.62 }}
            >
              <div className="three-col-label" style={{ color: c.accent }}>
                {c.icon} {c.title}
              </div>
              <div
                className="three-col-eq"
                style={{ fontSize: 13, lineHeight: 1.6, textAlign: 'left' }}
              >
                {c.job}
              </div>
              <div className="three-col-eq" style={{ color: 'var(--ink-2)', textAlign: 'left' }}>
                <b>{c.knob}</b>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`feedback ${open === 'couple' ? 'bad' : ''}`}>
        <b>{CARDS[open].title}：</b>
        {CARDS[open].problem}
      </div>
    </div>
  );
}
