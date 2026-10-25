import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const CLAIMS = [
  { c: '训练充分后，学习型 agent 能匹配并超越经典 SLAM', true: true },
  { c: 'Depth 传感器 agent 跨数据集泛化优于仅 RGB 的 agent', true: true },
  { c: 'Blind agent 跨数据集最差', true: false },
  { c: '结论只适用于单一传感器', true: false },
];

export const P6ConclusionVote: React.FC<WidgetProps> = () => {
  const [votes, setVotes] = useState<boolean[]>(new Array(CLAIMS.length).fill(false));
  const [shown, setShown] = useState(false);
  const toggle = (i: number) => {
    const v = [...votes];
    v[i] = !v[i];
    setVotes(v);
  };
  return (
    <div className="mod-vote">
      {CLAIMS.map((cl, i) => (
        <button key={i} className={`vote-row ${votes[i] ? 'voted' : ''} ${shown ? (cl.true ? 'good' : 'bad') : ''}`} onClick={() => toggle(i)}>
          <span className="vote-check">{votes[i] ? '✓' : '○'}</span>
          <span className="vote-text">{cl.c}</span>
          {shown ? <span className="vote-ans">{cl.true ? '成立' : '不成立'}</span> : null}
        </button>
      ))}
      <button className="vote-reveal" onClick={() => setShown(true)} disabled={shown}>
        {shown ? '已揭晓' : '揭晓答案'}
      </button>
      <div className="feedback good">
        {shown
          ? '前两项成立：①充分训练后学习超越 SLAM；②仅 Depth 泛化好。后两项不成立（§5–§6）。'
          : '先勾选你认为成立的结论，再揭晓。'}
      </div>
    </div>
  );
};

export default P6ConclusionVote;
