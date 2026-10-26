import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { S, Range, Film, fmt, useTween } from './dfa-kit';
import './dfa.css';
import './late.css';

const distances = [.1, .5, 1.5];
const deltas = [[8,-2,-8], [1,-1,-3]];
const domains = ['近域', '中域', '远域'];
const names = ['模型甲', '模型乙'];

export function DfaChallenge() {
  const [model, setModel] = useState(0);
  const [beta, setBeta] = useState(1);
  const animatedBeta = useTween(beta);
  const rawWeights = distances.map(d => -Math.expm1(-beta*d));
  const sum = rawWeights.reduce((a,b) => a+b, 0);
  const weights = rawWeights.map(w => sum > 0 ? w/sum : 0);
  const animatedRaw = distances.map(d => -Math.expm1(-animatedBeta*d));
  const animatedSum = animatedRaw.reduce((a,b) => a+b, 0);
  const animatedWeights = animatedRaw.map(w => animatedSum > 0 ? w/animatedSum : 0);
  const score = deltas.map(row => sum > 0 ? row.reduce((acc,value,i) => acc + value*weights[i], 0) : null);
  const mean = deltas.map(row => row.reduce((a,b) => a+b, 0)/row.length);
  return <div className="dfa-page dfa-late-challenge">
    <div className="dfa-late-models" role="group" aria-label="选择教学模型的成绩胶片">
      {names.map((name, i) => <button key={name} aria-pressed={model === i} onClick={() => setModel(i)} className="dfa-late-film-choice">
        <svg viewBox="0 0 660 116" aria-hidden="true">
          <Film x={0} y={4} w={660} label="" color={i === model ? '#27446e' : '#68778f'}/>
          <SvgText x="28" y="69" fill="#21324a" fontWeight="750">{name}</SvgText>
          {deltas[i].map((value, k) => <SvgText x={252+k*150} y="69" key={k} textAnchor="middle" fill="#21324a">{value > 0 ? '+' : '−'}{Math.abs(value)}</SvgText>)}
        </svg>
      </button>)}
      <div className="dfa-late-film-caption">教学变化（百分点）：近域 / 中域 / 远域</div>
    </div>
    <div className="dfa-late-weight-view">
      <div className="dfa-late-weight-header"><span>评估域 / 距离</span><span>归一化权重</span><span>加权贡献</span></div>
      {domains.map((domain, i) => <div key={domain} className="dfa-late-weight-row">
        <span>{domain} / {fmt(distances[i],1)}</span>
        <div className="dfa-late-weight-track"><span style={{ width: `${animatedWeights[i]*100}%` }}/><b>{sum > 0 ? `${fmt(weights[i]*100,1)}%` : '未定义'}</b></div>
        <strong>{sum > 0 ? fmt(weights[i]*deltas[model][i]) : '—'}</strong>
      </div>)}
      <div className="dfa-late-weight-equation">
        <S meaning="W：评估权重，相似度越低时越大。">W</S> = 1 − exp(−<S meaning="β：相似度衰减系数，论文实验取1。">β</S><S meaning="d：当前训练任务到评估域的语义距离。">d</S>)
      </div>
    </div>
    <div className="dfa-late-beta-control">
      <Range label="相似度衰减系数 β" value={beta} min={0} max={3} step={.05} onChange={setBeta}/>
      <button onClick={() => setBeta(1)}>回到论文取值 β = 1</button>
    </div>
    <div className="dfa-late-challenge-results" aria-live="polite">
      <div><span>普通平均：甲 / 乙</span><strong>{fmt(mean[0])} / {fmt(mean[1])}</strong></div>
      <div><span>校准保持分数：甲 / 乙</span><strong>{sum > 0 ? `${fmt(score[0]!)} / ${fmt(score[1]!)}` : '未定义：权重和为 0'}</strong></div>
      <div className="dfa-late-challenge-verdict">{sum > 0 ? score[1]! > score[0]! ? '校准后，乙的保持更稳。' : '当前权重下，甲的分数更高。' : 'β = 0 时三域权重都为 0。'}</div>
    </div>
    <p className="dfa-late-challenge-footer">固定两组模型结果后，改变语义权重，检查近域增益怎样影响整体判断。</p>
  </div>;
}
