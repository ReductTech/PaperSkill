import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const ROWS = [
  { key: '重复预测', a: 'SFT 模型会重复写框', b: 'teacher forcing 让模型不会控制输出，GRPO 能纠正', c: '删掉重复预测再评测',
    d: 'VisDrone：SFT 删 15.3%，F1 55.6 → 62.3；GRPO 删 0.1%，61.6 → 62.1', v: '支持', good: true },
  { key: '大框预测', a: 'Dense200 上出现罩住整图的单个大框', b: '同一原因，GRPO 能纠正', c: '删掉大框预测再评测',
    d: 'SFT 大框占 20.5%，F1@mIoU 44.9 → 56.7；GRPO 占 3.5%，58.3 → 60.0', v: '支持', good: true },
  { key: '坐标精度', a: '交叉熵不反映几何距离', b: '几何奖励能提高坐标精度', c: '只看两模型框数与匹配都一致的样本',
    d: 'F1@mIoU：COCO 63.0 → 63.5，LVIS 56.6 → 56.9，HumanRef 60.0 → 61.2', v: '提升很小：GRPO 的主要优势在纠正行为', good: false },
  { key: '采样概率', a: 'SFT 模型有潜在能力', b: 'GRPO 提高采到正确输出的概率', c: 'SFT 高温采样 8 次，逐题挑最好',
    d: 'COCO 72.6 > GRPO 72.0；LVIS 59.8 < 64.3；Dense200 50.6 < 78.4', v: '因任务而异：简单数据上成立，复杂数据上 GRPO 超出采样上限', good: true },
];

export function T8Chain(_: WidgetProps) {
  const [i, setI] = useState(2);
  const r = ROWS[i];
  return <div className="rx-page rx-t8">
    <div className="rx-t8-list" role="group" aria-label="选择一条论证">
      {ROWS.map((x, j) => <button key={x.key} className={`rx-card ${i === j ? 'is-on' : ''}`} aria-pressed={i === j} onClick={() => setI(j)}><b>{x.key}</b></button>)}
    </div>
    <div className="rx-t8-chain" aria-live="polite">
      {[['现象', r.a], ['假设', r.b], ['实验', r.c], ['数据', r.d]].map(([k, v]) => <div key={k} className="rx-t8-row"><span className="rx-text rx-muted">{k}</span><p className="rx-text">{v}</p></div>)}
      <div className="rx-t8-row"><span className="rx-text rx-muted">结论</span><p className={`rx-text ${r.good ? 'rx-green' : 'rx-red'}`}><b>{r.v}</b></p></div>
    </div>
  </div>;
}
