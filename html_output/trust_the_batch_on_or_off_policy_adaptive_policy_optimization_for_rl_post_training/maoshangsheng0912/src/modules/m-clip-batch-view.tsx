import React, { useState } from 'react';

// 第 3 章模块 2：同一批数据、两种裁剪策略的同步前后对比（P3）。
// 交互模式 P3：同步前后对比。
// 学习者动作：选择一批数据，切换“固定裁剪 / 数据自适应上限”。
// 可见状态变化：两个并排面板里的样本条被保留或被切掉。
// 即时反馈：偏差与方差的定性读数。

type Mode = 'fixed' | 'adaptive';

// 每批数据的样本 ρ 值（示意）
const BATCHES: Record<string, { label: string; sub: string; rho: number[]; ess: number }> = {
  on: {
    label: '批次 A（偏同策略）',
    sub: 'ρ 集中在 1 附近',
    rho: [0.95, 1.02, 1.08, 0.91, 1.11, 0.98, 1.05, 1.00],
    ess: 0.94,
  },
  mixed: {
    label: '批次 B（混合）',
    sub: 'ρ 分布很宽',
    rho: [0.42, 0.88, 1.15, 1.62, 2.05, 0.71, 1.33, 0.96],
    ess: 0.51,
  },
  off: {
    label: '批次 C（偏离策略）',
    sub: 'ρ 整体偏离、尾巴很长',
    rho: [0.18, 0.35, 0.62, 1.08, 1.94, 3.20, 4.65, 0.44],
    ess: 0.14,
  },
};

const FIXED_EPS = 0.2;

function SampleRow({ rho, limit, limitLabel }: { rho: number; limit: number; limitLabel: string }) {
  const kept = rho <= 1 + limit && rho >= 1 - limit;
  const w = Math.min(Math.abs(rho) / 4.7, 1) * 100;
  return (
    <div className="eval-row" style={{ gridTemplateColumns: '58px 1fr 62px' }}>
      <span className="eval-label" style={{ fontFamily: 'var(--ui-font-mono)' }}>
        {rho.toFixed(2)}
      </span>
      <div className="eval-track">
        <div
          className="eval-fill"
          style={{ width: `${w}%`, background: kept ? '#228d5c' : '#c43f52' }}
        />
      </div>
      <span className="eval-val" style={{ color: kept ? 'var(--green)' : 'var(--red)' }}>
        {kept ? '保留' : '裁掉'}
      </span>
    </div>
  );
}

export function MClipBatchView() {
  const [key, setKey] = useState<string>('mixed');
  const [mode, setMode] = useState<Mode>('fixed');
  const d = BATCHES[key];

  // 固定裁剪：阈值恒为 0.2；自适应：阈值跟随 e_B 收紧或放松
  const limit = mode === 'fixed' ? FIXED_EPS : 1 - d.ess;
  const keptCount = d.rho.filter((r) => r <= 1 + limit && r >= 1 - limit).length;

  const verdict =
    mode === 'fixed'
      ? key === 'on'
        ? { cls: 'good', t: '批次 A 上，固定阈值恰好合适——这也解释了为什么默认配置在某些任务上看起来“能用”。' }
        : { cls: 'bad', t: '固定阈值在这批数据上失配：要么把有效样本连根切除（梯度方向被拉偏），要么放过极端样本（方差失控）。' }
      : { cls: 'good', t: `上限收紧到 ${limit.toFixed(2)}，正好卡在 e_B=${d.ess.toFixed(2)} 对应的可信区间上：低 ρ 样本继续贡献梯度，高 ρ 尾巴被压住。` };

  return (
    <div className="module-body">
      <div className="chip-row">
        {Object.keys(BATCHES).map((k) => (
          <button key={k} className={`chip ${key === k ? 'selected' : ''}`} onClick={() => setKey(k)}>
            {BATCHES[k].label}
          </button>
        ))}
      </div>

      <div className="chip-row">
        <button className={`chip ${mode === 'fixed' ? 'selected' : ''}`} onClick={() => setMode('fixed')}>
          固定裁剪 ε = 0.20
        </button>
        <button className={`chip ${mode === 'adaptive' ? 'selected' : ''}`} onClick={() => setMode('adaptive')}>
          数据自适应上限
        </button>
      </div>

      <div className="compare-row">
        <div className="compare-col">
          <div className="compare-label" style={{ color: 'var(--ink-2)' }}>
            这批数据的 ρ 分布 · {d.sub}
          </div>
          {d.rho.map((r, i) => (
            <SampleRow key={i} rho={r} limit={limit} limitLabel="" />
          ))}
        </div>
        <div className="compare-col">
          <div className="compare-label" style={{ color: mode === 'fixed' ? 'var(--red)' : 'var(--green)' }}>
            {mode === 'fixed' ? '固定阈值的判定' : '自适应上限的判定'}
          </div>
          <div className="metrics" style={{ width: '100%' }}>
            <div className="metric">
              <div className="l">使用的上限</div>
              <div className="v" style={{ color: mode === 'fixed' ? 'var(--red)' : 'var(--green)' }}>
                {limit.toFixed(2)}
              </div>
            </div>
            <div className="metric">
              <div className="l">保留下来的样本</div>
              <div className="v">
                {keptCount} / {d.rho.length}
              </div>
            </div>
          </div>
          <div className={`feedback ${verdict.cls}`} style={{ marginTop: 10 }}>
            {verdict.t}
          </div>
        </div>
      </div>
    </div>
  );
}
