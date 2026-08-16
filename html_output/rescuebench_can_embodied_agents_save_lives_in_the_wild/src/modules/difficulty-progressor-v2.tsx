import { useState } from 'react';
import type { WidgetProps } from './registry';
import { difficultyLevels } from './difficulty-v2-data';
import { assetPath } from '../lib/assetPath';

export function DifficultyProgressorV2(_: WidgetProps) {
  const [level, setLevel] = useState(0);
  const current = difficultyLevels[level];
  return <div className="difficulty-progressor-v2">
    <div className="difficulty-slider-head"><span>L1</span><input aria-label="选择 L1 到 L5 难度" type="range" min="0" max="4" step="1" value={level} onChange={event=>setLevel(Number(event.target.value))}/><span>L5</span></div>
    <div className="difficulty-level-controls compact" role="group" aria-label="五档难度推进器">
      {difficultyLevels.map((item,index)=><button type="button" key={item.code} className={level===index?'selected':''} onClick={()=>setLevel(index)}><span>{item.code}</span>{item.title}</button>)}
    </div>
    <div className="difficulty-figure-detail">
      <figure><img src={assetPath(current.image)} alt={`${current.code} ${current.title} 场景`}/><figcaption>来源：论文 Figure 3</figcaption></figure>
      <div className="difficulty-state-list" aria-live="polite">
        <header><span>{current.code}</span><strong>{current.title}</strong><small>{current.short}</small></header>
        <dl><div><dt>环境</dt><dd>{current.environment}</dd></div><div><dt>任务要求</dt><dd>{current.task}</dd></div><div><dt>线索推理</dt><dd>{current.reasoning}</dd></div></dl>
      </div>
    </div>
  </div>;
}
