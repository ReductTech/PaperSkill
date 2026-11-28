import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const DATA = [
  { key: 'MMSI', base: 38.35, ours: 42.89 },
  { key: 'SAT', base: 88.33, ours: 89.67 },
  { key: 'Spin', base: 82.24, ours: 83.76 },
  { key: 'SL-MCQ', base: 56.64, ours: 57.36 },
  { key: 'SL-Open', base: 36.21, ours: 37.64 },
  { key: 'ERQA', base: 51.75, ours: 58.5 },
  { key: 'Causal', base: 60.72, ours: 60.79 },
  { key: 'Perception', base: 50.84, ours: 51.35 },
  { key: '平均', base: 58.29, ours: 59.69 },
];

const W = 1440;
const H = 300;
const PAD_L = 64;
const PAD_R = 20;

export function S9Results(_props: WidgetProps) {
  const [selected, setSelected] = useState(0);
  const item = DATA[selected];
  const gain = item.ours - item.base;
  const relative = (gain / item.base) * 100;
  const plotW = W - PAD_L - PAD_R;
  const groupW = plotW / DATA.length;
  const barW = 30;
  const y = (value: number) => H - 22 - (value / 100) * (H - 44);
  return (
    <div className="ps-page s9-page">
      <div className="ps-chart">
        <svg viewBox={`0 0 ${W} ${H + 46}`} role="img" aria-label="七个基准上 GPT-5.6 直接推理与 CoWorld Reasoner 的准确率对比">
          {[0, 25, 50, 75, 100].map(tick => (
            <g key={tick}>
              <line x1={PAD_L} y1={y(tick)} x2={W - PAD_R} y2={y(tick)} stroke="#e6eaf1" strokeWidth="1.5" />
              <text x={PAD_L - 12} y={y(tick) + 7} textAnchor="end" fontSize="20" fill="#68778f">{tick}</text>
            </g>
          ))}
          {DATA.map((row, index) => {
            const cx = PAD_L + index * groupW + groupW / 2;
            const on = index === selected;
            return (
              <g key={row.key} role="button" tabIndex={0} aria-label={`${row.key}：${row.base} 提升到 ${row.ours}`}
                onClick={() => setSelected(index)} onKeyDown={event => { if (event.key === 'Enter') setSelected(index); }} className="ps-group">
                <rect x={PAD_L + index * groupW} y="0" width={groupW} height={H} fill={on ? '#f2f6fb' : 'transparent'} />
                <rect x={cx - barW - 4} y={y(row.base)} width={barW} height={H - y(row.base)} fill="#9aa8bb" rx="4" />
                <rect x={cx + 4} y={y(row.ours)} width={barW} height={H - y(row.ours)} fill={on ? '#228d5c' : '#27446e'} rx="4" />
                <text x={cx} y={y(Math.max(row.base, row.ours)) - 10} textAnchor="middle" fontSize="20" fontWeight="700" fill={on ? '#1c7a51' : '#68778f'}>
                  {on ? `+${gain.toFixed(2)}` : row.ours.toFixed(1)}
                </text>
                <text x={cx} y={H + 32} textAnchor="middle" fontSize={on ? 22 : 20} fontWeight={on ? 700 : 400} fill={on ? '#21324a' : '#68778f'}>{row.key}</text>
              </g>
            );
          })}
        </svg>
        <div className="ps-legend">
          <span><i style={{ background: '#9aa8bb' }} />GPT-5.6 直接推理</span>
          <span><i style={{ background: '#27446e' }} />CoWorld Reasoner</span>
        </div>
      </div>
      <div className="ps-readout">
        <div className="ps-readout-main">{gain >= 0 ? '+' : ''}{gain.toFixed(2)}<small>pp</small></div>
        <div className="ps-readout-side">相对提升 {relative.toFixed(1)}%</div>
        <div className="ps-readout-protocol">{item.base}% → {item.ours}%；测试集准确率，越高越好；Avg. 按题数加权。</div>
        <div className="ps-feedback is-info" aria-live="polite">七个基准全部提升：最大绝对提升在 ERQA（+6.75pp），最小在 CausalSpatial（+0.07pp）。</div>
      </div>
    </div>
  );
}
