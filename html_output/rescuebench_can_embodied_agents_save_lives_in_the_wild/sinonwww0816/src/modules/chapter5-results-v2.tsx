import { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const methodFamilies = [
  { family: '模块化方法', methods: 'LLM-YOLO', note: '检测与高层规划分阶段协作。', mark: '拼' },
  { family: '视频 VLA', methods: 'Uni-NaVid', note: '根据视频上下文预测动作。', mark: '影' },
  { family: 'VLN 基础模型', methods: 'ViNT / NoMaD', note: '从导航数据中学习视觉运动策略。', mark: '航' },
  { family: '地图方法', methods: 'SG-Nav / OmniNav', note: '借助显式空间表示进行规划。', mark: '图' },
  { family: '视觉运动策略', methods: 'ROCKET-2', note: '通过跨视角目标对齐引导运动。', mark: '动' },
  { family: '参照', methods: 'Human / Oracle', note: '给出人类表现与可行上界。', mark: '参' },
] as const;

export function MethodFamiliesV2(_: WidgetProps) {
  const [active, setActive] = useState(0);
  const selected = methodFamilies[active];
  return (
    <div className="method-families-v2">
      <div className="method-family-grid" role="group" aria-label="选择被测方法家族">
        {methodFamilies.map((item, index) => (
          <button type="button" key={item.family} className={active === index ? 'selected' : ''} onClick={() => setActive(index)}>
            <span>{item.mark}</span><strong>{item.family}</strong><small>{item.methods}</small>
          </button>
        ))}
      </div>
      <div className="family-detail" aria-live="polite"><span>{selected.family}</span><strong>{selected.methods}</strong><p>{selected.note}</p></div>
      <p className="result-source">来源：论文 Figure 5 / Table 3</p>
    </div>
  );
}

type CurveMethod = {
  id: string;
  label: string;
  group: 'learned' | 'human' | 'oracle';
  values: readonly number[];
  color: string;
};

const curveMethods: readonly CurveMethod[] = [
  { id: 'llm-yolo', label: 'LLM-YOLO', group: 'learned', values: [72.2, 12.1, 5.7, 6.0, 6.2], color: '#27446e' },
  { id: 'uni-navid', label: 'Uni-NaVid', group: 'learned', values: [67.4, 21.9, 14.2, 12.9, 12.2], color: '#6f53a8' },
  { id: 'vint', label: 'ViNT', group: 'learned', values: [14.2, 8.2, 4.7, 4.3, 1.8], color: '#8b6c49' },
  { id: 'nomad', label: 'NoMaD', group: 'learned', values: [10.0, 6.4, 3.9, 7.0, 5.8], color: '#6b7f62' },
  { id: 'sg-nav', label: 'SG-Nav', group: 'learned', values: [62.3, 14.1, 8.4, 10.0, 2.0], color: '#b45f4f' },
  { id: 'omninav', label: 'OmniNav', group: 'learned', values: [15.6, 11.0, 4.5, 6.8, 3.3], color: '#5f7f93' },
  { id: 'rocket-2', label: 'ROCKET-2', group: 'learned', values: [59.0, 57.2, 42.6, 32.2, 8.2], color: '#d97706' },
  { id: 'human', label: 'Human', group: 'human', values: [100, 100, 100, 100, 95.2], color: '#228d5c' },
  { id: 'oracle', label: 'Oracle', group: 'oracle', values: [100, 100, 100, 100, 100], color: '#c43f52' },
];

const levelNotes = [
  { title: 'L1 · 部分方法仍有较高进展', text: '简单场景下，多种方法仍能取得可见的任务进展。' },
  { title: 'L2 · 第一个明显能力断崖', text: '仅增加视觉复杂性，整体任务进展就明显下滑。' },
  { title: 'L3 · 主动搜索后继续退化', text: '任务不再只是看到目标再接近，各方法继续下降。' },
  { title: 'L4 · 进入低性能区', text: '跨区域与环境结构进一步压低整体任务进展。' },
  { title: 'L5 · 完整完成率归零', text: '论文评测的所有学习型基线，完整任务完成率均为 0。' },
] as const;

const chartX = (index: number) => 72 + index * 144;
const chartY = (value: number) => 342 - value * 2.9;

export function TsDifficultyCurveV2(_: WidgetProps) {
  const [selectedMethod, setSelectedMethod] = useState('llm-yolo');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [group, setGroup] = useState<'all' | CurveMethod['group']>('all');
  const selected = curveMethods.find((method) => method.id === selectedMethod) ?? curveMethods[0];
  const visibleMethods = group === 'all' ? curveMethods : curveMethods.filter((method) => method.group === group);
  const selectedVisible = visibleMethods.some((method) => method.id === selectedMethod);
  const emphasisId = selectedVisible ? selectedMethod : visibleMethods[0]?.id;

  return (
    <div className="ts-curve-v2">
      <div className="curve-filter-row">
        <div className="curve-group-tabs" role="group" aria-label="筛选方法类别">
          {([['all', '全部'], ['learned', '学习型基线'], ['human', '人类'], ['oracle', 'Oracle']] as const).map(([id, label]) => <button type="button" key={id} className={group === id ? 'selected' : ''} onClick={() => { setGroup(id); if (id !== 'all') { const first = curveMethods.find((method) => method.group === id); if (first) setSelectedMethod(first.id); } }}>{label}</button>)}
        </div>
        <span>纵轴：任务分数（TS）</span>
      </div>
      <div className="curve-methods" role="group" aria-label="选择高亮方法">
        {curveMethods.map((method) => <button type="button" key={method.id} className={selectedMethod === method.id ? 'selected' : ''} style={{ '--method-color': method.color } as React.CSSProperties} onClick={() => { setSelectedMethod(method.id); setGroup('all'); }}>{method.label}</button>)}
      </div>
      <div className="curve-level-tabs" role="group" aria-label="选择难度等级">
        {[0, 1, 2, 3, 4].map((index) => <button type="button" key={index} className={selectedLevel === index ? 'selected' : ''} onClick={() => setSelectedLevel(index)}>L{index + 1}</button>)}
      </div>
      <div className="curve-main-layout">
        <svg className="ts-line-chart" viewBox="0 0 720 390" role="img" aria-label={`TS 随 L1 到 L5 的变化，当前高亮 L${selectedLevel + 1}`}>
          <rect className="chart-field" x="42" y="28" width="640" height="324" rx="12" />
          {[0, 25, 50, 75, 100].map((tick) => <g key={tick}><line x1="62" x2="670" y1={chartY(tick)} y2={chartY(tick)} /><text x="52" y={chartY(tick) + 5} textAnchor="end">{tick}</text></g>)}
          <rect className="selected-level-band" x={chartX(selectedLevel) - 31} y="40" width="62" height="304" rx="9" />
          {visibleMethods.map((method) => {
            const points = method.values.map((value, index) => `${chartX(index)},${chartY(value)}`).join(' ');
            const emphasized = method.id === emphasisId;
            return <g key={method.id} className={emphasized ? 'curve-series emphasized' : 'curve-series'} style={{ '--curve-color': method.color } as React.CSSProperties}>
              <polyline points={points} />
              {method.values.map((value, index) => <circle key={index} cx={chartX(index)} cy={chartY(value)} r={index === selectedLevel ? (emphasized ? 7 : 4) : (emphasized ? 4 : 2.5)} />)}
            </g>;
          })}
          {[0, 1, 2, 3, 4].map((index) => <text key={index} className="level-label" x={chartX(index)} y="374" textAnchor="middle">L{index + 1}</text>)}
        </svg>
        <aside className="curve-reading" aria-live="polite">
          <span>当前难度</span><strong>{levelNotes[selectedLevel].title}</strong><p>{levelNotes[selectedLevel].text}</p>
          <div><small>{selected.label}</small><b>{selected.values[selectedLevel].toFixed(1)} TS</b></div>
          {selectedLevel === 1 && selectedMethod === 'llm-yolo' ? <em>L1 72.2 → L2 12.1</em> : null}
          {selectedLevel === 2 && selectedMethod === 'rocket-2' ? <em>zero-shot L3：42.6</em> : null}
        </aside>
      </div>
      <div className="curve-fact-strip"><span>实验断崖：L1 → L2</span><span>任务转折：L2 → L3 主动搜索</span><span>适配后参考：ROCKET-2 (ft) L3 = 52.0</span></div>
      <p className="result-source">来源：论文 Figure 5 / Table 3</p>
    </div>
  );
}

const l5Groups = [
  { id: 'learned', label: '学习型基线', tcr: '0%', ts: '1.8–12.2', note: '7 个 zero-shot 学习型基线均未完整完成 L5；TS 仍保留少量差异。', tone: 'bad' },
  { id: 'human', label: '人类玩家', tcr: '93.5%', ts: '95.2', note: '人类玩家仍能高比例完成完整救援。', tone: 'good' },
  { id: 'oracle', label: 'Oracle 导航器', tcr: '100%', ts: '100', note: 'Oracle 给出该评测设置下的可行上界。', tone: 'best' },
] as const;

const l5LearnedSummary = [
  ['LLM-YOLO', '6.2'], ['Uni-NaVid', '12.2'], ['ViNT', '1.8'], ['NoMaD', '5.8'],
  ['SG-Nav', '2.0'], ['OmniNav', '3.3'], ['ROCKET-2', '8.2'],
] as const;

export function L5CapabilityGapV2(_: WidgetProps) {
  const [active, setActive] = useState(0);
  const current = l5Groups[active];
  return <div className="l5-gap-v2">
    <div className="l5-gap-tabs" role="group" aria-label="切换 L5 对比对象">{l5Groups.map((item, index) => <button type="button" key={item.id} className={active === index ? 'selected' : ''} onClick={() => setActive(index)}>{item.label}</button>)}</div>
    <div className={`l5-scoreboard ${current.tone}`} aria-live="polite">
      <header><span>L5</span><strong>{current.label}</strong></header>
      <div><section><span>完整任务完成率（TCR）</span><strong>{current.tcr}</strong></section><section><span>任务分数（TS）</span><strong>{current.ts}</strong></section></div>
      <p>{current.note}</p>
    </div>
    {current.id === 'learned' ? <div className="l5-learned-ts" aria-label="L5 学习型基线任务分数">
      {l5LearnedSummary.map(([label, score]) => <span key={label}><b>{label}</b><strong>{score}</strong></span>)}
    </div> : null}
    <div className="l5-scale" aria-hidden="true"><i className="learned" style={{ width: '0%' }} /><i className="human" style={{ width: '93.5%' }} /><i className="oracle" style={{ width: '100%' }} /></div>
    <p className="l5-gap-judgment">困难任务并不是“不可完成”，而是现有学习型智能体与可行上界之间仍存在巨大能力缺口。</p>
    <p className="result-source">来源：论文 Table 3</p>
  </div>;
}

const l5Learned = [
  { id: 'llm', label: 'LLM-YOLO', ts: 6.2 },
  { id: 'uni', label: 'Uni-NaVid', ts: 12.2 },
  { id: 'vint', label: 'ViNT', ts: 1.8 },
  { id: 'nomad', label: 'NoMaD', ts: 5.8 },
  { id: 'sg', label: 'SG-Nav', ts: 2.0 },
  { id: 'omni', label: 'OmniNav', ts: 3.3 },
  { id: 'rocket', label: 'ROCKET-2', ts: 8.2 },
  { id: 'rocket-ft', label: 'ROCKET-2 (ft)', ts: 4.5 },
] as const;

export function SameTcrDifferentTsV2(_: WidgetProps) {
  const [active, setActive] = useState(6);
  const current = l5Learned[active];
  return <div className="same-tcr-v2">
    <div className="same-tcr-head"><span>固定难度</span><strong>L5</strong><b>完整任务完成率：0%</b></div>
    <div className="same-tcr-methods" role="group" aria-label="切换 L5 学习型方法">{l5Learned.map((item, index) => <button type="button" key={item.id} className={active === index ? 'selected' : ''} onClick={() => setActive(index)}>{item.label}</button>)}</div>
    <div className="ts-gauge" aria-live="polite"><header><span>{current.label}</span><strong>TS {current.ts.toFixed(1)}</strong></header><div><i style={{ width: `${current.ts}%` }} /></div><footer><span>0</span><span>部分进展</span><span>100</span></footer></div>
    <p className="l5-gap-judgment">完整任务都失败了，但不同方法推进到的程度仍然不同。可是 TS 仍没有告诉我们，它究竟卡在哪一步。</p>
    <p className="result-source">来源：论文 Table 3</p>
  </div>;
}

const behaviorCards = [
  { title: '地图方法', summary: '时间消耗更高，容易耗尽预算。', detail: '较少的推理步数，也可能对应较长的端到端耗时。', icon: '图' },
  { title: 'VLN 类方法', summary: '移动很多，但不一定形成有效搜索。', detail: '动作数量并不能直接等价为有效的环境覆盖。', icon: '路' },
  { title: 'VLA / 视觉运动策略', summary: '更可能形成相对有效的探索行为。', detail: '总体行为表现与另外两类方法不同，但机制留待下一章分析。', icon: '探' },
] as const;

export function BehaviorPreviewV2(_: WidgetProps) {
  const [active, setActive] = useState(0);
  const current = useMemo(() => behaviorCards[active], [active]);
  return <div className="behavior-preview-v2">
    <div className="behavior-card-grid" role="group" aria-label="切换整体行为摘要">{behaviorCards.map((item, index) => <button type="button" key={item.title} className={active === index ? 'selected' : ''} onClick={() => setActive(index)}><span>{item.icon}</span><strong>{item.title}</strong><p>{item.summary}</p></button>)}</div>
    <div className="behavior-detail" aria-live="polite"><span>{current.title}</span><strong>{current.summary}</strong><p>{current.detail}</p></div>
    <p className="result-source">来源：论文 Figure 5 / Section 3.3</p>
  </div>;
}
