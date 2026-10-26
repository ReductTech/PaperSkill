import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { Photo, fmt } from './dfa-kit';
import './dfa.css';
import './late.css';

const sources = [
  { name: 'EuroSAT', kind: 'landscape' as const, protocol: '10 类 · 5 个任务', values: [[62.52,-15.56,-4.16],[69.52,-2.57,-1.04],[72.25,-2.96,-.79]] },
  { name: 'OxfordFlower', kind: 'flower' as const, protocol: '102 类 · 17 个任务', values: [[67.72,-5.39,-.75],[70.21,-10.28,-.86],[70.40,-6.37,-.66]] },
  { name: 'FER2013', kind: 'face' as const, protocol: '7 类 · 4 个任务', values: [[60.59,-14.88,-2],[44.98,-16.21,-1.83],[62.37,-13.21,-1.74]] },
];
const methods = ['MoE4Adapter', 'GIFT', 'DFA-MoE'];
const metrics = ['增量准确率', '后向迁移', '整体保持分数'];

export function DfaResults() {
  const [dataset, setDataset] = useState(0);
  const [metric, setMetric] = useState(0);
  const current = sources[dataset];
  const values = current.values.map(v => v[metric]);
  const min = metric === 0 ? 0 : metric === 1 ? -20 : -5;
  const max = metric === 0 ? 80 : 0;
  const x = (v: number) => 250 + (v - min) / (max - min) * 750;
  const ticks = metric === 0 ? [0,20,40,60,80] : metric === 1 ? [-20,-15,-10,-5,0] : [-5,-4,-3,-2,-1,0];
  const best = values.indexOf(Math.max(...values));
  const comparison = metric === 0 ? `DFA-MoE 达到 ${fmt(values[2])}%，高于这里的两条基线。`
    : metric === 2 ? `DFA-MoE 的整体保持分数为 ${fmt(values[2])}，在这三种方法中最高。`
    : dataset === 0 ? 'GIFT 的后向迁移为 −2.57，高于 DFA-MoE 的 −2.96。'
    : dataset === 1 ? 'MoE4Adapter 的后向迁移为 −5.39，高于 DFA-MoE 的 −6.37。'
    : 'DFA-MoE 的后向迁移为 −13.21，在这里的三种方法中最高。';
  return <div className="dfa-page dfa-late-results">
    <aside className="dfa-late-results-choices">
      <div className="dfa-late-source-buttons" role="group" aria-label="增量训练数据集">
        {sources.map((s, i) => <button key={s.name} aria-pressed={dataset === i} onClick={() => setDataset(i)}>{s.name}</button>)}
      </div>
      <div className="dfa-late-metric-buttons" role="group" aria-label="评价指标">
        {metrics.map((name, i) => <button key={name} aria-pressed={metric === i} onClick={() => setMetric(i)}>{name}</button>)}
      </div>
    </aside>
    <svg className="dfa-late-results-chart" viewBox="0 0 1132 460" role="img" aria-label={`${current.name}，${metrics[metric]}，越高越好：${methods.map((m,i) => `${m} ${values[i]}`).join('；')}`}>
      <SvgText x="250" y="38" className="dfa-late-svg-heading">{metrics[metric]}（{metric === 0 ? '%' : '百分点'}）↑</SvgText>
      {ticks.map(t => <g key={t}>
        <line x1={x(t)} y1="76" x2={x(t)} y2="375" stroke={t === 0 ? '#68778f' : '#d7deea'} strokeWidth={t === 0 ? 2.5 : 1}/>
        <SvgText x={x(t)} y="420" textAnchor="middle">{t}</SvgText>
      </g>)}
      {values.map((value, i) => <g key={methods[i]}>
        <SvgText x="220" y={128 + 102*i} textAnchor="end" fontWeight={i === 2 ? 750 : 500}>{methods[i]}</SvgText>
        <line x1={x(0)} y1={118+102*i} x2={x(value)} y2={118+102*i} stroke={i === 2 ? '#228d5c' : '#27446e'} strokeWidth="8" opacity=".3"/>
        <circle cx={x(value)} cy={118+102*i} r={i === best ? 14 : 10} fill={i === 2 ? '#228d5c' : '#27446e'}/>
        <SvgText x={x(value)} y={91+102*i} textAnchor="middle" fontWeight="750">{fmt(value)}</SvgText>
      </g>)}
    </svg>
    <div className="dfa-late-results-foot" aria-live="polite">
      <svg viewBox="0 0 150 130" aria-hidden="true"><Photo x={15} y={15} w={120} h={96} kind={current.kind}/></svg>
      <div><strong>{current.name} · {current.protocol}</strong><p>{comparison}</p><p>冻结 CLIP ViT-B/16；整体保持分数覆盖其余 24 个零样本评估域。</p></div>
    </div>
  </div>;
}
