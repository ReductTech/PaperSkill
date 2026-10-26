// Refinement 2026-10-22. Table 7(a,b), MCFS-130 split #1. All scores are original paper entries.
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
const scores = { tcn: [56.8, 60.4, 59.5, 61.9], transformer: [60.2, 60.8, 61.7, 62.1] } as const;
export const DestAblation: React.FC<WidgetProps> = () => {
  const [backbone, setBackbone] = useState<'tcn' | 'transformer'>('tcn');
  const [ssf, setSsf] = useState(false);
  const [attn, setAttn] = useState(false);
  const index = Number(ssf) + 2 * Number(attn);
  const values = scores[backbone];
  const score = values[index];
  const ssfGain = values[1 + 2 * Number(attn)] - values[2 * Number(attn)];
  const attnGain = values[2 + Number(ssf)] - values[Number(ssf)];
  return <div className="dest-refined">
    <div className="ctrl"><span>固定骨干</span>{(['tcn', 'transformer'] as const).map(b => <button key={b} className={'chip' + (backbone === b ? ' active' : '')} aria-pressed={backbone === b} onClick={() => setBackbone(b)}>{b === 'tcn' ? 'TCN · 表7(a)' : '线性 Transformer · 表7(b)'}</button>)}</div>
    <div className="dest-factor-grid">
      <button className={'dest-factor' + (ssf ? ' is-focus' : '')} aria-pressed={ssf} onClick={() => setSsf(s => !s)}><span>因素 1 · 空间表示</span><strong>{ssf ? '不同空间子特征' : '各层使用相同空间特征'}</strong><small>点击切换 SSF {ssf ? '开启 → 关闭' : '关闭 → 开启'}</small></button>
      <button className={'dest-factor' + (attn ? ' is-focus' : '')} aria-pressed={attn} onClick={() => setAttn(s => !s)}><span>因素 2 · 交互方式</span><strong>{attn ? '交叉注意力' : '直接求和'}</strong><small>点击切换 {attn ? '注意力 → 求和' : '求和 → 注意力'}</small></button>
    </div>
    <div className="dest-ablation-matrix" aria-label="两个因素组成的四种配置">{values.map((value, i) => <button key={i} className={'dest-matrix-cell' + (index === i ? ' is-focus' : '')} aria-pressed={index === i} onClick={() => { setSsf(i % 2 === 1); setAttn(i >= 2); }}><span>{i % 2 ? '有 SSF' : '无 SSF'} + {i >= 2 ? '交叉注意力' : '求和'}</span><strong>{value.toFixed(1)}</strong><small>F1@50 ↑</small></button>)}</div>
    <div className="feedback" aria-live="polite"><strong>当前 F1@50 = {score.toFixed(1)}。</strong>固定当前交互方式，加入 SSF 的增益是 {ssfGain.toFixed(1)} 个百分点；固定当前空间表示，把求和改为交叉注意力的增益是 {attnGain.toFixed(1)} 个百分点。</div>
    <p className="module-note">论文证据：Table 7，MCFS-130 split #1。两个因素的收益取决于另一个因素，不能把不同配置的增益简单累加；本组“SSF + 交叉注意力”最高。此处不是五折平均结果。</p>
  </div>;
};
