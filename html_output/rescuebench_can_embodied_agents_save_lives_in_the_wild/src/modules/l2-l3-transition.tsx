import { useState } from 'react';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

type Focus = 'l2' | 'l3';
export function L2L3Transition(_: WidgetProps) {
  const [focus,setFocus]=useState<Focus>('l2');
  const isL3=focus==='l3';
  return <div className="l2l3-transition">
    <div className="difficulty-level-controls transition-tabs" role="group" aria-label="切换 L2 与 L3">
      <button type="button" className={!isL3?'selected':''} onClick={()=>setFocus('l2')}><span>L2</span>发现目标</button>
      <button type="button" className={isL3?'selected':''} onClick={()=>setFocus('l3')}><span>L3</span>主动搜索</button>
    </div>
    <div className="transition-stage" aria-live="polite">
      <figure><img src={assetPath(isL3?'/images/rescuebench-figure-3-l3.png':'/images/rescuebench-figure-3-l2.png')} alt={isL3?'L3 主动搜索场景':'L2 视觉干扰场景'}/><figcaption>来源：论文 Figure 3</figcaption></figure>
      <section><span>{isL3?'L3｜目标不在眼前':'L2｜复杂背景中仍可发现目标'}</span><strong>{isL3?'我应该去哪里找？':'我能不能发现并接近目标？'}</strong>
        {isL3?<div className="search-flow"><b>判断可能区域</b><i>→</i><b>选择方向</b><i>→</i><b>探索</b><i>→</i><b>更新判断</b></div>:<div className="search-flow"><b>发现目标</b><i>→</i><b>接近目标</b></div>}
        <p>{isL3?'当前视野中没有直接可见伤员，多个区域或方向成为候选。':'目标仍处于相对近距、无遮挡条件；复杂背景主要增加视觉辨认压力。'}</p>
      </section>
    </div>
    <div className="transition-callout"><strong>L2 → L3 是任务设计上的关键转折</strong><span>从 L3 开始，首先要回答的已不是“怎么走到目标”，而是“去哪里找目标”。</span></div>
  </div>;
}
