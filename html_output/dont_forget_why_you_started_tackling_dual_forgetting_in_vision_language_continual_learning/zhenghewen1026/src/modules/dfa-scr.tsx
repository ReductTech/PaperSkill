import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { Photo, Range, S, fmt, useTween } from './dfa-kit';
import './dfa.css';
import './early.css';

export function DfaScr() {
  const [distance, setDistance] = useState(.1);
  const distances = [distance,.5,1.5];
  const changes = [6,-2,-8];
  const weights = distances.map(d => 1 - Math.exp(-d));
  const total = weights.reduce((a,b) => a+b,0);
  const shares = weights.map(w => w / total);
  const contributions = shares.map((w,i) => w * changes[i]);
  const score = contributions.reduce((a,b) => a+b,0);
  const animatedShare = useTween(shares[0]);
  const sceneShares = [animatedShare,(1-animatedShare) * weights[1]/(weights[1]+weights[2]),(1-animatedShare) * weights[2]/(weights[1]+weights[2])];
  return <div className="dfa-page dfa-early dfa-scr-page">
    <div className="dfa-scr-photos">
      {['可调领域','固定领域乙','固定领域丙'].map((name,i) => <div key={name} className="dfa-weight-photo">
        <svg viewBox="0 0 470 230" role="img" aria-label={`${name}，距离${fmt(distances[i])}，归一化权重${fmt(shares[i]*100,1)}%`}>
          <path d="M40 200 H430" stroke="#d8c4a6" strokeWidth="14" strokeLinecap="round"/>
          <path d={`M235 185 V${138-sceneShares[i]*65}`} stroke="#68778f" strokeWidth="7"/>
          <path d={`M${235-(60+sceneShares[i]*130)} ${138-sceneShares[i]*65} H${235+(60+sceneShares[i]*130)}`} stroke={i===0 ? '#f07e47' : '#27446e'} strokeWidth="12" strokeLinecap="round"/>
          <g transform={`translate(0 ${45-sceneShares[i]*45})`}><Photo x={155} y={0} w={160} h={100} kind={i===0 ? 'flower' : i===1 ? 'city' : 'face'}/></g>
          <SvgText x="40" y="223" className="dfa-early-svg-text">{name} · d = {fmt(distances[i])}</SvgText>
        </svg>
        <div className="dfa-weight-number"><strong>{fmt(shares[i]*100,1)}%</strong><span>总权重占比</span></div>
        <div className="dfa-weight-contribution">变化 {changes[i]>0 ? '+' : ''}{changes[i]} → 贡献 <b>{contributions[i]>0 ? '+' : ''}{fmt(contributions[i])}</b></div>
      </div>)}
    </div>
    <div className="dfa-scr-middle">
      <Range label="第一领域的语义距离" min={0} max={2} step={.05} value={distance} onChange={setDistance}/>
      <div className="dfa-early-formula"><S meaning="W：该领域的非归一化评估权重。">W</S> = 1 − e<sup>−<S meaning="d：原始冻结模型特征空间中的语义距离；本页β固定为1。">d</S></sup><span className="dfa-scr-beta"><S meaning="β：相似度随距离衰减的强度；论文取1。">β</S> = 1</span></div>
    </div>
    <div className="dfa-scr-results">
      <div><span>普通平均</span><strong>−1.33</strong></div>
      <div className="dfa-scr-computation"><div className="dfa-early-formula"><S meaning="SCRₜ：完成第t个增量任务后的相似度校准保持率，单位为百分点。">SCRₜ</S> = <span className="dfa-frac"><span><S meaning="ΣWΔA：各评估域的权重乘准确率变化，再求和。">ΣWΔA</S></span><span><S meaning="ΣW：全部评估域的权重之和，用于归一化。">ΣW</S></span></span></div><p>每阶段加权，再对所有阶段取平均。</p></div>
      <div aria-live="polite"><span>校准后 · 百分点</span><strong className="dfa-score-negative">{fmt(score)}</strong></div>
    </div>
    <p className="dfa-scr-foot">教学示例：近域的迁移增益权重较低；远域的能力损失在总分中更明显。</p>
  </div>;
}
