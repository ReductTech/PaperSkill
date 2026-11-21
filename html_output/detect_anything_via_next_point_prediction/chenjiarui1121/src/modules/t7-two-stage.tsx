import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STAGES = {
  sft: { name: '第一阶段 SFT', rows: [['每步的前文', '真值序列（teacher forcing）'], ['监督信号', '交叉熵，逐词元比较'], ['数据', '约 2200 万，全部用上'], ['算力', '8 节点 × 8 张 A100，约 8 天']],
    text: '学会坐标词元与图像位置的对应，是模型的基本能力。' },
  grpo: { name: '第二阶段 GRPO', rows: [['每步的前文', '模型自己写的内容'], ['监督信号', '完整回答的几何感知奖励'], ['数据', '从 SFT 数据抽 6.6 万条'], ['算力', '8 张 A100，约 24 小时']],
    text: '同一图像采样 8 个完整回答，分别打分再比较，专治前面说的两个原因。' },
};
type K = keyof typeof STAGES;

export function T7TwoStage(_: WidgetProps) {
  const [k, setK] = useState<K>('sft');
  const s = STAGES[k];
  return <div className="rx-page rx-t7">
    <div className="rx-t7-fig">
      <img src="./images/figure-6.png" alt="论文图 6：左为 SFT，右为 GRPO" />
      <span className={`rx-t7-dim ${k === 'sft' ? 'is-right' : 'is-left'}`} aria-hidden="true" />
    </div>
    <div className="rx-row" role="group" aria-label="选择阶段">
      {(Object.keys(STAGES) as K[]).map(id => <button key={id} className={`rx-chip ${k === id ? 'is-on' : ''}`} aria-pressed={k === id} onClick={() => setK(id)}>{STAGES[id].name}</button>)}
      <span className="rx-text rx-muted">论文图 6</span>
    </div>
    <div className="rx-t7-facts" aria-live="polite">
      {s.rows.map(([a, b]) => <div key={a}><span className="rx-text rx-muted">{a}</span><b className="rx-text">{b}</b></div>)}
    </div>
    <p className="rx-text">{s.text}</p>
  </div>;
}
