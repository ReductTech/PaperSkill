import { useState } from 'react';
import type { WidgetProps } from './registry';
import { difficultyLevels } from './difficulty-v2-data';

export function DifficultyRecipeV2(_: WidgetProps) {
  const [index,setIndex]=useState(0); const current=difficultyLevels[index];
  const heightTone=current.height==='无'?'none':current.height==='可能'?'maybe':'required';
  return <div className="difficulty-recipe-v2">
    <div className="difficulty-level-controls compact" role="group" aria-label="选择难度配方">{difficultyLevels.map((item,i)=><button type="button" key={item.code} className={index===i?'selected':''} onClick={()=>setIndex(i)}><span>{item.code}</span>{item.title}</button>)}</div>
    <div className="recipe-card" aria-live="polite">
      <header><span>{current.code}</span><strong>{current.title}</strong><small>任务特征：{current.task}</small></header>
      <section className="distance-recipe"><div><span>距离范围</span><strong>{current.distance}</strong></div><div className="distance-scale"><i style={{width:`${current.maxDistance/80*100}%`}}/><b>{current.maxDistance} m</b></div></section>
      <div className="recipe-status-grid">
        <section><span>高度变化</span><strong className={heightTone}>{current.height}</strong><small>{current.height==='无'?'该级别不出现显著高度变化':current.height==='可能'?'可能出现，但不是必需条件':'必须出现显著高度变化'}</small></section>
        <section><span>环境交互</span><strong className={current.interaction==='有'?'required':'none'}>{current.interaction}</strong><small>{current.interaction==='有'?'加入门、闸等可导航环境交互条件':'该级别不引入此类环境交互条件'}</small></section>
      </div>
    </div>
    <div className="table7-strip"><span>高度变化：L1 无 · L2 无 · L3 可能 · L4 可能 · L5 必须</span><span>环境交互：L1–L3 无 · L4–L5 有</span></div>
    <p className="table7-source">来源：论文 Table 7</p>
  </div>;
}
