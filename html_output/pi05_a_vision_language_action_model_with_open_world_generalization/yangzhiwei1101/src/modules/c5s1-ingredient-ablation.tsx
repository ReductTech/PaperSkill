import { useState } from 'react';

type Ab = { id: string; label: string; tag: string; text: string; removed: string[] };

const ABS: Ab[] = [
  {
    id: 'wd',
    label: '去掉网络数据 WD',
    tag: '多模态网络数据',
    text: '端到端家务任务上差异不显著，但显著影响分布外物体的语言跟随：模型开始跟不上没见过的物体类别。',
    removed: ['wd'],
  },
  {
    id: 'me',
    label: '去掉多环境非移动数据 ME',
    tag: '别家厨房的固定臂',
    text: '去掉 ME 后表现显著下降 —— 跨环境、跨具身的经验确实在被用上。',
    removed: ['me'],
  },
  {
    id: 'ce',
    label: '去掉实验室跨具身数据 CE',
    tag: '餐馆学艺式的杂活',
    text: '去掉 CE 后表现同样显著下降；它带来的是任务层面的迁移，而不只是环境多样性。',
    removed: ['ce'],
  },
  {
    id: 'both',
    label: 'ME 与 CE 都去掉',
    tag: '只剩自家厨房 + 网络数据',
    text: '两个跨具身来源同时去掉，掉得最多 —— 只剩目标平台数据和网络数据撑不住新环境。',
    removed: ['me', 'ce'],
  },
];

const STICKERS = [
  { id: 'me', name: '邻居家帮厨', sub: 'ME' },
  { id: 'ce', name: '餐馆学艺', sub: 'CE' },
  { id: 'wd', name: '看视频菜谱', sub: 'WD' },
];

export function IngredientAblation(_: { chapterId: string; moduleId: string }) {
  const [sel, setSel] = useState('wd');
  const [metric, setMetric] = useState<'home' | 'lang'>('home');
  const ab = ABS.find((a) => a.id === sel)!;
  const fig = metric === 'home' ? './images/fig10.png' : './images/fig11.png';

  return (
    <div className="pi-split">
      <div className="pi-left">
        <div className="pi-kitchen-strip">
          <svg viewBox="0 0 660 220" width="100%" height="220" role="img" aria-label="学徒今天带了哪些经历">
            <rect width="660" height="220" fill="#f7f3ec" />
            <rect x="0" y="150" width="660" height="14" fill="#d8c7ad" />
            <rect x="0" y="150" width="660" height="4" fill="#92400e" />
            <circle cx="70" cy="104" r="26" fill="#fdf6e6" stroke="#27446e" strokeWidth="2.5" />
            <rect x="48" y="130" width="44" height="24" rx="8" fill="#e8eef7" stroke="#27446e" strokeWidth="2.5" />
            <path d="M92 138 Q140 120 176 118" stroke="#27446e" strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="180" cy="118" r="9" fill="#21324a" />
            <text x="44" y="192" fontSize="16" fill="#68778f">学徒</text>

            {STICKERS.map((s, i) => {
              const off = ab.removed.includes(s.id);
              const x = 260 + i * 140;
              return (
                <g key={s.id} opacity={off ? 0.32 : 1}>
                  <rect x={x} y="60" width="120" height="76" rx="10" fill={off ? '#eef1f5' : '#fff'} stroke={off ? '#c8d0dc' : '#f07e47'} strokeWidth="2.5" />
                  <text x={x + 60} y="90" fontSize="18" fill="#21324a" textAnchor="middle" fontWeight="700">
                    {s.name}
                  </text>
                  <text x={x + 60} y="114" fontSize="15" fill="#68778f" textAnchor="middle">
                    {s.sub}
                  </text>
                  {off && (
                    <g>
                      <line x1={x + 12} y1="66" x2={x + 108} y2="130" stroke="#c43f52" strokeWidth="3" />
                      <line x1={x + 108} y1="66" x2={x + 12} y2="130" stroke="#c43f52" strokeWidth="3" />
                    </g>
                  )}
                </g>
              );
            })}
            {ab.removed.length > 0 && (
              <text x="330" y="200" fontSize="17" fill="#c43f52">
                今天少了 {ab.removed.length} 段经历 → 到了新厨房就卡住
              </text>
            )}
          </svg>
        </div>
        <div className="pi-grid4">
          {ABS.map((a) => (
            <button
              key={a.id}
              className={`pi-card${a.id === sel ? ' is-sel' : ''}`}
              onClick={() => setSel(a.id)}
              aria-pressed={a.id === sel}
            >
              <span className="pi-card-title">{a.label}</span>
              <span className="pi-card-short">{a.tag}</span>
            </button>
          ))}
        </div>
        <p className="pi-feedback" style={{ color: sel === 'wd' ? '#27446e' : '#c43f52' }}>{ab.text}</p>
      </div>

      <div className="pi-right">
        <div className="pi-plates">
          <button className={`pi-plate${metric === 'home' ? ' is-on' : ''}`} onClick={() => setMetric('home')}>
            端到端家务任务
          </button>
          <button className={`pi-plate${metric === 'lang' ? ' is-on' : ''}`} onClick={() => setMetric('lang')}>
            语言跟随
          </button>
        </div>
        <img
          className="pi-figure"
          src={fig}
          alt={metric === 'home' ? '论文 Fig.10：模拟住宅上的训练配方消融' : '论文 Fig.11：语言跟随上的训练配方消融'}
        />
        <p className="pi-caption">
          {metric === 'home'
            ? '模拟住宅、4 个任务、每策略每任务 10 次试验，评分表得分百分比（p.10 Fig.10）'
            : '语言跟随：分见过类别与未见类别两组物体，指标越高越好（p.10 Fig.11）'}
        </p>
      </div>
    </div>
  );
}
