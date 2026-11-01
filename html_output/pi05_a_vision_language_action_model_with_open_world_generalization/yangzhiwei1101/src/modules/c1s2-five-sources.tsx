import { useState } from 'react';

type Source = {
  id: string;
  name: string;
  short: string;
  detail: string;
  high: boolean;
  low: boolean;
  locator: string;
  note: string;
};

const SOURCES: Source[] = [
  {
    id: 'mm',
    name: 'MM · 移动机械臂数据',
    short: '约 400 小时，约 100 个家庭',
    detail: '和目标平台、目标任务最直接相关的一小部分数据。',
    high: true,
    low: true,
    locator: 'p.6 §IV-C',
    note: '第二阶段只保留成功、长度低于阈值的片段。',
  },
  {
    id: 'me',
    name: 'ME · 多环境非移动机器人',
    short: '固定臂，跑过更多家庭',
    detail: '更轻、更好搬，所以能在更多不同家里采数据；但身体和目标平台不同。',
    high: false,
    low: true,
    locator: 'p.6 §IV-C',
    note: '消融显示去掉 ME 会显著掉分。',
  },
  {
    id: 'ce',
    name: 'CE · 实验室跨具身数据',
    short: '桌面上、多种机器人、任务杂',
    detail: '有和目标任务高度相关的（把餐具收进筐），也有一点关系也没有的（磨咖啡豆）。',
    high: false,
    low: true,
    locator: 'p.6 §IV-C',
    note: '含开源 OXE 数据集。',
  },
  {
    id: 'hl',
    name: 'HL · 高层子任务标注',
    short: '把"收拾卧室"拆成"拿起枕头"',
    detail: '人工标注每一步的语义描述，并先预测框、再预测子任务。',
    high: true,
    low: true,
    locator: 'p.6 §IV-C',
    note: '同时训练高层（出子任务）与低层（按子任务出动作）。',
  },
  {
    id: 'wd',
    name: 'WD · 网络多模态数据',
    short: '图像描述 / 视觉问答 / 物体定位',
    detail: '给模型关于物体与场景的广博语义知识，主要供养高层。',
    high: true,
    low: false,
    locator: 'p.6–7 §IV-C',
    note: '端到端家务任务上差异不显著，但显著影响分布外物体的语言跟随。',
  },
  {
    id: 'vi',
    name: 'VI · 口头指令示范',
    short: '专家用语言一步步指挥',
    detail: '专家实时"用语言遥操作"，给出合适的子任务命令，相当于高层示范。',
    high: true,
    low: false,
    locator: 'p.7 §IV-D',
    note: '只在后训练引入，约占高层移动机械臂样本的 11%，却对最终表现很关键。',
  },
];

export function FiveSources(_: { chapterId: string; moduleId: string }) {
  const [sel, setSel] = useState<string>('mm');
  const active = SOURCES.find((s) => s.id === sel)!;

  return (
    <div className="pi-split">
      <div className="pi-left">
        <p className="pi-lead">
          第一阶段训练样本里 <strong style={{ color: 'var(--orange)' }}>97.6%</strong> 不来自移动机械臂。
          点一张卡片，看这段经历供养哪一层。
        </p>
        <div className="pi-grid6">
          {SOURCES.map((s) => {
            const on = s.id === sel;
            return (
              <button
                key={s.id}
                className={`pi-card${on ? ' is-sel' : ''}`}
                onClick={() => setSel(s.id)}
                aria-pressed={on}
              >
                <span className="pi-card-title">{s.name}</span>
                <span className="pi-card-short">{s.short}</span>
                <span className="pi-tags">
                  <span className={`pi-tag${s.high ? ' is-high' : ''}`}>高层</span>
                  <span className={`pi-tag${s.low ? ' is-low' : ''}`}>低层</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="pi-right">
        <p className="pi-heading-sm">{active.name}</p>
        <p className="pi-body">{active.detail}</p>
        <p className="pi-body pi-muted">{active.note}</p>
        <p className="pi-locator">{active.locator}</p>
        <div className="pi-mini">
          <svg viewBox="0 0 260 96" width="260" height="96" aria-hidden>
            <rect x="6" y="60" width="248" height="10" fill="#d8c7ad" />
            <circle cx="46" cy="34" r="14" fill="#fdf6e6" stroke="#27446e" strokeWidth="2" />
            <rect x="34" y="48" width="24" height="18" rx="5" fill="#e8eef7" stroke="#27446e" strokeWidth="2" />
            <circle cx="150" cy="30" r="12" fill="#f6e3cf" stroke="#27446e" strokeWidth="2" />
            <rect x="140" y="44" width="20" height="16" rx="4" fill="#f6e3cf" stroke="#27446e" strokeWidth="2" />
            <path d="M120 22 L138 22" stroke="#27446e" strokeWidth="2" />
          </svg>
          <span className="pi-body pi-muted">学徒的手在低层，师傅的嘴在高层。</span>
        </div>
      </div>
    </div>
  );
}
