import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Gate = {
  id: 'E' | 'K' | 'H' | 'A' | 'T' | 'AD';
  label: string;
  img: string;
  explain: string;
  miss: string;
};

const GATES: Gate[] = [
  {
    id: 'E',
    label: '效率',
    img: '/images/dim-e.png',
    explain: '成本高不高：算力与查询若太贵，实验室能打、现实用不起。',
    miss: '缺 E：实验室打得开，现实成本不可承受',
  },
  {
    id: 'K',
    label: '访问',
    img: '/images/dim-k.png',
    explain: '要不要搞清锁的内部：理想是黑盒——只摸外壳反馈，不拆机看参数。',
    miss: '缺 K：只能测开源白盒，闭源部署风险未知',
  },
  {
    id: 'H',
    label: '有害',
    img: '/images/dim-h.png',
    explain: '能不能打开：不只“门缝动了”，而要真正打开且危害够重。',
    miss: '缺 H：可能只是“门缝动了”，危险被夸大或低估',
  },
  {
    id: 'A',
    label: '适用',
    img: '/images/dim-a.png',
    explain: '好不好用：少人工改提示、少工程适配、少对目标狂查。',
    miss: '缺 A：每次换防御都要重做工程/人工',
  },
  {
    id: 'T',
    label: '迁移',
    img: '/images/dim-t.png',
    explain: '换柜能不能用：跨模型、跨行为仍有效，才谈得上摊销。',
    miss: '缺 T：每个模型、每个行为都要重来',
  },
  {
    id: 'AD',
    label: '自适应',
    img: '/images/dim-ad.png',
    explain: '会不会根据手感改手法：用目标反馈自动调整，应对新防御与流水线。',
    miss: '缺 AD：复杂流水线/新防御面前手法僵死',
  },
];

export const Ch1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [miss, setMiss] = useState(1); // default K
  const g = GATES[miss];

  return (
    <div>
      <div
        id={`cv-${chapterId}-${moduleId}`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 280px) 1fr',
          gap: 16,
          alignItems: 'stretch',
          background: '#f5f8f0',
          border: '1px solid #d7deea',
          borderRadius: 10,
          padding: 12,
          minHeight: 240,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #d7deea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 8,
          }}
        >
          <img
            src={g.img}
            alt={`${g.id} ${g.label}`}
            style={{ width: '100%', height: 'auto', maxHeight: 220, objectFit: 'contain', display: 'block' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, padding: '4px 4px' }}>
          <div style={{ fontWeight: 700, color: '#27446e', fontSize: 16 }}>
            缺 [{g.id}] · {g.label}
          </div>
          <div style={{ color: '#21324a', fontSize: 14, lineHeight: 1.55 }}>{g.explain}</div>
        </div>
      </div>

      <div className="ctrl" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {GATES.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMiss(i)}
            style={{ fontWeight: miss === i ? 700 : 400 }}
          >
            缺[{item.id}]
          </button>
        ))}
      </div>
      <div className="feedback bad">{g.miss}</div>
    </div>
  );
};

export default Ch1Mod2;
