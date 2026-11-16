import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

type Stage = { label: string; shared: 'update' | 'freeze' | 'none'; note: string };
type Recipe = {
  id: string; name: string; stages: Stage[]; tone: 'green' | 'red' | 'blue';
  verdict: string; detail: string; trend: number[] | null;
};

const BUDGETS = [
  { label: '3k', pool: '1,876 例' },
  { label: '10k', pool: '9,380 例' },
  { label: '30k', pool: '30,016 例' },
  { label: '100k', pool: '100,000 例' },
];

const RECIPES: Recipe[] = [
  {
    id: 'i2i-i2t', name: 'I2I → I2T', tone: 'green',
    stages: [{ label: '做一批木工', shared: 'update', note: '共享参数被更新' }, { label: '再练口述', shared: 'none', note: '只训 I2T' }],
    verdict: '随 I2I 数据稳定提升',
    detail: '论文默认配方：第一段就更新与理解共享的参数，第二段只练口述；四个 I2I 数据量上都在往上走。',
    trend: [0.16, 0.34, 0.60, 0.94],
  },
  {
    id: 'i2i-mixed', name: 'I2I → Mixed', tone: 'green',
    stages: [{ label: '做一批木工', shared: 'update', note: '共享参数被更新' }, { label: '做活与口述同批', shared: 'none', note: 'Mixed 阶段' }],
    verdict: '随 I2I 数据稳定提升',
    detail: '第一段同样更新共享参数，第二段把两种数据放进同一个 batch，论文报告它和 I2I→I2T 一样稳定 scaling。',
    trend: [0.18, 0.33, 0.58, 0.90],
  },
  {
    id: 'mixed-i2t', name: 'Mixed → I2T', tone: 'red',
    stages: [{ label: '一开始就同批混合', shared: 'update', note: '没有独立的生成段' }, { label: '再单独练口述', shared: 'none', note: '只训 I2T' }],
    verdict: '出现，但不够稳',
    detail: '第一段就把两种目标混在一起，没有独立的生成训练过程，论文报告其收益比不上两条以 I2I 开头的配方。',
    trend: [0.20, 0.30, 0.36, 0.43],
  },
  {
    id: 'mixed', name: 'Mixed', tone: 'red',
    stages: [{ label: '全程同批混合', shared: 'update', note: '没有第二阶段' }, { label: '—', shared: 'none', note: '—' }],
    verdict: '没有一致的 scaling 收益',
    detail: '图 2(b) 里随 I2I 数据增加，混合训练的曲线没有一致上升，论文因此没有把它当作可扩展的配方。',
    trend: [0.26, 0.22, 0.30, 0.27],
  },
  {
    id: 'frozen-i2i-mixed', name: 'Frozen I2I → Mixed', tone: 'red',
    stages: [{ label: '只让助手动手', shared: 'freeze', note: '共享参数被冻结' }, { label: '做活与口述同批', shared: 'none', note: 'Mixed 阶段' }],
    verdict: '收益更弱',
    detail: '生成阶段冻结了与理解共享的参数，只更新生成专有参数——师傅手感没变，理解端几乎没拿到初始化。',
    trend: [0.19, 0.24, 0.27, 0.31],
  },
  {
    id: 'i2t', name: 'I2T-only', tone: 'blue',
    stages: [{ label: '只练口述', shared: 'none', note: '没有生成阶段' }, { label: '—', shared: 'none', note: '—' }],
    verdict: '基线',
    detail: '后续所有迁移增益都以它为基线：Δ = 训练后准确率 − I2T-only 准确率。它没有 I2I 横轴，因此不在曲线上移动。',
    trend: null,
  },
];

const toneColor = (tone: Recipe['tone']) => (tone === 'green' ? C.green : tone === 'red' ? C.red : C.blue);

export function S2Recipes(_props: WidgetProps) {
  const [id, setId] = useState('i2i-i2t');
  const [budget, setBudget] = useState(3);
  const recipe = RECIPES.find((item) => item.id === id)!;
  const color = toneColor(recipe.tone);
  const point = recipe.trend ? recipe.trend[budget] : null;

  const X = (index: number) => 56 + index * 88;
  const Y = (v: number) => 250 - v * 190;

  return (
    <div style={{ display: 'flex', gap: 20, width: 1472, height: 622 }}>
      <div style={{ width: 470, background: C.bg, border: `2px solid ${C.line}`, borderRadius: 18, padding: '12px 14px', boxSizing: 'border-box' }}>
        <svg viewBox="0 0 440 560" width="440" height="560" role="img" aria-label={`配方 ${recipe.name} 的两段工序与共享参数状态`}>
          <rect x="14" y="500" width="412" height="44" rx="10" fill={C.woodSoft} stroke={C.wood} strokeWidth="2.5" />
          <g transform="translate(52 372)">
            <path d="M-20 96 V40 a20 20 0 0 1 40 0 V96 Z" fill={C.envL} stroke={C.envD} strokeWidth="2" />
            <circle cx="0" cy="10" r="16" fill="#e8c9a0" stroke={C.wood} strokeWidth="2" />
            <path d="M20 44 L46 56" stroke={C.wood} strokeWidth="7" strokeLinecap="round" />
          </g>
          {recipe.stages.map((stage, index) => {
            const y = 26 + index * 178;
            const dot = stage.shared === 'update' ? C.blue : stage.shared === 'freeze' ? C.red : C.muted;
            return (
              <g key={`${stage.label}-${index}`}>
                <rect x="120" y={y} width="300" height="150" rx="14" fill="#fff" stroke={dot} strokeWidth="2.5" />
                <circle cx="146" cy={y + 30} r="11" fill={dot} />
                <text x="168" y={y + 38} fontSize="25" fill={C.ink}>{stage.label}</text>
                <text x="138" y={y + 76} fontSize="21" fill={C.muted}>{stage.note}</text>
                <rect x="138" y={y + 92} width="264" height="30" rx="8" fill={dot} opacity=".12" />
                <text x="150" y={y + 114} fontSize="19" fill={dot}>
                  {stage.shared === 'update' ? '共享参数：被更新（手感在变）'
                    : stage.shared === 'freeze' ? '共享参数：冻结（手感不变）'
                      : '共享参数：本段不涉及'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ width: 430, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#fff', border: `2px solid ${C.line}`, borderRadius: 14, padding: '10px 14px', flex: 1 }}>
          <div style={{ fontSize: 20, color: C.muted }}>I2T 准确率随 I2I 数据量的走向（形状示意，非原始数值）</div>
          <svg viewBox="0 0 400 300" width="400" height="300" role="img" aria-label="所选配方的趋势示意，当前数据档高亮">
            <line x1="40" y1="250" x2="380" y2="250" stroke={C.line} strokeWidth="2" />
            <line x1="40" y1="40" x2="40" y2="250" stroke={C.line} strokeWidth="2" />
            {BUDGETS.map((item, index) => (
              <g key={item.label}>
                <line x1={X(index)} y1="250" x2={X(index)} y2="256" stroke={C.muted} strokeWidth="2" />
                <text x={X(index)} y="276" fontSize="18" fill={budget === index ? C.blue : C.muted} textAnchor="middle">{item.label}</text>
              </g>
            ))}
            <text x="210" y="296" fontSize="17" fill={C.muted} textAnchor="middle">I2I 训练样本量</text>
            {recipe.trend ? (
              <g>
                <polyline
                  points={recipe.trend.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}
                  fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
                {recipe.trend.map((v, i) => (
                  <circle key={i} cx={X(i)} cy={Y(v)} r={budget === i ? 9 : 5}
                    fill={budget === i ? C.orange : '#fff'} stroke={color} strokeWidth="2.5" />
                ))}
                <line x1={X(budget)} y1="250" x2={X(budget)} y2={Y(recipe.trend[budget])} stroke={C.orange} strokeWidth="2" strokeDasharray="6 5" />
              </g>
            ) : (
              <text x="210" y="150" fontSize="21" fill={C.blue} textAnchor="middle">I2T-only 没有生成阶段</text>
            )}
            <text x="40" y="34" fontSize="17" fill={C.muted}>准确率（示意纵向位置）</text>
          </svg>
          <div style={{ fontSize: 19, color: C.muted, marginTop: 2 }}>
            当前：{BUDGETS[budget].label} 档，I2I 池 {BUDGETS[budget].pool}（论文表 3）。
          </div>
        </div>
        <div style={{ background: '#fff', border: `2px solid ${C.line}`, borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ fontSize: 19, color: C.muted, marginBottom: 6 }}>拖动或点选 I2I 数据档</div>
          <input type="range" min={0} max={3} step={1} value={budget} aria-label="I2I 训练样本量档位"
            onChange={(event) => setBudget(Number(event.target.value))}
            style={{ width: '100%', accentColor: C.orange }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, color: C.muted }}>
            {BUDGETS.map((item) => <span key={item.label}>{item.label}</span>)}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {RECIPES.map((item) => {
            const active = item.id === id;
            return (
              <button key={item.id} type="button" onClick={() => setId(item.id)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                  background: active ? 'rgba(240,126,71,.10)' : '#fff',
                  border: `2px solid ${active ? C.orange : C.line}`,
                  fontSize: 21, color: C.ink, fontFamily: 'inherit',
                }}>
                <span style={{ display: 'block', fontWeight: 700 }}>{item.name}</span>
                <span style={{ display: 'block', fontSize: 17, color: toneColor(item.tone), marginTop: 2 }}>{item.verdict}</span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: '14px 18px', borderRadius: 14, background: '#fff', border: `2px solid ${color}`, flex: 1 }}>
          <div style={{ fontSize: 27, fontWeight: 700, color }}>{recipe.name}</div>
          <div style={{ fontSize: 21, lineHeight: 1.5, color: C.ink, marginTop: 6 }}>{recipe.detail}</div>
          <div style={{ fontSize: 20, color: point === null ? C.blue : color, marginTop: 8 }}>
            {point === null
              ? '该配方没有 I2I 数据横轴。'
              : `在 ${BUDGETS[budget].label} 档：${recipe.verdict === '随 I2I 数据稳定提升' ? '曲线继续上扬' : '曲线基本走平'}（示意）。`}
          </div>
          <div style={{ fontSize: 18, color: C.muted, marginTop: 8 }}>
            论文只报告相对趋势；曲线形状为示意，未按原始数值绘制。
          </div>
        </div>
      </div>
    </div>
  );
}
