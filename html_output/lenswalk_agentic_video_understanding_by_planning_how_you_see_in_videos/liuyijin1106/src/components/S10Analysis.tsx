import { useState } from 'react';
import { LearningModule } from './LearningModule';
import './s10-analysis.css';

// Paper Table 4, Video-MME Long, LensWalk (o3/GPT-4.1).
// The first three rows also omit both coherence modules; they are not isolated single-tool effects.
const components = ['Scan Search', 'Segment Focus', 'Stitched Verify', 'Timestamp Anchor', 'Subject Memory'] as const;
const ablations = [
  { label: '无 Scan Search', value: 65.4, present: [false, true, true, false, false] },
  { label: '无 Segment Focus', value: 68.1, present: [true, false, true, false, false] },
  { label: '无 Stitched Verify', value: 66.8, present: [true, true, false, false, false] },
  { label: '无 Timestamp Anchor', value: 69.4, present: [true, true, true, false, true] },
  { label: '无 Subject Memory', value: 69.7, present: [true, true, true, true, false] }
] as const;

const strategies = [
  { code: 'DI', name: 'Direct Inquiry', zh: '直接询问', text: '一次有目标的观察后回答。', path: ['问题', '定位观察', '回答'], kind: 'direct' },
  { code: 'PZ', name: 'Progressive Zoom-in', zh: '逐步聚焦', text: '先宽范围搜索，再细看候选片段。', path: ['全片搜索', '候选区间', '局部细看'], kind: 'zoom' },
  { code: 'SP', name: 'Scope Partitioning', zh: '范围分区', text: '把时间范围分段观察，再整合判断。', path: ['前段', '中段', '后段', '整合'], kind: 'partition' },
  { code: 'SR', name: 'Strategic Reflection', zh: '策略反思', text: '原路径遇阻，回退并改看别处。', path: ['局部尝试', '遇阻', '重新规划', '新区域'], kind: 'reflection' },
  { code: 'IV', name: 'Integrative Verify', zh: '联合核验', text: '把相隔的关键时刻放在一起核查。', path: ['片段 A', '片段 B', '联合核验'], kind: 'verify' },
  { code: 'RP', name: 'Static Repetition', zh: '静态重复', text: '同一区域反复观察却没有有效进展。', path: ['同一区域', '再次观察', '仍未推进'], kind: 'repeat' }
] as const;

// Percentages transcribed from the labels in the paper's Figure 4 (one decimal place).
const recipes = [
  { label: 'GPT-5 / GPT-5', ratio: { DI: 49.2, PZ: 24.3, SP: 2.1, SR: 5.2, IV: 19.1, RP: null } },
  { label: 'o3 / GPT-4.1', ratio: { DI: 24.7, PZ: 40.3, SP: 7.3, SR: 21.7, IV: 3.6, RP: 2.4 } },
  { label: 'o3 / o3', ratio: { DI: 31.4, PZ: 36.9, SP: 7.9, SR: 19.9, IV: 2.6, RP: 1.3 } },
  { label: 'o3 / Qwen2.5-VL-72B', ratio: { DI: 15.7, PZ: 39.1, SP: 5.6, SR: 31.1, IV: 1.8, RP: 6.8 } }
] as const;

function Ablation() {
  const [selected, setSelected] = useState(0);
  const row = ablations[selected];
  return <LearningModule number="10.1" title="消融实验：哪些机制真正发挥作用？">
    <div className="s10-label">LensWalk (o3/GPT-4.1) · Video-MME Long · Accuracy (%) · Table 4</div>
    <div className="s10-options" role="group" aria-label="选择论文报告的消融配置">{ablations.map((item, i) => <button type="button" key={item.label} aria-pressed={i === selected} onClick={() => setSelected(i)}>{item.label}</button>)}</div>
    <div className="s10-ablation-layout">
      <div className="s10-bars" role="img" aria-label={`完整配置 70.0%；${row.label} ${row.value.toFixed(1)}%；相差 ${(70-row.value).toFixed(1)} 个百分点`}>
        <div className="s10-axis"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div>
        <div className="s10-bar-row"><span>完整配置</span><div className="s10-bar-track"><i className="s10-bar s10-bar-full" style={{ width:'70%' }}/></div><b>70.0%</b></div>
        <div className="s10-bar-row"><span>所选配置</span><div className="s10-bar-track"><i className="s10-bar s10-bar-variant" style={{ width:`${row.value}%` }}/></div><b>{row.value.toFixed(1)}%</b></div>
        <div className="s10-delta">相对完整配置 <strong>−{(70-row.value).toFixed(1)} 个百分点</strong></div>
      </div>
      <div className="s10-components" aria-label="所选配置的组件状态">{components.map((name, i) => <span key={name} className={row.present[i] ? '' : 's10-absent'}><b aria-hidden="true">{row.present[i] ? '✓' : '—'}</b>{name}</span>)}</div>
    </div>
  </LearningModule>;
}

function Strategy() {
  const [recipeIndex, setRecipeIndex] = useState(1);
  const [strategyIndex, setStrategyIndex] = useState(0);
  const recipe = recipes[recipeIndex];
  const selected = strategies[strategyIndex];
  const leading = strategies.reduce((best, item) => (recipe.ratio[item.code] ?? 0) > (recipe.ratio[best.code] ?? 0) ? item : best, strategies[0]);
  return <LearningModule number="10.2" title="观察策略：智能体如何决定下一步？">
    <div className="s10-strategy-head"><label>Reasoner / Observer <select value={recipeIndex} onChange={e => setRecipeIndex(Number(e.target.value))}>{recipes.map((item, i) => <option key={item.label} value={i}>{item.label}</option>)}</select></label><span><a href="./paper/figure-4.png" target="_blank" rel="noreferrer">Figure 4</a> · 当前占比最高：<strong>{leading.zh}</strong></span></div>
    <div className="s10-strategy-grid"><div className="s10-strategy-chart" aria-label={`${recipe.label} 的策略比例`}>{strategies.map((item, i) => <button type="button" key={item.code} className={i === strategyIndex ? 's10-current' : ''} aria-pressed={i === strategyIndex} onClick={() => setStrategyIndex(i)}><span>{item.zh}</span><span className="s10-ratio-track"><i className={`s10-ratio-fill s10-${item.kind}`} style={{ width:`${(recipe.ratio[item.code] ?? 0) * 2}%` }}/></span><b>{recipe.ratio[item.code] == null ? '—' : `${Number(recipe.ratio[item.code]).toFixed(1)}%`}</b></button>)}<div className="s10-ratio-axis"><span>0</span><span>25%</span><span>50%</span></div></div>
      <div className="s10-strategy-demo" key={selected.code}><div className="s10-demo-name"><strong>{selected.zh}</strong><small>{selected.name}</small></div><div className={`s10-timeline s10-timeline-${selected.kind}`}>{selected.path.map((step, i) => <span key={`${step}-${i}`} style={{ animationDelay:`${i * .25}s` }}>{step}</span>)}</div><p>{selected.text}</p></div></div>
    <p className="s10-note">策略多样性并不保证有效；Static Repetition 是低效循环，观察质量与规划质量会共同影响结果。</p>
  </LearningModule>;
}

function Efficiency() {
  const [metric, setMetric] = useState<'total'|'peak'>('total');
  return <LearningModule number="10.3" title="效率与边界：主动观察值得付出多少代价？">
    <div className="s10-options s10-metric" role="group" aria-label="选择 Token 指标"><button type="button" aria-pressed={metric === 'total'} onClick={() => setMetric('total')}>总 Token</button><button type="button" aria-pressed={metric === 'peak'} onClick={() => setMetric('peak')}>单轮峰值 Token</button></div>
    <div className="s10-efficiency-layout"><div className="s10-figure"><img src="./paper/figure-3.svg" alt="论文 Figure 3：多种视频理解方法的准确率、总 Token 与单轮峰值 Token 对比"/></div><div className="s10-metric-reading" aria-live="polite"><strong>{metric === 'total' ? '总 Token：多轮调用的累计消耗' : '单轮峰值 Token：最重一次调用的上下文负担'}</strong><p>{metric === 'total' ? '多次观察会累积 Token；不能从单轮上下文较小推断总消耗更低。' : '按需分段观察避免把全部帧塞进单次上下文，但整个推理仍可能调用多轮。'}</p><div className={`s10-metric-pictogram s10-${metric}`} aria-hidden="true">{[0,1,2,3].map(i => <span key={i} className={metric === 'peak' && i === 2 ? 's10-emphasized' : ''} style={{height:`${[38,65,84,48][i]}%`}}/>)}</div><small>{metric === 'total' ? 'Σ 四轮消耗累计' : 'max 取单轮最大值'} · 概念示意；实验值见原论文图</small></div></div>
    <div className="s10-cost"><div><strong>准确率</strong><span>57.1% → 68.6%</span></div><div><strong>在线推理时间</strong><span>38.9s → 190.35s</span></div><div><strong>平均帧数</strong><span>256 → 290.3</span></div></div>
    <p className="s10-note">Observer 识别或主体记忆更新出错会带偏后续规划；规划不佳可走向 10.2 的重复观察。更多观察也可能稀释已有证据，并不保证答对。</p>
  </LearningModule>;
}

export function S10Analysis() { return <div className="s10-analysis"><Ablation/><Strategy/><Efficiency/></div>; }
