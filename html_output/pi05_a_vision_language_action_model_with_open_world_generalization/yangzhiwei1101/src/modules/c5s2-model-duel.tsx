import { useState } from 'react';

const VIEWS = {
  duel: {
    label: '与 π0 对比',
    fig: './images/fig12.png',
    caption: '模拟住宅端到端任务得分，越高越好（p.10 Fig.12）',
    text:
      '所有模型用同一套跨具身机器人训练集、训练步数可比。π0.5 显著优于 π0，也优于补上了 FAST + 流匹配、但只有动作数据的 π0-FAST+Flow；把 π0 训到 300k 步也追不上。',
    color: '#228d5c',
  },
  lang: {
    label: '语言跟随 vs 环境数',
    fig: './images/fig9.png',
    caption: '语言跟随率与成功率随训练环境数变化，分见过/未见物体（p.9 Fig.9）',
    text:
      '环境越多，语言跟随与放置成功率都往上走；见过的物体类别涨得更快，未见类别起步低但也在涨 —— 每多一个大同小异的家，就多一批新物品与新手势。',
    color: '#27446e',
  },
} as const;

export function ModelDuel(_: { chapterId: string; moduleId: string }) {
  const [view, setView] = useState<'duel' | 'lang'>('duel');
  const v = VIEWS[view];

  return (
    <div className="pi-split">
      <div className="pi-left">
        <div className="pi-duel">
          <div className="pi-duel-side is-old">
            <span className="pi-duel-name">π0 / π0-FAST+Flow</span>
            <span className="pi-duel-sub">只有机器人动作数据</span>
            <span className="pi-duel-plate is-low" />
          </div>
          <div className="pi-duel-vs">VS</div>
          <div className="pi-duel-side is-new">
            <span className="pi-duel-name">π0.5</span>
            <span className="pi-duel-sub">加上 HL 与 WD 的协同训练</span>
            <span className="pi-duel-plate is-high" />
          </div>
        </div>
        <p className="pi-feedback" style={{ color: v.color }}>{v.text}</p>
      </div>

      <div className="pi-right">
        <div className="pi-plates">
          <button className={`pi-plate${view === 'duel' ? ' is-on' : ''}`} onClick={() => setView('duel')}>
            {VIEWS.duel.label}
          </button>
          <button className={`pi-plate${view === 'lang' ? ' is-on' : ''}`} onClick={() => setView('lang')}>
            {VIEWS.lang.label}
          </button>
        </div>
        <img className="pi-figure" src={v.fig} alt={v.caption} />
        <p className="pi-caption">{v.caption}</p>
      </div>
    </div>
  );
}
