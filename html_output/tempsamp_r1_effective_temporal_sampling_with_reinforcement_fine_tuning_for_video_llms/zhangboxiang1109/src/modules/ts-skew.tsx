/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Tag, Feedback, groupStats, AdvantageBars, stopRangeNav } from './ts-shared';
export const TsSkew: React.FC<WidgetProps> = () => {
 const [external,setExternal]=useState(0.99);
 const policy=[0.45,0.55,0.65];
 const baseline=groupStats(policy), mixed=groupStats([...policy,external]);
 const flipped=mixed.advantages[2]<0;
 return <div className="ts-widget">
  <Tag kind="demo">教学示意：公式实时计算，非论文实验数据</Tag>
  <p>三个策略候选的奖励固定为 <b>0.45、0.55、0.65</b>。只改变外部样本的奖励，看看同一个候选的学习方向会怎样变化。</p>
  <label className="ts-range-label" htmlFor="ts-external-reward">外部样本的示意奖励<b>{external.toFixed(2)}</b></label>
  <input id="ts-external-reward" aria-label="真值样本示意奖励" className="ts-range" type="range" min="0.65" max="1" step="0.01" value={external} onChange={e=>setExternal(Number(e.target.value))} onKeyDown={stopRangeNav}/>
  <div className="ts-split ts-comparison">
   <section className="ts-card"><span className="ts-eyebrow">① 只比较策略候选</span><h3>0.65 是组内最好</h3><p>均值 {baseline.mean.toFixed(3)} · 标准差 {baseline.sigma.toFixed(3)}</p><AdvantageBars values={baseline.advantages}/></section>
   <section className={'ts-card '+(flipped?'ts-card-warning':'')}><span className="ts-eyebrow">② 加入外部样本后</span><h3>{flipped?'同一个候选被压到均值下':'标尺随新样本改变'}</h3><p>均值 {mixed.mean.toFixed(3)} · 标准差 {mixed.sigma.toFixed(3)}</p><AdvantageBars values={mixed.advantages}/></section>
  </div>
  <div className="ts-formula-inline">Aᵢ = (rᵢ − 组均值 μ) / 组标准差 σ</div>
  <div className="ts-note"><b>为什么符号重要？</b> 正优势鼓励提高该答案的生成概率，负优势则给出相反的更新方向。这里展示优势这一项；完整策略目标还包含约束项。条形的中线为 0，左右分别表示负、正优势。</div>
  <Feedback>{flipped?`候选 3 的奖励仍是 0.65，但优势从 +${baseline.advantages[2].toFixed(2)} 变为 ${mixed.advantages[2].toFixed(2)}。变化来自比较组，而非这个答案突然变差。`:`当前候选 3 的优势是 ${mixed.advantages[2]>=0?'+':''}${mixed.advantages[2].toFixed(2)}。继续提高外部奖励，观察它何时越过 0；这种翻转取决于具体奖励分布。`}</Feedback>
 </div>;
};
