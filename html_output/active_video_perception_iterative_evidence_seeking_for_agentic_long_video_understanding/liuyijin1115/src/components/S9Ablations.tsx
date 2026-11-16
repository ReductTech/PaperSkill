import { useState } from 'react';
import './s9-ablations.css';

type Props = { onComplete: () => void };
type Dataset = 'MINERVA' | 'LVBench';
type Scores = Record<Dataset, number>;
type Experiment = 'models' | 'rounds' | 'threshold';

const componentSteps = [
  { label: 'Observer only', short: 'Observer', scores: { MINERVA: 60.8, LVBench: 67.4 } },
  { label: 'Planner + Observer', short: '+ Planner', scores: { MINERVA: 63.9, LVBench: 72.6 } },
  { label: 'Planner + Observer + Reflector', short: '+ Reflector', scores: { MINERVA: 65.6, LVBench: 74.8 } }
] as const;

const presets = [
  { label: '全 Flash', models: ['Flash', 'Flash', 'Flash'], scores: { MINERVA: 56.9, LVBench: 63.8 } },
  { label: '规划、反思 Pro', models: ['Pro', 'Flash', 'Pro'], scores: { MINERVA: 60.2, LVBench: 67.6 } },
  { label: '仅观察 Pro', models: ['Flash', 'Pro', 'Flash'], scores: { MINERVA: 63.6, LVBench: 71.8 } },
  { label: '全 Pro', models: ['Pro', 'Pro', 'Pro'], scores: { MINERVA: 65.6, LVBench: 74.8 } }
] as const;
const roundOptions = [
  { label: '1 轮', scores: { MINERVA: 63.9, LVBench: 72.6 } },
  { label: '2 轮', scores: { MINERVA: 65.0, LVBench: 74.6 } },
  { label: '3 轮', scores: { MINERVA: 65.6, LVBench: 74.8 } },
  { label: '5 轮', scores: { MINERVA: 65.5, LVBench: 74.6 } }
] as const;
const thresholdOptions = [
  { label: '0.5', scores: { MINERVA: 64.2, LVBench: 73.2 } },
  { label: '0.7', scores: { MINERVA: 65.6, LVBench: 74.8 } },
  { label: '0.9', scores: { MINERVA: 65.4, LVBench: 74.8 } }
] as const;
const evidence = [
  { label: '非结构化', scores: { MINERVA: 63.2, LVBench: 71.2 } },
  { label: '结构化', scores: { MINERVA: 65.6, LVBench: 74.8 } }
] as const;
const format = (value: number) => value.toFixed(1);
const gain = (a: number, b: number) => format(b - a);

export function S9Assembly({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [dataset, setDataset] = useState<Dataset>('LVBench');
  const current = componentSteps[step];
  const first = componentSteps[0].scores[dataset];
  const plannerGain = gain(first, componentSteps[1].scores[dataset]);
  const reflectorGain = gain(componentSteps[1].scores[dataset], componentSteps[2].scores[dataset]);
  function chooseStep(index: number) { setStep(index); onComplete(); }
  function chooseDataset(value: Dataset) { setDataset(value); onComplete(); }
  return <div className="s9-assembly">
    <div className="s9-toolbar">
      <p>沿着已评测的三个阶段组装系统，观察结构和准确率如何一起变化。</p>
      <div className="s9-dataset" role="group" aria-label="选择数据集">
        {(['MINERVA', 'LVBench'] as const).map(value => <button type="button" key={value} aria-pressed={dataset === value} onClick={() => chooseDataset(value)}>{value}</button>)}
      </div>
    </div>
    <div className="s9-assembly-board">
      <div className="s9-stage-steps" role="group" aria-label="系统组装阶段">
        {componentSteps.map((item, index) => <button type="button" key={item.label} aria-pressed={step === index} onClick={() => chooseStep(index)}><span>0{index + 1}</span><b>{item.short}</b></button>)}
      </div>
      <div className="s9-system" aria-label={`当前系统：${current.label}`}>
        <div className="s9-source"><span>视频输入</span><div className="s9-film" aria-hidden="true"><i/><i/><i/><i/></div></div>
        <div className="s9-system-flow">
          {step >= 1 && <div key="planner" className="s9-unit s9-unit--planner"><span>01 · 规划</span><strong>Planner</strong><small>观察计划 · 看哪里</small></div>}
          {step >= 1 && <span className="s9-arrow" aria-label="观察计划传入 Observer">→</span>}
          <div className="s9-unit s9-unit--observer"><span>{step >= 1 ? '02' : '01'} · 感知</span><strong>Observer</strong><small>观察视频 · 提取证据</small></div>
          {step === 2 && <span className="s9-arrow" aria-label="证据传入 Reflector">→</span>}
          {step === 2 && <div key="reflector" className="s9-unit s9-unit--reflector"><span>03 · 反思</span><strong>Reflector</strong><small>评估证据 · 反馈缺口</small></div>}
        </div>
        <div className="s9-system-output"><span>{step === 0 ? '观察结果' : step === 1 ? '按计划取得证据' : '反馈指导下一次规划'}</span>{step === 2 && <b className="s9-feedback" aria-label="Reflector 将证据缺口反馈给 Planner">↶ 证据缺口反馈给 Planner</b>}</div>
      </div>
      <div className="s9-assembly-result" aria-live="polite"><span>{dataset} · Accuracy %</span><strong>{format(current.scores[dataset])}<small>%</small></strong><p>{step === 0 ? 'Observer 独立观察，作为组装起点。' : step === 1 ? `加入 Planner 后，准确率提高 ${plannerGain} pp。` : `再加入 Reflector，提高 ${reflectorGain} pp；相对起点共提高 ${gain(first, current.scores[dataset])} pp。`}</p></div>
      <div className="s9-gain-track" aria-label={`${dataset} 三阶段准确率：${componentSteps.map(item => `${item.label} ${format(item.scores[dataset])}%`).join('，')}`}>
        {componentSteps.map((item, index) => <button type="button" key={item.label} className={step === index ? 'is-current' : ''} aria-pressed={step === index} onClick={() => chooseStep(index)}><span className="s9-track-dot"/><b>{format(item.scores[dataset])}%</b><small>{index === 0 ? 'Observer' : index === 1 ? `Planner +${plannerGain} pp` : `Reflector +${reflectorGain} pp`}</small></button>)}
      </div>
    </div>
  </div>;
}

function AccuracyPlot({ rows, selected, onSelect, label }: { rows: readonly { label: string; scores: Scores }[]; selected: number; onSelect: (index: number) => void; label: string }) {
  return <div className="s9-plot" aria-label={label}>
    <div className="s9-plot-top"><strong>准确率比较</strong><span><i className="s9-key s9-key--minerva"/>MINERVA <i className="s9-key s9-key--lvbench"/>LVBench</span></div>
    <div className="s9-plot-axis"><span>Accuracy %</span><div><b>0</b><b>25</b><b>50</b><b>75</b><b>100</b></div><span/></div>
    <div className="s9-plot-rows">{rows.map((row, index) => <button type="button" key={row.label} className={selected === index ? 'is-current' : ''} aria-pressed={selected === index} aria-label={`${row.label}：MINERVA ${format(row.scores.MINERVA)}%，LVBench ${format(row.scores.LVBench)}%`} onClick={() => onSelect(index)}>
      <b className="s9-plot-label">{row.label}</b><span className="s9-plot-lines"><span className="s9-score-line"><i className="s9-fill s9-fill--minerva" style={{ width: `${row.scores.MINERVA}%` }}/><i className="s9-mark s9-mark--minerva" style={{ left: `${row.scores.MINERVA}%` }}/></span><span className="s9-score-line"><i className="s9-fill s9-fill--lvbench" style={{ width: `${row.scores.LVBench}%` }}/><i className="s9-mark s9-mark--lvbench" style={{ left: `${row.scores.LVBench}%` }}/></span></span><span className="s9-plot-values">{format(row.scores.MINERVA)}%<br/>{format(row.scores.LVBench)}%</span>
    </button>)}</div>
  </div>;
}

export function S9Explorer({ onComplete }: Props) {
  const [experiment, setExperiment] = useState<Experiment>('models');
  const [model, setModel] = useState(3);
  const [round, setRound] = useState(2);
  const [threshold, setThreshold] = useState(1);
  const rows = experiment === 'models' ? presets : experiment === 'rounds' ? roundOptions : thresholdOptions;
  const selected = experiment === 'models' ? model : experiment === 'rounds' ? round : threshold;
  const current = rows[selected];
  function selectExperiment(value: Experiment) { setExperiment(value); onComplete(); }
  function selectRow(index: number) {
    if (experiment === 'models') setModel(index);
    else if (experiment === 'rounds') setRound(index);
    else setThreshold(index);
    onComplete();
  }
  const explanation = experiment === 'models'
    ? model === 0 ? '这是三模块都使用 Flash 的起点。' : model === 1 ? 'Planner 与 Reflector 升为 Pro，Observer 仍为 Flash。' : model === 2 ? '仅 Observer 升为 Pro；这组结果高于前两组，尤其在 LVBench 上。' : '三模块均为 Pro；这组配置在两个基准上最高。'
    : experiment === 'rounds'
      ? round === 2 ? '最大允许轮数从 1 增至 3 时，两项结果提高；5 轮没有继续提升。' : round === 3 ? '允许最多 5 轮，成绩没有超过最多 3 轮的设置。' : '这里调整的是最大允许轮数，不是某个视频实际执行的轮数。'
      : threshold === 1 ? '0.7 是这组实验的默认阈值：MINERVA 最高，LVBench 与 0.9 持平。' : threshold === 0 ? '0.5 更容易较早停止，在这组实验中两项成绩较低。' : '0.9 在 LVBench 与 0.7 持平，MINERVA 略低。';
  return <div className="s9-explorer">
    <div className="s9-experiment-tabs" role="group" aria-label="选择配置实验">{([['models', '模型配置'], ['rounds', '最大轮数'], ['threshold', '停止阈值']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={experiment === value} onClick={() => selectExperiment(value)}>{label}</button>)}</div>
    <div className="s9-experiment-board">
      <div className="s9-config-panel">
        <span className="s9-panel-label">{experiment === 'models' ? '三模块模型预设' : experiment === 'rounds' ? '最大允许轮数' : 'Reflector 停止阈值'}</span>
        {experiment === 'models' ? <><div className="s9-model-chain">{(['Planner', 'Observer', 'Reflector'] as const).map((name, index) => <div key={name} className={`s9-model-node s9-model-node--${name.toLowerCase()}`}><span>{name}</span><strong>{presets[model].models[index]}</strong></div>)}</div><p>选择一组已评测的 Flash / Pro 配置。</p></> : <><div className="s9-param-display"><strong>{current.label}</strong><span>{experiment === 'rounds' ? '最多进行的 Plan → Observe → Reflect 循环' : '达到该置信度时允许停止观察'}</span></div><p>{experiment === 'rounds' ? '可提前停止；上限不等于每个视频的实际观察次数。' : '阈值是停止条件，不是答案正确率。'}</p></>}
        <div className="s9-options" role="group" aria-label={experiment === 'models' ? '模型配置预设' : experiment === 'rounds' ? '最大轮数选项' : '停止阈值选项'}>{rows.map((row, index) => <button type="button" key={row.label} aria-pressed={selected === index} onClick={() => selectRow(index)}>{row.label}{experiment === 'threshold' && index === 1 && <small>默认</small>}</button>)}</div>
      </div>
      <AccuracyPlot rows={rows} selected={selected} onSelect={selectRow} label={`${experiment} 实验准确率比较`} />
      <div className="s9-experiment-readout" aria-live="polite"><strong>{current.label}</strong><span>MINERVA {format(current.scores.MINERVA)}% · LVBench {format(current.scores.LVBench)}%</span><p>{explanation}</p></div>
    </div>
    <div className="s9-evidence-compare"><div><strong>结构化证据</strong><p>按时间与语义组织证据，有助于后续规划和反思。</p></div><div className="s9-evidence-values">{evidence.map(item => <span key={item.label}><b>{item.label}</b><small>MINERVA {format(item.scores.MINERVA)}% · LVBench {format(item.scores.LVBench)}%</small></span>)}</div></div>
  </div>;
}
