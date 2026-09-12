import React, { useState } from 'react';

// 第 1 章模块：把“批次成分”与“固定超参”的错配摆到台面上。
// 交互模式 P4：模式 chips + 立即反馈。
// 学习者动作：切换批次成分（纯同策略 / 混合 / 纯离策略）。
// 可见状态变化：同一套固定超参下的两条健康度读数。
// 即时反馈：判定条由绿转红，并给出原因。
// 概念判断：固定的阈值不可能对所有批次都合适。

type Batch = 'on' | 'mixed' | 'off';

const BATCHES: Record<
  Batch,
  {
    label: string;
    sub: string;
    ess: number;
    gradOk: boolean;
    klOk: boolean;
    verdict: string;
    why: string;
  }
> = {
  on: {
    label: '纯同策略',
    sub: 'ρ ≈ 1，全是刚采样出来的数据',
    ess: 0.92,
    gradOk: true,
    klOk: true,
    verdict: '合适',
    why: '数据几乎都来自当前策略，固定裁剪 0.2 不卡住任何有效梯度；KL 只要轻微拉住就够了。',
  },
  mixed: {
    label: '混合批次',
    sub: 'ρ 分布很宽，新旧数据都有',
    ess: 0.48,
    gradOk: false,
    klOk: false,
    verdict: '两头不讨好',
    why: '固定裁剪 0.2 把大量合理梯度切掉，而固定 KL 又不足以压住高 ρ 样本带来的方差。',
  },
  off: {
    label: '纯离策略',
    sub: 'ρ 偏离 1 很远，多是旧策略数据',
    ess: 0.16,
    gradOk: false,
    klOk: false,
    verdict: '危险',
    why: 'e_B 只有 0.16，可信信息很少。固定裁剪仍按 0.2 走，固定 KL 也远远不够——方差会主导更新。',
  },
};

export function MCouplingAudit() {
  const [batch, setBatch] = useState<Batch>('on');
  const d = BATCHES[batch];
  const gradValue = d.gradOk ? d.ess : d.ess * 0.45;
  const klValue = d.klOk ? 0.78 : 0.34;
  const bad = !d.gradOk || !d.klOk;

  return (
    <div className="module-body">
      <div className="chip-row">
        {(Object.keys(BATCHES) as Batch[]).map((k) => (
          <button
            key={k}
            className={`chip ${batch === k ? 'selected' : ''}`}
            onClick={() => setBatch(k)}
          >
            {BATCHES[k].label}
          </button>
        ))}
      </div>
      <div className="step-desc">{d.sub}</div>

      <div className="ctrl">
        <label>
          裁剪阈值 <span className="val">0.2</span>
        </label>
        <input type="range" min={0} max={100} value={20} disabled readOnly />
        <label>
          KL 系数 <span className="val">固定</span>
        </label>
        <input type="range" min={0} max={100} value={2} disabled readOnly />
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="l">这批数据的 e_B</div>
          <div className="v">{d.ess.toFixed(2)}</div>
        </div>
        <div className="metric">
          <div className="l">有效梯度占比</div>
          <div className="v" style={{ color: d.gradOk ? 'var(--green)' : 'var(--red)' }}>
            {Math.round(gradValue * 100)}%
          </div>
        </div>
        <div className="metric">
          <div className="l">方差压制程度</div>
          <div className="v" style={{ color: d.klOk ? 'var(--green)' : 'var(--red)' }}>
            {Math.round(klValue * 100)}%
          </div>
        </div>
      </div>

      <div className={`feedback ${bad ? 'bad' : 'good'}`}>
        <b>{d.verdict}。</b>
        {d.why}
      </div>
    </div>
  );
}
