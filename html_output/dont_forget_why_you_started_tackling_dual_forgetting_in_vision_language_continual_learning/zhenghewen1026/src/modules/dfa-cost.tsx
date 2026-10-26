import { SvgText } from './dfa-kit';
import React from 'react';
import { Camera, Film, fmt } from './dfa-kit';
import './dfa.css';
import './late.css';

const rows = [
  { name: 'MoE4Adapter', params: 4.03, time: .16 },
  { name: 'DMNSP', params: 1.98, time: .28 },
  { name: 'GIFT', params: 149.62, time: .88 },
  { name: 'DFA-MoE', params: 1.05, time: .25 },
];

export function DfaCost() {
  return <div className="dfa-page dfa-late-cost">
    <div className="dfa-late-param-list">
      <h3>可训练参数（百万）↓</h3>
      {rows.map((r, i) => <div key={r.name} className={i === 3 ? 'dfa-late-paper-row' : ''}><span>{r.name}</span><strong>{fmt(r.params)}</strong></div>)}
    </div>
    <svg className="dfa-late-time-chart" viewBox="0 0 832 444" role="img" aria-label="每迭代训练耗时：MoE4Adapter 0.16秒，DMNSP 0.28秒，GIFT 0.88秒，DFA-MoE 0.25秒">
      <SvgText x="68" y="38" className="dfa-late-svg-heading">每迭代训练耗时（秒）↓</SvgText>
      {[0,.2,.4,.6,.8,1].map(t => <g key={t}>
        <line x1={68 + t*680} y1="63" x2={68+t*680} y2="374" stroke={t === 0 ? '#68778f' : '#d7deea'} strokeWidth={t === 0 ? 2.5 : 1}/>
        <SvgText x={68+t*680} y="418" textAnchor="middle">{t}</SvgText>
      </g>)}
      {rows.map((r, i) => <g key={r.name}>
        <rect x="68" y={79 + i*76} width={r.time*680} height="38" rx="4" fill={i === 3 ? '#228d5c' : '#27446e'} opacity={i === 3 ? 1 : .58}/>
        <SvgText x={82+r.time*680} y={107+i*76} fontWeight="700">{fmt(r.time)}</SvgText>
      </g>)}
    </svg>
    <div className="dfa-late-cost-foot">
      <svg viewBox="0 0 260 150" aria-hidden="true"><Camera x={78} y={65} scale={.6}/><Film x={150} y={20} w={100} label="参数"/><path d="M10 136 H248" stroke="#d8c4a6" strokeWidth="12"/></svg>
      <div><strong>相对 MoE4Adapter：参数少 73.9%，每迭代耗时多 56.25%。</strong><p>22 来源平均保持分数：DFA-MoE −0.72；MoE4Adapter −1.57。</p><p>对比目标与两阶段优化增加计算，也改善双重遗忘表现。</p></div>
    </div>
  </div>;
}
