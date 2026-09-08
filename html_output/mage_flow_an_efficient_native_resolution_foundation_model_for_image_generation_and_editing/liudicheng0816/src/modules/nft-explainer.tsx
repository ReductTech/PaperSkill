import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const candidates = [
  { id: 1, score: 0.82, note: '条件遵循较好' },
  { id: 2, score: 0.24, note: '文字与布局错误' },
  { id: 3, score: 0.61, note: '主体正确，细节一般' },
  { id: 4, score: 0.94, note: '当前候选中最佳' },
] as const;

export const NftCandidateLab: React.FC<WidgetProps> = () => {
  const selected = 4;
  const current = candidates[selected - 1];
  return (
    <div className="nft-story-card">
      <div className="nft-training-pipeline" aria-label="Diffusion-NFT 在线训练流程">
        <span>Prompt 批次<br /><small>预带 capability tag</small></span><b>→</b>
        <span>当前策略 π<sub>old</sub><br /><small>10 步 · CFG 5.0</small></span><b>→</b>
        <span>同条件候选组<br /><small>x₁…x₄</small></span><b>→</b>
        <span>唯一匹配评估器</span><b>→</b>
        <span>同类型、组内归一化</span><b>→</b>
        <span>最优概率 r<sub>i</sub><sup>(s)</sup></span><b>→</b>
        <span>高分正向匹配<br /><small>低分负向抑制</small></span>
      </div>
      <div className="candidate-grid">
        {candidates.map((candidate) => <div key={candidate.id} className={selected === candidate.id ? 'active' : ''}><span>候选 {candidate.id}</span><strong style={{ height: `${24 + candidate.score * 58}px` }} /><b>r={candidate.score.toFixed(2)}</b></div>)}
      </div>
      <p className={`feedback ${current.score >= .8 ? 'good' : current.score < .4 ? 'bad' : ''}`}>候选 {current.id}：{current.note}。分数只在当前奖励类型的候选集合内归一化为 [0,1]。</p>
      <p className="module-note">柱高与数值用于解释归一化机制，不是论文中的具体样本分数。候选由当前策略针对相同条件在线产生，因此训练信号会随模型能力变化。</p>
    </div>
  );
};

export const NftPositiveNegativeLab: React.FC<WidgetProps> = () => {
  const [reward, setReward] = useState(.75);
  const positive = Math.round(reward * 100);
  const negative = 100 - positive;
  return (
    <div className="nft-story-card">
      <div className="ctrl"><label htmlFor="nft-reward">归一化奖励 r <span className="val">{reward.toFixed(2)}</span></label><input id="nft-reward" type="range" min="0" max="1" step="0.01" value={reward} onChange={(event) => setReward(Number(event.target.value))} /></div>
      <div className="nft-weight-balance"><div style={{ flex: positive }}><span>正向匹配 v⁺θ</span><strong>{positive}%</strong></div><div style={{ flex: negative }}><span>负向抑制 v⁻θ</span><strong>{negative}%</strong></div></div>
      <p className={`feedback ${reward >= .6 ? 'good' : reward <= .4 ? 'bad' : ''}`}>{reward >= .6 ? '高奖励候选对正策略速度场的匹配权重更大。' : reward <= .4 ? '低奖励候选主要通过负策略受到抑制。' : '中等奖励在正向匹配与负向抑制之间保持接近平衡。'}</p>
      <div className="model-family-chain"><span>Mage-Flow-Base<br />Mage-Flow-Edit-Base</span><b>Diffusion-NFT</b><span>Mage-Flow<br />Mage-Flow-Edit</span><b>冻结为教师</b><span>四步 Turbo</span></div>
    </div>
  );
};
