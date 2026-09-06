import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WidgetProps } from './registry';

type Metric = 'tcr' | 'ts';
type MethodId = 'uni' | 'vint' | 'nomad' | 'rocket';

const levels = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;

const methods = [
  { id: 'uni', label: 'Uni-NaVid', zero: { tcr: [24, 11.8, 5.1, 2.7, 0], ts: [67.4, 21.9, 14.2, 12.9, 12.2] }, tuned: { tcr: [52, 11.8, 11.9, 10.1, 0], ts: [80.9, 26.1, 18.2, 27.3, 7] } },
  { id: 'vint', label: 'ViNT', zero: { tcr: [0, 0, 0, 0, 0], ts: [14.2, 8.2, 4.7, 4.3, 1.8] }, tuned: { tcr: [8, 3.4, 1.6, 0, 0], ts: [18.2, 10.5, 8.4, 6.6, 2.8] } },
  { id: 'nomad', label: 'NoMaD', zero: { tcr: [0, 0, 0, 0, 0], ts: [10, 6.4, 3.9, 7, 5.8] }, tuned: { tcr: [8, 1.7, 0, 0, 0], ts: [25.3, 11.3, 3.2, 11.5, 1] } },
  { id: 'rocket', label: 'ROCKET-2', zero: { tcr: [16, 14.7, 10, 2.5, 0], ts: [59, 57.2, 42.6, 32.2, 8.2] }, tuned: { tcr: [32, 11.8, 15, 5.2, 0], ts: [66, 66.8, 52, 29, 4.5] } },
] as const;

const pipelineSteps = [
  { title: '可导航区域采样', short: '提取候选区域', note: '从 UE5 环境的有效 NavMesh 中提取可导航候选区域。' },
  { title: '受约束任务配置', short: '放置任务要素', note: '放置救护车、Agent 与伤员，并应用所选难度的距离、高度和交互约束。' },
  { title: '自动执行与记录', short: '执行完整救援', note: '内部 Agent 执行四阶段任务，同时记录视觉、轨迹与交互数据。' },
  { title: '难度验证与线索生成', short: '验证并保留', note: '不合格任务被拒绝并重采；L3–L5 还会从第一视角观察生成文本线索。' },
] as const;

const levelConstraints = [
  '近距离、同层、无需环境交互',
  '扩大视觉干扰，保持近距目标',
  '需要主动搜索，并生成自然语言线索',
  '跨区域搜索，可包含环境交互',
  '显著高度变化与层级空间推理',
] as const;

export function AutoDataPipelineV2(_: WidgetProps) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(3);
  const [attempt, setAttempt] = useState<'valid' | 'rejected'>('valid');
  const current = pipelineSteps[step];
  const isClueLevel = level >= 2;

  const generate = () => {
    setStep(1);
    setAttempt((value) => value === 'valid' ? 'rejected' : 'valid');
  };

  return <div className="data-pipeline-v2">
    <div className="pipeline-toolbar">
      <div className="pipeline-levels" role="group" aria-label="选择生成难度">
        {levels.map((item, index) => <button type="button" key={item} className={level === index ? 'selected' : ''} onClick={() => { setLevel(index); setStep(1); }}>{item}</button>)}
      </div>
      <button type="button" className="pipeline-generate" onClick={generate}>生成一个救援任务</button>
    </div>
    <div className="pipeline-step-tabs" role="group" aria-label="切换自动数据采集步骤">
      {pipelineSteps.map((item, index) => <button type="button" key={item.title} className={step === index ? 'selected' : ''} onClick={() => setStep(index)}><span>{index + 1}</span><strong>{item.title}</strong><small>{item.short}</small></button>)}
    </div>
    <div className="pipeline-workbench" aria-live="polite">
      <svg viewBox="0 0 640 330" role="img" aria-label={`${current.title}，当前难度 ${levels[level]}`}>
        <rect className="nav-field" x="18" y="18" width="604" height="294" rx="16" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => {
          const x = 66 + (index % 4) * 145;
          const y = 66 + Math.floor(index / 4) * 93;
          return <rect key={index} x={x} y={y} width="86" height="48" rx="10" className={step === 0 ? 'nav-zone active' : 'nav-zone'} />;
        })}
        {step >= 1 ? <>
          <circle cx="89" cy="259" r="16" className="ambulance-mark" /><text x="89" y="264" textAnchor="middle">救</text>
          <path d="M308 250 l14 24 h-28 z" className="agent-mark" /><text x="308" y="297" textAnchor="middle">Agent</text>
          <path d="M524 74 l6 13 15 2-11 10 3 15-13-7-13 7 3-15-11-10 15-2z" className="victim-mark" />
          <polyline points="308,250 376,224 428,165 487,126 524,94" className={step >= 2 ? 'expert-route active' : 'expert-route'} />
        </> : null}
        {step >= 2 ? <circle className="route-agent" cx="428" cy="165" r="10" /> : null}
      </svg>
      <aside>
        <span>步骤 {step + 1} / 4 · {levels[level]}</span><strong>{current.title}</strong><p>{current.note}</p>
        {step === 1 ? <div className={`constraint-status ${attempt}`}><b>{attempt === 'valid' ? '候选配置通过' : '难度验证失败'}</b><small>{levelConstraints[level]}</small>{attempt === 'rejected' ? <button type="button" onClick={() => setAttempt('valid')}>拒绝并重新采样</button> : null}</div> : null}
        {step === 2 ? <div className="record-grid">{['RGB', 'Depth', 'Segmentation', 'Waypoint', 'Trajectory', 'Interaction'].map((item) => <span key={item}>{item}<b>✓</b></span>)}</div> : null}
        {step === 3 ? <div className="validation-stack"><span>距离检查 ✓</span><span>高度与交互条件 ✓</span><span>难度一致性 ✓</span>{isClueLevel ? <b>第一视角观察 → Qwen-3.5 Plus → 文本线索</b> : <b>当前难度无需生成文本线索</b>}<strong>有效 Episode 已生成</strong></div> : null}
      </aside>
    </div>
    <div className="expert-scale">
      <span>完整轨迹拆成 Observation–Action 专家步骤</span><b>汇聚</b><strong>≈ 400K Expert Steps</strong>
    </div>
    <div className="adaptation-methods" aria-label="使用自动数据适配的方法">
      {methods.map((method) => <span key={method.id}>{method.label}</span>)}
    </div>
    <p className="pipeline-judgment">Difficulty 不是事后贴上的标签：它同时参与任务生成、验证与不合格样本重采。</p>
    <p className="result-source">来源：论文 Figure 4、Section 2.4、Appendix B.3</p>
  </div>;
}

const expertSteps = [
  ['o₁', 'a₁'], ['o₂', 'a₂'], ['o₃', 'a₃'], ['o₄', 'a₄'],
] as const;

export function ExpertStepsV2(_: WidgetProps) {
  const [expanded, setExpanded] = useState(false);
  return <div className="expert-steps-v2">
    <button type="button" className="episode-card" onClick={() => setExpanded((value) => !value)} aria-pressed={expanded}>
      <span>一条完整救援轨迹</span><strong>Observation → Action → …</strong><small>{expanded ? '收起专家步骤' : '拆成专家步骤'}</small>
    </button>
    <div className={`step-stream ${expanded ? 'expanded' : ''}`} aria-live="polite">
      {expertSteps.map(([observation, action], index) => <div key={observation} style={{ '--step-index': index } as CSSProperties}><span>{observation}</span><b>→</b><span>{action}</span></div>)}
    </div>
    <div className="expert-scale"><span>自动生成的有效 Episodes</span><b>汇聚</b><strong>≈ 400K Expert Steps</strong></div>
    <div className="adaptation-methods">{methods.map((method) => <span key={method.id}>{method.label}</span>)}</div>
    <p className="pipeline-judgment">论文只对这四种支持 RescueBench-specific adaptation 的方法进行微调；其他 baseline 保持 zero-shot。</p>
    <p className="result-source">来源：论文 Appendix B.3</p>
  </div>;
}

function MetricControls({ methodId, metric, level, onMethod, onMetric, onLevel }: { methodId: MethodId; metric: Metric; level: number; onMethod: (id: MethodId) => void; onMetric: (metric: Metric) => void; onLevel: (level: number) => void }) {
  return <div className="adaptation-controls">
    <div role="group" aria-label="选择适配方法">{methods.map((method) => <button type="button" key={method.id} className={methodId === method.id ? 'selected' : ''} onClick={() => onMethod(method.id)}>{method.label}</button>)}</div>
    <div role="group" aria-label="选择指标">{([['tcr', 'TCR'], ['ts', 'TS']] as const).map(([id, label]) => <button type="button" key={id} className={metric === id ? 'selected' : ''} onClick={() => onMetric(id)}>{label}</button>)}</div>
    <div role="group" aria-label="选择难度">{levels.map((item, index) => <button type="button" key={item} className={level === index ? 'selected' : ''} onClick={() => onLevel(index)}>{item}</button>)}</div>
  </div>;
}

export function FinetuneBrowserV2(_: WidgetProps) {
  const [methodId, setMethodId] = useState<MethodId>('uni');
  const [metric, setMetric] = useState<Metric>('tcr');
  const [level, setLevel] = useState(0);
  const method = methods.find((item) => item.id === methodId) ?? methods[0];
  const before = method.zero[metric][level];
  const after = method.tuned[metric][level];
  const delta = after - before;
  const unit = metric === 'tcr' ? '%' : '';
  const scale = 100;

  return <div className="finetune-browser-v2">
    <MetricControls methodId={methodId} metric={metric} level={level} onMethod={setMethodId} onMetric={setMetric} onLevel={setLevel} />
    <div className="before-after-bars" aria-live="polite">
      <header><span>{method.label} · {levels[level]}</span><strong>{metric === 'tcr' ? '完整任务完成率（TCR）' : '任务分数（TS）'}</strong></header>
      <div className="comparison-bar zero"><span>训练前</span><i><b style={{ width: `${before / scale * 100}%` }} /></i><strong>{before.toFixed(1)}{unit}</strong></div>
      <div className="comparison-bar tuned"><span>微调后</span><i><b style={{ width: `${after / scale * 100}%` }} /></i><strong>{after.toFixed(1)}{unit}</strong></div>
      <p className={delta >= 0 ? 'positive' : 'negative'}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)} {metric === 'tcr' ? '个百分点' : 'TS'}</p>
    </div>
    <p className="pipeline-judgment">{methodId === 'rocket' && metric === 'ts' && level === 2 ? 'ROCKET-2 微调后 L3 TS = 52.0：自动数据确实可以转化为可测量的任务进展。' : delta > 0 ? '这个设置下，自动采集数据带来了可测量的提升。' : delta === 0 ? '这个设置下，微调前后数值相同；收益并不覆盖所有难度与指标。' : '真实结果并非所有设置都提升；适配收益具有方法、难度与指标依赖。'}</p>
    <p className="result-source">来源：论文 Table 3</p>
  </div>;
}

export function AdaptationAcrossLevelsV2(_: WidgetProps) {
  const [methodId, setMethodId] = useState<MethodId>('rocket');
  const [metric, setMetric] = useState<Metric>('tcr');
  const method = methods.find((item) => item.id === methodId) ?? methods[3];
  const max = metric === 'tcr' ? 60 : 100;

  return <div className="adaptation-levels-v2">
    <div className="adaptation-summary-controls">
      <div>{methods.map((item) => <button type="button" key={item.id} className={methodId === item.id ? 'selected' : ''} onClick={() => setMethodId(item.id)}>{item.label}</button>)}</div>
      <div>{([['tcr', 'TCR'], ['ts', 'TS']] as const).map(([id, label]) => <button type="button" key={id} className={metric === id ? 'selected' : ''} onClick={() => setMetric(id)}>{label}</button>)}</div>
    </div>
    <div className="level-gain-chart" aria-live="polite">
      {levels.map((item, index) => {
        const zero = method.zero[metric][index];
        const tuned = method.tuned[metric][index];
        return <section key={item} className={index === 4 ? 'highest-level' : ''}>
          <header><strong>{item}</strong><span>{tuned - zero >= 0 ? '+' : ''}{(tuned - zero).toFixed(1)}</span></header>
          <div><i className="zero" style={{ height: `${Math.max(2, zero / max * 100)}%` }}><b>{zero.toFixed(1)}</b></i><i className="tuned" style={{ height: `${Math.max(2, tuned / max * 100)}%` }}><b>{tuned.toFixed(1)}</b></i></div>
        </section>;
      })}
    </div>
    <div className="level-chart-legend"><span><i className="zero" />训练前</span><span><i className="tuned" />微调后</span><b>每组数字为 Table 3 精确值</b></div>
    <p className="pipeline-judgment">L1 的明显收益没有稳定转化成 L5 的完整任务完成能力；但中间难度和不同指标也并非严格单调变化。</p>
    <p className="result-source">来源：论文 Table 3</p>
  </div>;
}

const stageBefore = [11.5, 11.5, 5.1, 4.0] as const;
const stageAfter = [12.2, 11.8, 2.6, 2.4] as const;
const stageLabels = ['S1 探索', 'S2 定位与救援', 'S3 返回', 'S4 定位与交接'] as const;

export function StageAdaptationV2(_: WidgetProps) {
  const [view, setView] = useState<'before' | 'after' | 'both'>('both');
  const series = useMemo(() => view === 'before' ? [{ id: 'before', label: '训练前', values: stageBefore }] : view === 'after' ? [{ id: 'after', label: '微调后', values: stageAfter }] : [{ id: 'before', label: '训练前', values: stageBefore }, { id: 'after', label: '微调后', values: stageAfter }], [view]);
  return <div className="stage-adaptation-v2">
    <div className="stage-adaptation-head"><div><span>固定案例</span><strong>ROCKET-2 · L4</strong></div><div role="group" aria-label="切换训练前后视图">{([['before', '训练前'], ['after', '微调后'], ['both', '并排']] as const).map(([id, label]) => <button type="button" key={id} className={view === id ? 'selected' : ''} onClick={() => setView(id)}>{label}</button>)}</div></div>
    <div className="stage-adaptation-chart" aria-live="polite">
      {stageLabels.map((label, stageIndex) => <section key={label}><header><strong>{label}</strong><span>0–25</span></header><div>{series.map((item) => <i key={item.id} className={item.id}><b style={{ width: `${item.values[stageIndex] / 25 * 100}%` }} /><span>{item.label} {item.values[stageIndex].toFixed(1)}</span></i>)}</div></section>)}
    </div>
    <div className="stage-change-strip">{stageLabels.map((label, index) => <span key={label} className={stageAfter[index] >= stageBefore[index] ? 'up' : 'down'}>{label.split(' ')[0]} {stageBefore[index].toFixed(1)} → {stageAfter[index].toFixed(1)}</span>)}</div>
    <p className="pipeline-judgment">这个案例说明适配收益具有阶段依赖性；它不能被扩大解释为“微调会损害空间记忆”。</p>
    <p className="result-source">来源：论文 Table 4–5</p>
  </div>;
}
