import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

const TARGETS = [
  {
    id: 'counting', zh: '想提升计数',
    sources: ['Localization +2.5 pp', 'Object pointing +2.0 pp', 'Inpainting +1.5 pp'],
    recipe: 'I2I → I2T',
    why: '计数与定位共享“找出并指认单个物体”的能力，所以定位类源任务帮助最直接。',
  },
  {
    id: 'order', zh: '想提升 2D 排序',
    sources: ['Inpainting +7.2 pp', 'Jigsaw +6.8 pp'],
    recipe: 'I2I → I2T',
    why: '补全与拼图都要恢复区域间的相对空间结构，这是本页报告的最大单点增益。',
  },
  {
    id: 'metric3d', zh: '想提升度量 3D 关系',
    sources: ['Euclidean depth +3.8 pp', 'Z-depth +3.6 pp', 'Surface normals +3.4 pp'],
    recipe: 'I2I → I2T',
    why: '三种稠密几何重建任务都把像素级的远近与朝向监督带进了关系判断。',
  },
];

export function S12RecipeCard(_props: WidgetProps) {
  const [id, setId] = useState('counting');
  const [sameSetup, setSameSetup] = useState(true);
  const target = TARGETS.find((item) => item.id === id)!;

  return (
    <div style={{ display: 'flex', gap: 26, width: 1472, height: 622 }}>
      <div style={{ width: 640, background: C.bg, border: `2px solid ${C.line}`, borderRadius: 18 }}>
        <svg viewBox="0 0 640 560" width="640" height="560" role="img" aria-label="工作台收尾：木料已拼成整板，编号贴对齐">
          <rect x="20" y="452" width="600" height="56" rx="12" fill={C.woodSoft} stroke={C.wood} strokeWidth="2.5" />
          <g transform="translate(112 96)">
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(${(i % 2) * 196} ${Math.floor(i / 2) * 196})`}>
                <rect width="190" height="190" rx="10" fill={C.woodSoft} stroke={C.wood} strokeWidth="3" />
                <circle cx="164" cy="26" r="17" fill="#fff" stroke={C.green} strokeWidth="2.5" />
                <text x="164" y="33" textAnchor="middle" fontSize="18" fontWeight="700" fill={C.ink}>{i + 1}</text>
                {i === 0 && <path d="M22 60 H168 M22 100 H168 M22 140 H168" stroke={C.wood} strokeWidth="3" opacity=".45" />}
                {i === 1 && <path d="M50 20 V170 M100 20 V170 M150 20 V170" stroke={C.wood} strokeWidth="3" opacity=".45" />}
                {i === 2 && <circle cx="95" cy="95" r="38" fill="none" stroke={C.wood} strokeWidth="3" opacity=".5" />}
                {i === 3 && <path d="M40 150 L95 40 L150 150" fill="none" stroke={C.wood} strokeWidth="3" opacity=".5" />}
              </g>
            ))}
          </g>
          <g transform="translate(560 286)">
            <path d="M-22 96 V40 a22 22 0 0 1 44 0 V96 Z" fill={C.envL} stroke={C.envD} strokeWidth="2" />
            <circle cx="0" cy="12" r="17" fill="#e8c9a0" stroke={C.wood} strokeWidth="2" />
            <path d="M22 46 L52 58" stroke={C.wood} strokeWidth="7" strokeLinecap="round" />
          </g>
          <text x="36" y="40" fontSize="26" fill={C.ink}>成品：先拼后说</text>
          <text x="36" y="72" fontSize="21" fill={C.muted}>板材归位、编号一路对到底</text>
        </svg>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {TARGETS.map((item) => (
            <button key={item.id} type="button" onClick={() => setId(item.id)}
              style={{
                flex: 1, padding: '13px 10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 23, color: C.ink,
                background: item.id === id ? 'rgba(240,126,71,.12)' : '#fff',
                border: `2px solid ${item.id === id ? C.orange : C.line}`,
              }}>{item.zh}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {[{ label: '同一底座 · 50k/50k', value: true }, { label: '换底座或改预算', value: false }].map((item) => (
            <button key={String(item.value)} type="button" onClick={() => setSameSetup(item.value)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 21,
                color: C.ink, background: sameSetup === item.value ? 'rgba(39,68,110,.10)' : '#fff',
                border: `2px solid ${sameSetup === item.value ? C.blue : C.line}`,
              }}>{item.label}</button>
          ))}
        </div>

        <div style={{ padding: '14px 22px', background: '#fff', border: `2px solid ${C.green}`, borderRadius: 16 }}>
          <div style={{ fontSize: 20, color: C.muted }}>配方</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.green }}>{target.recipe}</div>
          <div style={{ fontSize: 21, color: C.ink, marginTop: 2 }}>先做一批生成任务并更新共享参数，再用理解数据微调。</div>
        </div>

        <div style={{ padding: '14px 20px', background: sameSetup ? 'rgba(34,141,92,.06)' : 'rgba(196,63,82,.06)', border: `2px solid ${sameSetup ? C.green : C.red}`, borderRadius: 16, fontSize: 21, lineHeight: 1.5, color: C.ink }}>
          {sameSetup
            ? '可以照抄：这些增益正是在 BAGEL-7B-MoT、50k I2I + 50k I2T、4 GPU、三次种子的设置下测得的。'
            : '需要重验：换底座或改训练预算等于换了变量，论文的 Δ 不能直接搬过去，只能当作候选任务清单。'}
        </div>

        <div style={{ padding: '18px 24px', background: '#fff', border: `2px solid ${C.line}`, borderRadius: 16, flex: 1 }}>
          <div style={{ fontSize: 22, color: C.muted, marginBottom: 8 }}>按论文报告的显著增益挑源任务</div>
          {target.sources.map((item, index) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 14, background: 'rgba(34,141,92,.14)', color: C.green,
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>{index + 1}</span>
              <span style={{ fontSize: 25, color: C.ink }}>{item}</span>
            </div>
          ))}
          <div style={{ fontSize: 21, color: C.ink, lineHeight: 1.45, marginTop: 8 }}>{target.why}</div>
        </div>
      </div>
    </div>
  );
}
