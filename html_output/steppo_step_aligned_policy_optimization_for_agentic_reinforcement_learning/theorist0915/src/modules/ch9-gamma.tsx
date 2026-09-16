import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const controls = [
  { id: 'model', label: '骨干模型', value: 'Qwen2.5-3B-Instruct', tip: 'StepPO 与 token 级 PPO 共用同一骨干。' },
  { id: 'task', label: '任务', value: 'HotpotQA（多步智能体）', tip: '需要多步取证与推理，适合检验步级优化。' },
  { id: 'diff', label: '唯一差异', value: '仅算法不同（步级 vs token 级 PPO）', tip: '同数据、同滚动管道、同优化配置，保证对照公平。' },
  { id: 'gen', label: '生成方式', value: 'Per-step generation', tip: '每步重建 prompt 并生成一段响应，而不是压成单条扁平序列。' },
  { id: 'budget', label: '长度预算', value: 'prompt 10240 / response 1024', tip: '减少工具调用等结构化输出被截断。' },
  { id: 'gae', label: '报告超参', value: 'γ = 0.99，λ = 1.0', tip: '折扣与 GAE 参数来自论文实验设定。' },
  { id: 'eval', label: '评估协议', value: 'Inner-join 对齐交互步', tip: '两边在对齐后的步视图上比较，而不是错位片段。' },
];

/** §9: experimental protocol checklist (no duplicate curve race). */
export const Ch9Gamma: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState('diff');
  const cur = controls.find((c) => c.id === sel)!;
  return (
    <div>
      <p className="module-desc">
        先锁定「公平对照」再看曲线。下列条目均来自论文 §8.1；
        <span className="term" title="折扣因子：越接近 1，越重视远期奖励">γ</span>
        {' '}与{' '}
        <span className="term" title="GAE 偏差-方差权衡参数">λ</span>
        {' '}只是设定的一部分。
      </p>
      <div className="ctrl" style={{ flexWrap: 'wrap' }}>
        {controls.map((c) => (
          <button key={c.id} type="button" className={sel === c.id ? 'chip on' : 'chip'} onClick={() => setSel(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{
        marginTop: 12,
        padding: '14px 16px',
        border: '1px solid #d7deea',
        borderRadius: 8,
        background: '#f8faf6',
      }}>
        <div style={{ fontWeight: 700, color: '#27446e', marginBottom: 6 }}>{cur.label}</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>{cur.value}</div>
        <div style={{ color: '#3a4a3a' }}>{cur.tip}</div>
      </div>
      <div className="feedback good">判断：只有控制变量一致，Figure 5 的“StepPO 更高”才站得住。</div>
      <p className="paper-figure-cap">下一章才播放 HotpotQA 训练曲线；本章不重复展示峰值条形图。</p>
    </div>
  );
};
export default Ch9Gamma;
