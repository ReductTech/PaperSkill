import React, { useState } from 'react';
import { Feedback, INK, Meter } from './kit';

type Layer = 'index' | 'topic' | 'archive';

const LAYERS: { id: Layer; name: string; note: string; color: string }[] = [
  { id: 'index', name: '索引', note: '每轮常驻', color: INK.blue },
  { id: 'topic', name: '主题', note: '按需加载', color: INK.green },
  { id: 'archive', name: '存档', note: '只被检索', color: INK.orange },
];

const FACTS = [
  { id: 'F1', text: '只用 pnpm', tag: 'pnpm', need: false },
  { id: 'F2', text: '测试跑 pnpm test', tag: 'test', need: true },
  { id: 'F3', text: '网关超时复盘', tag: '复盘', need: false },
  { id: 'F4', text: '迁移脚本位置', tag: '迁移', need: true },
  { id: 'F5', text: '一次性调试日志', tag: '日志', need: false },
];

/* 成本口径：索引按 10 轮常驻计；主题只在需要的那一轮加载；存档不进上下文，只付一次检索。
   三个数字是教学单位，量级关系比绝对值重要。 */
const COST: Record<Layer, (need: boolean) => number> = {
  index: () => 100,
  topic: need => (need ? 36 : 0),
  archive: need => (need ? 24 : 0),
};

export function MemoryShelves() {
  const [placed, setPlaced] = useState<Record<string, Layer>>({ F1: 'index', F2: 'index', F3: 'index', F4: 'index', F5: 'index' });
  const total = FACTS.reduce((sum, fact) => sum + COST[placed[fact.id]](fact.need), 0);
  const indexCount = FACTS.filter(f => placed[f.id] === 'index').length;
  const archivedNeeded = FACTS.filter(f => f.need && placed[f.id] === 'archive').length;
  const tone = total > 160 ? 'bad' : archivedNeeded > 0 || indexCount > 3 ? 'neutral' : 'good';

  const cycle = (id: string) => setPlaced(current => {
    const order: Layer[] = ['index', 'topic', 'archive'];
    const next = order[(order.indexOf(current[id]) + 1) % order.length];
    return { ...current, [id]: next };
  });

  return (
    <div className="ps" style={{ gridTemplateColumns: 'minmax(0, 1.02fr) minmax(0, 1fr)' }}>
      <div className="ps-card ps-card--plain" style={{ padding: 12 }}>
        <svg className="ps-art" viewBox="0 0 680 566" role="img" aria-label="三层卡片柜：索引常驻、主题按需、存档只检索">
          <rect x="0" y="0" width="680" height="566" rx="14" fill="#f8f3e4" />
          {LAYERS.map((layer, row) => {
            const y = 26 + row * 180;
            const members = FACTS.filter(f => placed[f.id] === layer.id);
            return (
              <g key={layer.id}>
                <text x="28" y={y + 30} fill={layer.color} fontSize="30" fontWeight="700">{layer.name}</text>
                <text x="120" y={y + 30} fill={INK.muted} fontSize="30">· {layer.note}</text>
                <rect x="24" y={y + 44} width="632" height="104" rx="10" fill="#fffdf4" stroke={INK.edge} strokeWidth="3" />
                {members.map((fact, i) => (
                  <g key={fact.id} transform={`translate(${40 + i * 124} ${y + 64})`}>
                    <rect width="108" height="64" rx="8" fill="#fffef9" stroke={layer.color} strokeWidth="3" />
                    <text x="12" y="27" fill={layer.color} fontSize="30" fontWeight="700">{fact.id}</text>
                    <text x="12" y="55" fill={INK.ink} fontSize="30">{fact.tag}</text>
                    {fact.need && <circle cx="92" cy="18" r="8" fill={INK.orange} />}
                  </g>
                ))}
                {members.length === 0 && <text x="44" y={y + 108} fill={INK.muted} fontSize="30">（空）</text>}
                <rect x="24" y={y + 148} width="632" height="10" rx="5" fill={INK.wood} opacity="0.75" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="ps-col" style={{ gap: 8 }}>
        {FACTS.map(fact => {
          const layer = LAYERS.find(item => item.id === placed[fact.id])!;
          return (
            <button key={fact.id} type="button" className="ps-btn ps-btn--block"
              style={{ padding: '6px 16px' }} onClick={() => cycle(fact.id)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <b style={{ color: layer.color, flex: 'none' }}>{fact.id}</b>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fact.text}</span>
                {fact.need && <span className="ps-chip" data-tone="orange" style={{ flex: 'none' }}>需要</span>}
              </span>
              <span className="ps-chip" data-tone="blue" style={{ flex: 'none', background: '#fff', borderColor: layer.color, color: layer.color }}>
                {layer.name}
              </span>
            </button>
          );
        })}
        <Meter label="10 轮上下文成本" value={total} max={500}
          tone={total > 160 ? 'red' : 'green'} readout={`${total}`} />
        <Feedback tone={tone}>
          {total > 160
            ? '索引变成了内容仓库：每一轮都在为全部事实付费。'
            : archivedNeeded > 0
              ? '成本很低，但需要的事实进了存档：每次使用都要先检索一次。'
              : indexCount > 3
                ? '成本降下来了，但索引仍偏重，指针才应该是常驻项。'
                : '索引只留少量常驻，需要的主题按需加载，存档只被检索。'}
        </Feedback>
        <p className="ps-t ps-muted">点一行换一层 · 橙点 = 本轮需要 · 成本为教学单位</p>
      </div>
    </div>
  );
}
