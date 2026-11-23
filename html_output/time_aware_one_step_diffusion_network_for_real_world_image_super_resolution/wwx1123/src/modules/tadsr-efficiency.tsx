import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const MODELS = [
  { name: 'StableSR', time: 10.40, qalign: 3.2767, steps: 200, params: 1563 },
  { name: 'DiffBIR', time: 9.83, qalign: 3.6313, steps: 50, params: 1682 },
  { name: 'SeeSR', time: 5.64, qalign: 3.7190, steps: 50, params: 2514 },
  { name: 'SinSR', time: .1785, qalign: 3.1889, steps: 1, params: 119 },
  { name: 'OSEDiff', time: .1463, qalign: 3.6915, steps: 1, params: 1775 },
  { name: 'S3Diff', time: .4704, qalign: 3.6638, steps: 1, params: 1327 },
  { name: 'AdcSR', time: .0825, qalign: 3.7749, steps: 1, params: 456 },
  { name: 'TSDSR', time: .0947, qalign: 3.7748, steps: 1, params: 2207 },
  { name: 'PisaSR', time: .1675, qalign: 3.6355, steps: 2, params: 1302 },
  { name: 'TADSR', time: .1465, qalign: 3.9477, steps: 1, params: 1777 },
];
const X = (t: number) => 92 + (Math.log10(t) - Math.log10(.07)) / (Math.log10(12) - Math.log10(.07)) * 700;
const Y = (q: number) => 420 - (q - 3.1) / 0.95 * 330;
const OFFSET: Record<string, [number, number, 'start' | 'end']> = {
  TADSR: [22, -14, 'start'], OSEDiff: [18, -16, 'start'], PisaSR: [18, 22, 'start'],
  AdcSR: [18, -18, 'start'], TSDSR: [14, 30, 'start'], S3Diff: [18, -14, 'start'],
  SinSR: [18, -14, 'start'], SeeSR: [18, -14, 'start'], DiffBIR: [18, -14, 'start'],
  StableSR: [-20, -14, 'end'],
};

export function TadsrEfficiency(_: WidgetProps) {
  const [pick, setPick] = useState('TADSR');
  const selected = MODELS.find(m => m.name === pick)!;
  const isPaper = selected.name === 'TADSR';

  return (
    <div className="studio-page tadsr-eff">
      <div className="studio-card tadsr-eff-chart" style={{ padding: '10px 12px' }}>
        <svg viewBox="0 0 900 560" role="img" aria-label="推理时间与 RealSR QALIGN 的散点比较">
          <line x1="92" y1="430" x2="820" y2="430" stroke="#d7deea" strokeWidth="2" />
          <line x1="92" y1="80" x2="92" y2="430" stroke="#d7deea" strokeWidth="2" />
          {[.1, 1, 10].map(v => <g key={v}><line x1={X(v)} y1="430" x2={X(v)} y2="438" stroke="#d7deea" strokeWidth="2" /><text x={X(v)} y="466" textAnchor="middle" className="studio-axis">{v} s</text></g>)}
          {[3.2, 3.4, 3.6, 3.8, 4.0].map(v => <g key={v}><line x1="86" y1={Y(v)} x2="92" y2={Y(v)} stroke="#d7deea" strokeWidth="2" /><text x="78" y={Y(v) + 8} textAnchor="end" className="studio-axis">{v.toFixed(1)}</text></g>)}
          <text x="100" y="500" className="studio-axis">推理时间（对数刻度，越左越快）</text>
          {MODELS.map(m => {
            const active = pick === m.name;
            const color = m.name === 'TADSR' ? '#228d5c' : m.name === 'PisaSR' ? '#7c3aed' : '#91a2b8';
            return <g key={m.name} role="button" tabIndex={0} aria-label={`选择 ${m.name}`}
              onClick={() => setPick(m.name)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPick(m.name); } }} style={{ cursor: 'pointer' }}>
              <circle cx={X(m.time)} cy={Y(m.qalign)} r={active ? 18 : 12} fill={color} opacity={active ? 1 : .78} stroke={active ? '#f07e47' : '#fff'} strokeWidth={active ? 5 : 3} />
              <text x={X(m.time) + (OFFSET[m.name]?.[0] ?? 18)} y={Y(m.qalign) + (OFFSET[m.name]?.[1] ?? -14)} className="studio-value" textAnchor={OFFSET[m.name]?.[2] ?? 'start'} fill={color}>{m.name}</text>
            </g>;
          })}
        </svg>
      </div>
      <div className="tadsr-eff-side">
        <p className="studio-heading">一步与可控性能否同时成立</p>
        <div className="tadsr-eff-card">
          <b>{selected.name}</b>
          <span>推理 {selected.steps} 步 · {selected.time.toFixed(4)} s · {selected.params} MB</span>
          <span>RealSR QALIGN {selected.qalign.toFixed(4)}</span>
        </div>
        <div className="studio-row">
          {['TADSR', 'OSEDiff', 'PisaSR', 'AdcSR'].map(n => <button key={n} className={`studio-btn ${pick === n ? 'is-on' : ''}`} onClick={() => setPick(n)}>{n}</button>)}
        </div>
        <p className={`studio-feedback ${isPaper ? 'is-good' : 'is-paper'}`}>
          {isPaper ? 'TADSR 与 OSEDiff 时间/参数量相当，QALIGN 更高；只改 tₛ 就能调档。' : selected.name === 'PisaSR' ? 'PisaSR 的 QALIGN 3.636，且需要 2 步；可控性的实现方式不同。' : `${selected.name}：${selected.steps} 步，QALIGN ${selected.qalign.toFixed(4)}。`}
        </p>
        <p className="studio-caption">Table 7：单张 3090 24G、128×128 LQ、×4 SR；横轴对数，点不连线。</p>
      </div>
    </div>
  );
}
