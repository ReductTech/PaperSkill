import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { usePanelWidth } from './omni-interaction-kit';

const MODELS = [
  { name: 'BrainOmni', color: '#245d87', lp: 1, ft: 4, ftValue: '' },
  { name: 'CBraMod', color: '#27815f', lp: 2, ft: 1, ftValue: '4.51' },
  { name: 'REVE', color: '#6756a3', lp: 3, ft: 4, ftValue: '' },
  { name: 'LaBraM', color: '#168d97', lp: 4, ft: 2, ftValue: '4.88' },
  { name: 'FEMBA', color: '#c47719', lp: 4, ft: 3, ftValue: '5.42' },
];

export const OmniLab10: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const width = mobile ? 360 : 920;
  const height = mobile ? 420 : 370;
  const [mode, setMode] = useState<'linear' | 'finetune'>('linear');
  const plot = mobile ? { x: 112, y: 72, w: 208, row: 52 } : { x: 174, y: 76, w: 650, row: 54 };
  const nearFt = mode === 'finetune';

  return (
    <div className="oi-unit" ref={ref}>
      <div className="ob-state-control" role="group" aria-label="切换论文报告的适配设置">
        <button type="button" className={!nearFt ? 'active' : ''} aria-pressed={!nearFt} onClick={() => setMode('linear')}>线性探测 · 冻结骨干</button>
        <button type="button" className={nearFt ? 'active' : ''} aria-pressed={nearFt} onClick={() => setMode('finetune')}>全量微调 · 更新骨干</button>
      </div>
      <div className="oi-caption"><span>两个离散评测设置，没有中间协议</span><strong>{nearFt ? '全量微调 · 骨干更新' : '线性探测 · 骨干冻结'}</strong></div>
      <svg
        className="oi-stage"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="切换线性探测和全量微调，比较模型排名"
      >
        <rect x=".5" y=".5" width={width - 1} height={height - 1} rx="6" fill="#f7f9fb" stroke="#d6e0e8" />
        <rect x={mobile ? 24 : 42} y="48" width={mobile ? 312 : 836} height={mobile ? 310 : 300} rx="5" fill="#fff" stroke="#cbd7e1" />
        {['第 1', '第 2', '第 3', '前三外'].map((label, rank) => {
          const x = plot.x + rank / 3 * plot.w;
          return <g key={label}><line x1={x} y1={mobile ? 62 : 64} x2={x} y2={mobile ? 330 : 330} stroke={rank === 3 ? '#d8dee4' : '#e8edf1'} strokeDasharray={rank === 3 ? '5 5' : undefined} /><text x={x} y={mobile ? 60 : 59} textAnchor="middle" className={rank === 3 ? 'oi-note' : 'oi-label'}>{label}</text></g>;
        })}
        {MODELS.map((model, index) => {
          const rank = nearFt ? model.ft : model.lp;
          const x = plot.x + ((rank - 1) / 3) * plot.w;
          const y = plot.y + index * plot.row + 28;
          const inTop = rank < 3.5;
          return <g key={model.name}>
            <text x={mobile ? 38 : 62} y={y + 4} className="oi-label">{model.name}</text>
            <line x1={plot.x} y1={y} x2={x} y2={y} stroke={model.color} strokeWidth="5" strokeLinecap="round" opacity={inTop ? .82 : .28} style={{ transition: 'x2 .55s ease, opacity .35s ease' }} />
            <circle cx={x} cy={y} r={inTop ? 10 : 8} fill="#fff" stroke={model.color} strokeWidth="4" opacity={inTop ? 1 : .55} style={{ transition: 'cx .55s ease, opacity .35s ease' }} />
            {nearFt && model.ftValue && <text x={x} y={y - 15} textAnchor="middle" className="oi-mini">平均名次 {model.ftValue}</text>}
          </g>;
        })}
        <text x={width / 2} y={mobile ? 382 : 350} textAnchor="middle" className="oi-note">{nearFt ? '前三显示论文报告的跨数据集平均名次' : '论文给出前三序位，未给出可直接并列展示的前三平均名次'}</text>
      </svg>
      <div className="oi-feedback neutral"><b>{nearFt ? '允许骨干随任务更新后，CBraMod、LaBraM、FEMBA 进入前三。' : '冻结骨干时，BrainOmni、CBraMod、REVE 进入前三。'} 排名变化说明两种设置测到的能力不同。</b></div>
    </div>
  );
};
