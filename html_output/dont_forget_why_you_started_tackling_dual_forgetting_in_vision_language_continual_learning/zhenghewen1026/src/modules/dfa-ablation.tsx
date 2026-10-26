import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { Camera, fmt } from './dfa-kit';
import './dfa.css';
import './late.css';

const configs = ['同质专家', '异质分工', '＋对比目标', '＋历史队列'];
const acc = [62.52, 69.58, 71.74, 72.25];
const scr = [-4.16, -1.11, -.85, -.79];
const conclusions = [
  '同质专家：增量准确率 62.52%，整体保持分数 −4.16。',
  '异质分工：准确率提高 7.06 个百分点，保持分数提高 3.05。',
  '加入对比目标：准确率再提高 2.16 个百分点，保持分数提高 0.26。',
  '加入历史队列：准确率再提高 0.51 个百分点，保持分数提高 0.06。',
];

function AblationChart({ values, selected, select, negative }: {
  values: number[]; selected: number; select: (n: number) => void; negative?: boolean;
}) {
  const min = negative ? -5 : 0;
  const max = negative ? 0 : 80;
  const y = (v: number) => 70 + (max - v) / (max - min) * 300;
  const ticks = negative ? [0, -1, -2, -3, -4, -5] : [0, 20, 40, 60, 80];
  return <svg viewBox="0 0 720 460" role="group" aria-label={negative ? '整体相似度校准保持率，百分点，越高越好' : '增量分类准确率，百分比，越高越好'}>
    <SvgText x="64" y="40" className="dfa-late-svg-heading">{negative ? '整体保持分数（百分点）↑' : '增量准确率（%）↑'}</SvgText>
    {ticks.map(t => <g key={t}>
      <line x1="64" y1={y(t)} x2="702" y2={y(t)} stroke={t === 0 ? '#68778f' : '#d7deea'} strokeWidth={t === 0 ? 2.5 : 1}/>
      <SvgText x="49" y={y(t) + 9} textAnchor="end">{t}</SvgText>
    </g>)}
    {values.map((value, i) => {
      const x = 96 + 152 * i;
      const active = selected === i;
      return <g key={i} role="button" tabIndex={0} aria-pressed={active}
        aria-label={`${configs[i]}，${negative ? '整体保持分数' : '增量准确率'}${fmt(value)}${negative ? '个百分点' : '%'}`}
        onClick={() => select(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } }} className="dfa-late-chart-hit">
        <rect x={x - 16} y="51" width="136" height="397" fill={active ? '#edf1f4' : 'transparent'} rx="12"/>
        <rect x={x} y={Math.min(y(0), y(value))} width="104" height={Math.abs(y(value) - y(0))}
          fill={i === 3 ? '#228d5c' : '#27446e'} opacity={active ? 1 : .4} rx="4"/>
        <SvgText x={x + 52} y={negative ? y(value) + 36 : y(value) - 15} textAnchor="middle" fontWeight="750">{fmt(value)}</SvgText>
        <SvgText x={x + 52} y="430" textAnchor="middle" fill={active ? '#27446e' : '#68778f'}>{configs[i]}</SvgText>
      </g>;
    })}
  </svg>;
}

export function DfaAblation() {
  const [selected, setSelected] = useState(3);
  return <div className="dfa-page dfa-late-ablation">
    <div className="dfa-late-ablation-charts">
      <AblationChart values={acc} selected={selected} select={setSelected}/>
      <AblationChart values={scr} selected={selected} select={setSelected} negative/>
    </div>
    <div className="dfa-late-ablation-foot" aria-live="polite">
      <svg viewBox="0 0 180 120" aria-hidden="true"><Camera x={90} y={58} scale={.6}/><path d="M20 104 H165" stroke="#d8c4a6" strokeWidth="8"/></svg>
      <div><strong>EuroSAT · 10 类 / 5 个任务</strong><p>{conclusions[selected]}</p></div>
    </div>
  </div>;
}
