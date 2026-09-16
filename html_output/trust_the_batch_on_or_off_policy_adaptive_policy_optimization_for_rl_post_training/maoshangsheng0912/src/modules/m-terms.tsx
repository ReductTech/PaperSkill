import React, { useState } from 'react';

// 第 10 章模块：术语速查（P5 可点击热点）。
// 交互模式 P5：点击卡片展开术语的确切含义。
// 学习者动作：点击任一术语卡。
// 可见状态变化：展开该术语在本文中的确切含义与相邻概念关系。
// 即时反馈：把术语串成一条因果链。

type TermId = 'ess' | 'rho' | 'adv' | 'clip' | 'kl' | 'adaptive';

const TERMS: Record<
  TermId,
  { label: string; full: string; desc: string; link: string; accent: string }
> = {
  ess: {
    label: 'e_B',
    full: '归一化有效样本量 (ESS)',
    desc: '衡量这一批数据的 ρ 有多均匀。取值在 [1/|B|, 1]，越接近 1 说明整批样本都在均衡贡献信息。论文用它的 stop-gradient 版本 e_B = sg(ESS(B;θ))。',
    link: '由 ρ 算出 → 反过来决定裁剪上限与 KL 系数',
    accent: 'var(--green)',
  },
  rho: {
    label: 'ρ',
    full: '重要性采样比',
    desc: 'π_θ / π_old。衡量“当前策略对这个 token 的偏好”相对“产生这个 token 的旧策略”偏离了多少。ρ=1 意味着完全同策略。',
    link: '是 e_B 的原材料 → 也是梯度权重的直接来源',
    accent: 'var(--blue)',
  },
  adv: {
    label: 'A_t',
    full: '组相对优势',
    desc: '奖励减去组均值再除以组标准差。决定这一步该被鼓励（正）还是抑制（负），是梯度的方向信号。',
    link: '提供方向 → 与权重相乘后进入梯度',
    accent: 'var(--purple)',
  },
  clip: {
    label: 'ε',
    full: '裁剪阈值（PPO 的固定超参）',
    desc: 'PPO 里写死的一个常数，把 ρ 夹在 [1−ε_ℓ, 1+ε_h] 之内（论文 Eq. 4 用非对称上下界）。它的问题是不知道当前批次有多脏。',
    link: '在 P3O 中被 min{ρ_t, e_B} 取代',
    accent: 'var(--red)',
  },
  kl: {
    label: 'β',
    full: 'KL 正则系数（PPO 的固定超参）',
    desc: '把当前策略拴在参考策略附近的力度。定小了压不住方差，定大了学不动。',
    link: '在 P3O 中被 (1 − e_B) 取代',
    accent: 'var(--orange)',
  },
  adaptive: {
    label: 'P3O',
    full: '本文方法：自适应策略优化',
    desc: '用同一个 e_B 同时充当梯度权重上限与 KL 正则系数，消去两个手调超参。首次把 UAI 2019 的 P3O 目标用于大模型 RL 后训练。',
    link: '把前五个概念串成一条闭环',
    accent: 'var(--green)',
  },
};

export function MTerms() {
  const [open, setOpen] = useState<TermId>('ess');
  const keys: TermId[] = ['ess', 'rho', 'adv', 'clip', 'kl', 'adaptive'];

  return (
    <div className="module-body">
      <div className="chip-row">
        {keys.map((k) => (
          <button
            key={k}
            className={`chip ${open === k ? 'selected' : ''}`}
            onClick={() => setOpen(k)}
          >
            {TERMS[k].label}
          </button>
        ))}
      </div>

      <div className="metrics">
        <div className="metric" style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
          <div className="l" style={{ color: TERMS[open].accent }}>
            {TERMS[open].full}
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7, margin: '8px 0', color: 'var(--ink)' }}>
            {TERMS[open].desc}
          </div>
          <div className="step-desc" style={{ textAlign: 'left', padding: 0 }}>
            🔗 {TERMS[open].link}
          </div>
        </div>
      </div>

      <div className="feedback">
        <b>因果链：</b>
        ρ →（聚合）→ e_B →（同时驱动）→ 梯度上限 + KL 系数 → 决定这一步学多少、模型该被拉多紧。整篇论文的骨架就这一条。
      </div>
    </div>
  );
}
