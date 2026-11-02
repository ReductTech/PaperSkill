import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const METHODS = ['iCaRL', 'UCIR', 'BiC', 'WA', 'PODNet', 'DER'];
const BWT = [-4.14, -8.52, -3.40, -3.18, -16.27, 1.36];
const FWT = [-4.91, -5.56, -0.17, 0.82, -5.58, 1.49];

function Chart({ title, values, focus, onPick }: {
  title: string; values: number[]; focus: number; onPick: (i: number) => void;
}) {
  const zero = 430, scale = 13;
  const cx = (v: number) => zero + v * scale;
  return (
    <svg viewBox="0 0 700 520" style={{ width: '100%', height: '100%' }} role="img"
      aria-label={`${title}：${METHODS.map((m, i) => `${m} ${values[i]}%`).join('，')}`}>
      <text x="20" y="30" fontSize="21" fontWeight="700" fill="#27446e">{title}（百分点）</text>
      <line x1={zero} y1="52" x2={zero} y2="468" stroke="#9fb0c8" strokeWidth="2.5" />
      <text x={zero} y="496" textAnchor="middle" fontSize="18" fill="#68778f">0</text>
      {[-16, -12, -8, -4, 4].map(t => (
        <g key={t}>
          <line x1={cx(t)} y1="52" x2={cx(t)} y2="468" stroke="#ece2d1" strokeWidth="1" />
          <text x={cx(t)} y="496" textAnchor="middle" fontSize="16" fill="#93a0b4">{t}</text>
        </g>
      ))}
      {METHODS.map((m, i) => {
        const v = values[i];
        const y = 68 + i * 66;
        const on = focus === i;
        const ours = m === 'DER';
        const good = v > 0;
        return (
          <g key={m} onClick={() => onPick(i)} style={{ cursor: 'pointer' }} opacity={on ? 1 : 0.45}>
            <rect x="0" y={y - 8} width="700" height="44" fill={on ? '#f3f6fb' : 'transparent'} />
            <text x="96" y={y + 20} textAnchor="end" fontSize="20" fontWeight={ours ? 750 : 500}
              fill={ours ? '#1b6b47' : '#3b4a61'}>{m}</text>
            <rect x={Math.min(zero, cx(v))} y={y + 2} width={Math.abs(cx(v) - zero)} height="24" rx="5"
              fill={good ? '#228d5c' : '#c9a3aa'} opacity={ours ? 1 : .85} />
            <text x={good ? cx(v) + 10 : cx(v) - 10} y={y + 21} textAnchor={good ? 'start' : 'end'}
              fontSize="18" fontWeight="700" fill={good ? '#1b6b47' : '#8d3a4a'}>{v > 0 ? '+' : ''}{v.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function S12Transfer(_props: WidgetProps) {
  const [focus, setFocus] = useState(5);
  return (
    <div className="der-page">
      <div className="der-col" style={{ height: '100%', padding: '14px 22px', boxSizing: 'border-box', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <div className="der-panel" style={{ padding: 8 }}>
            <Chart title="BWT：后向迁移" values={BWT} focus={focus} onPick={setFocus} />
          </div>
          <div className="der-panel" style={{ padding: 8 }}>
            <Chart title="FWT：前向迁移" values={FWT} focus={focus} onPick={setFocus} />
          </div>
        </div>
        <div className="der-row der-spread" style={{ borderTop: '1px solid #ece2d1', paddingTop: 8 }}>
          <span className="der-p">
            {METHODS[focus]}：BWT {BWT[focus] > 0 ? '+' : ''}{BWT[focus].toFixed(2)}，FWT {FWT[focus] > 0 ? '+' : ''}{FWT[focus].toFixed(2)}
          </span>
          <span className="der-col" style={{ alignItems: 'flex-end', gap: 0 }}>
            <span className="der-p der-good">只有 DER 两边都为正</span>
            <span className="der-note-sm">负值只表示该方向的迁移为负，不等于方法整体更差</span>
          </span>
        </div>
      </div>
    </div>
  );
}
