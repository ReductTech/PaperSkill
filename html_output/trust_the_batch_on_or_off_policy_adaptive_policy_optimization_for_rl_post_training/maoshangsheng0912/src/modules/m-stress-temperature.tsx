import React, { useState } from 'react';

// 第 9 章模块 2：采样温度 / 精度压力测试（P4 模式 chips + 权衡）。
// 交互模式 P4：切换扰动条件，比较两种方法的稳健性。
// 学习者动作：选择一种扰动（温度 / 精度 / 批次成分）。
// 可见状态变化：两条方法的表现条与差距。
// 即时反馈：结论指向“谁更稳”。

type Stress = 'temp' | 'precision' | 'batch';

const STRESS: Record<
  Stress,
  {
    label: string;
    sub: string;
    ppo: number;
    p3o: number;
    ppoNote: string;
    p3oNote: string;
  }
> = {
  temp: {
    label: '采样温度变化',
    sub: '推理温度 0.7 → 1.3，回答分布明显变散',
    ppo: 0.46,
    p3o: 0.78,
    ppoNote: '温度一高，回答更分散，ρ 的分布随之变宽。固定阈值不知道这件事，仍然按老规矩裁——有效样本被大量误杀。',
    p3oNote: 'e_B 会自动感知到分布变宽并收紧上限，同时加大 KL 正则，把训练从崩溃边缘拉回来。',
  },
  precision: {
    label: '训练精度变化',
    sub: '从 bf16 切到 fp16 / 低精度累积',
    ppo: 0.41,
    p3o: 0.72,
    ppoNote: '低精度让 ρ 的数值噪声被放大，固定阈值下的判定极不稳定，训练曲线剧烈抖动。',
    p3oNote: 'e_B 本身是对整批 ρ 的聚合统计，对单点噪声不敏感——噪声被平均掉了，判定依然稳。',
  },
  batch: {
    label: '批次成分变化',
    sub: '同策略与离策略数据混在一起，比例未知',
    ppo: 0.38,
    p3o: 0.81,
    ppoNote: '这是最致命的场景：固定阈值对“这批数据到底多脏”完全无知，混得越杂错得越离谱。',
    p3oNote: 'e_B 的定义就是为这件事设计的——它直接回答“这批数据有多同策略”，混得再杂也能现场量出来。',
  },
};

function Row({ label, value, color, note }: { label: string; value: number; color: string; note: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="eval-row" style={{ gridTemplateColumns: '96px 1fr 56px' }}>
        <span className="eval-label" style={{ color }}>
          {label}
        </span>
        <div className="eval-track">
          <div className="eval-fill" style={{ width: `${value * 100}%`, background: color }} />
        </div>
        <span className="eval-val" style={{ color }}>
          {Math.round(value * 100)}
        </span>
      </div>
      <div className="step-desc" style={{ textAlign: 'left', padding: '4px 0 0' }}>
        {note}
      </div>
    </div>
  );
}

export function MStressTemperature() {
  const [key, setKey] = useState<Stress>('temp');
  const d = STRESS[key];
  const gap = d.p3o - d.ppo;

  return (
    <div className="module-body">
      <div className="chip-row">
        {(Object.keys(STRESS) as Stress[]).map((k) => (
          <button key={k} className={`chip ${key === k ? 'selected' : ''}`} onClick={() => setKey(k)}>
            {STRESS[k].label}
          </button>
        ))}
      </div>
      <div className="step-desc">{d.sub}</div>

      <Row label="PPO（固定）" value={d.ppo} color="#c43f52" note={d.ppoNote} />
      <Row label="P3O（自适应）" value={d.p3o} color="#228d5c" note={d.p3oNote} />

      <div className="metrics">
        <div className="metric">
          <div className="l">两种方法的差距</div>
          <div className="v" style={{ color: 'var(--green)' }}>
            +{Math.round(gap * 100)}
          </div>
        </div>
        <div className="metric">
          <div className="l">P3O 的稳健性来源</div>
          <div className="v" style={{ fontSize: '1.1em' }}>e_B</div>
        </div>
        <div className="metric">
          <div className="l">需要新调的超参</div>
          <div className="v" style={{ color: 'var(--green)' }}>0</div>
        </div>
      </div>

      <div className={`feedback ${gap > 0.25 ? 'bad' : ''}`}>
        <b>结论：</b>
        在这三组压力测试里，P3O 都明显更稳。原因不是它更强，而是它<b>知道自己在面对什么样的数据</b>——而 PPO 只有一个写死的常数。
      </div>
    </div>
  );
}
