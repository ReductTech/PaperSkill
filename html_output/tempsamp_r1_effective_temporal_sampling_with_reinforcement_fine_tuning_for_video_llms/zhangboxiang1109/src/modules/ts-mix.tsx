/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, SHAPE, groupStats, AdvantageBars } from './ts-shared';
export const TsMix: React.FC<WidgetProps> = ({moduleId}) => {
 const [inserted,setInserted]=useState(false);
 const [count,setCount]=useState<'standard'|'charades'>('standard');
 const [shaped,setShaped]=useState(false);
 const total=count==='standard'?4:8;
 if(moduleId==='5.2'){
  const raw=[0.45,0.55,0.65,1];
  const transformed=shaped?raw.map(SHAPE):raw;
  const stats=groupStats(transformed);
  return <div className="ts-widget"><Tag kind="demo">固定示意奖励；不表示模型实测提升</Tag><p>四个原始奖励始终是 <b>0.45、0.55、0.65、1.00</b>。切换的是进入标准化前的奖励处理。</p><div className="ts-toolbar"><Chip active={!shaped} onClick={()=>setShaped(false)}>直接混合</Chip><Chip active={shaped} onClick={()=>setShaped(true)}>先做非线性整形</Chip></div><div className="ts-split"><div className="ts-card"><span className="ts-eyebrow">进入组内标准化的数值</span><div className="ts-number-strip">{transformed.map((r,i)=><span key={i}><small>{i===3?'真值 GT':'候选 '+(i+1)}</small><b>{r.toFixed(3)}</b></span>)}</div><p>μ = {stats.mean.toFixed(3)} · σ = {stats.sigma.toFixed(3)}</p></div><div className="ts-card"><span className="ts-eyebrow">同组比较后的优势</span><AdvantageBars values={stats.advantages}/></div></div><Feedback>{shaped?'本示例里，候选 3 恢复正优势，真值仍保持正向指导。改变奖励差距可以改变标准化后的信号；这不保证任意组里所有候选都变为正优势。':'直接混合时，候选 3 的奖励虽高于其他策略候选，优势仍为负。先观察这个风险，再切换到奖励整形。'}</Feedback></div>;
 }
 return <div className="ts-widget"><div className="ts-toolbar"><Chip active={count==='standard'} onClick={()=>setCount('standard')}>常见配置：4 个解</Chip><Chip active={count==='charades'} onClick={()=>setCount('charades')}>Charades：8 个解</Chip></div><div className="ts-group-label">训练组：{inserted?`${total-1} 个策略候选 + 1 个真值指导`:`${total} 个策略候选`}</div><div className="ts-slots">{Array.from({length:total},(_,i)=>{const isGT=inserted&&i===total-1;return i===total-1?<button type="button" key={i} className={'ts-slot '+(isGT?'slot-gt':'slot-policy')} onClick={()=>setInserted(!inserted)} aria-label={isGT?'移除真值指导，恢复策略候选':'用真值指导替换最后一个策略候选'} aria-pressed={inserted}><b>{isGT?'GT':'π'+(i+1)}</b><span>{isGT?'点击移除':'点击替换'}</span></button>:<div key={i} className="ts-slot slot-policy"><b>π{i+1}</b><span>策略输出</span></div>;})}</div><div className="ts-note">{count==='standard'?'论文通常使用 3 个策略内候选 + 1 个外部样本。':'Charades-STA 主表每题使用 8 个解，即 7 个策略候选 + 1 个外部样本。'} 点击最后一个槽，保持总数量不变地切换样本来源。</div><div className="ts-split"><div className="ts-card"><span className="ts-eyebrow">训练时</span><p>视频、查询和真值标注可用。候选由模型生成，外部答案由标注提供；两类答案一起参与更新。</p></div><div className="ts-card"><span className="ts-eyebrow">推理时</span><p>输入只有视频和查询。模型自己预测起止时刻，不会获得待预测事件的真值答案。</p></div></div><Feedback>{inserted?'增加的是一条准确的训练示范，不是测试时的答案提示。它保留策略探索，但也会改变组内均值与标准差。':'这里的 sampling 指采样模型生成的答案区间，不是选择输入视频帧。论文另用 2 FPS 做视频预处理。'}</Feedback></div>;
};
