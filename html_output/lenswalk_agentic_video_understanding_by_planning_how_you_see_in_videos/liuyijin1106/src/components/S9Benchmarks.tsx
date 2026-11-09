import { useState } from 'react';
import { LearningModule } from './LearningModule';
import { benchmarks, observerRecipes, type Result } from './s9-data';
import './s9-benchmarks.css';

const paper = 'https://arxiv.org/pdf/2603.24558';
const accuracy = (value: number, digits = 1) => `${value.toFixed(digits)}%`;
const pp = (value: number, digits = 1) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)} pp`;

function Bars({ rows, baselineName, baselineValue, digits = 1 }: {
  rows: Result[]; baselineName?: string; baselineValue?: number; digits?: number;
}) {
  return <div className="s9-bars" role="img" aria-label={rows.map(row => `${row.name} ${accuracy(row.value, row.precision ?? digits)}${baselineValue != null && row.name !== baselineName ? `，相对基线 ${pp(row.value - baselineValue, digits)}` : ''}`).join('；')}>
    {rows.map(row => <div className="s9-bar-row" key={row.name}>
      <span className="s9-bar-name">{row.name}</span>
      <div className="s9-bar-track"><span className={row.name === baselineName ? 's9-bar-fill baseline' : 's9-bar-fill'} style={{ width: `${row.value}%` }}/></div>
      <span className="s9-bar-reading"><strong>{accuracy(row.value, row.precision ?? digits)}</strong>{baselineValue != null && row.name !== baselineName && <small className={row.value < baselineValue ? 'negative' : ''}>{pp(row.value - baselineValue, digits)}</small>}</span>
    </div>)}
    <div className="s9-axis" aria-hidden="true"><span>0</span><span>50</span><span>100%</span></div>
  </div>;
}

function MainResults() {
  const [dataset, setDataset] = useState(0);
  const [mode, setMode] = useState<'base' | 'methods'>('base');
  const current = benchmarks[dataset];
  const rows: Result[] = mode === 'base'
    ? [{ name: '直接使用 o3', value: current.baseline, precision: current.precision }, { name: 'LensWalk (o3)', value: current.lenswalk, precision: current.precision }]
    : current.comparison.map(name => current.results.find(result => result.name === name)!).filter(Boolean);
  const gain = current.lenswalk - current.baseline;
  const best = rows.reduce((a, b) => b.value > a.value ? b : a);
  const explanation = mode === 'base'
    ? `同一基准下，LensWalk (o3) 比直接使用 o3 高 ${pp(gain, current.precision)}。`
    : best.name === 'LensWalk (o3)'
      ? `在当前展示的方法中，LensWalk (o3) 最高；相对直接使用 o3 为 ${pp(gain, current.precision)}。`
      : `在当前展示的方法中，${best.name} 为 ${accuracy(best.value, current.precision)}；LensWalk (o3) 为 ${accuracy(current.lenswalk, current.precision)}。`;

  return <LearningModule number="9.1" title="LensWalk 真的提高了视频理解准确率吗？">
    <div className="s9-control-label">选择基准测试</div>
    <div className="s9-datasets" role="group" aria-label="选择基准测试">{benchmarks.map((item, index) => <button type="button" className={index === dataset ? 'active' : ''} aria-pressed={index === dataset} onClick={() => setDataset(index)} key={item.id}>{item.label}<small>{item.condition}</small></button>)}</div>
    <div className="s9-mode-row"><div className="s9-mode segmented" role="group" aria-label="比较模式"><button type="button" className={mode === 'base' ? 'active' : ''} aria-pressed={mode === 'base'} onClick={() => setMode('base')}>基础模型对比</button><button type="button" className={mode === 'methods' ? 'active' : ''} aria-pressed={mode === 'methods'} onClick={() => setMode('methods')}>其他方法对比</button></div><span className="s9-table-tag">Table {current.table} · 准确率</span></div>
    <div className="s9-chart-heading"><strong>{current.label}</strong><span>{current.condition} · 准确率（%）</span></div>
    <Bars rows={rows} baselineName={mode === 'base' ? '直接使用 o3' : 'o3'} baselineValue={mode === 'base' ? current.baseline : undefined} digits={current.precision}/>
    <p className="s9-reading" aria-live="polite">{explanation}</p>
    <details className="s9-raw"><summary>查看原始数据 · Table {current.table}</summary><div className="s9-raw-scroll"><table><thead><tr><th scope="col">方法 / 模型</th><th scope="col">{current.label} · {current.condition}（%）</th></tr></thead><tbody>{current.results.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{accuracy(row.value, current.precision)}</td></tr>)}</tbody></table></div></details>
  </LearningModule>;
}

function ModelRecipes() {
  const [selected, setSelected] = useState(0);
  const recipe = observerRecipes[selected];
  const rows: Result[] = [
    { name: `直接使用 ${recipe.observer}`, value: recipe.baseline },
    { name: 'Reasoner：o3', value: recipe.o3 },
    { name: 'Reasoner：Qwen3-235B-A22B', value: recipe.qwen3 },
  ];
  const o3Gain = recipe.o3 - recipe.baseline;
  const qwenGain = recipe.qwen3 - recipe.baseline;
  return <LearningModule number="9.2" title="Reasoner 与 Observer 怎样搭配才有效？">
    <p className="s9-role-note">Reasoner 负责观察规划，Observer 负责视觉理解。LensWalk (o3/GPT-4.1) 由 o3 规划、GPT-4.1 观察；LensWalk (o3) 由同一种模型承担两个角色。</p>
    <div className="s9-control-label">固定 Observer，比较不同 Reasoner</div>
    <div className="s9-observers" role="group" aria-label="选择 Observer">{observerRecipes.map((item, index) => <button type="button" className={selected === index ? 'active' : ''} aria-pressed={selected === index} onClick={() => setSelected(index)} key={item.observer}>{item.observer}</button>)}</div>
    <div className="s9-chart-heading"><strong>{recipe.observer}</strong><span>Video-MME · Long · 准确率（%） <span className="s9-table-tag">Table 3</span></span></div>
    <Bars rows={rows} baselineName={`直接使用 ${recipe.observer}`} baselineValue={recipe.baseline}/>
    <p className="s9-reading" aria-live="polite">o3 {o3Gain >= 0 ? '提升' : '下降'} {Math.abs(o3Gain).toFixed(1)} 个百分点；Qwen3 {qwenGain >= 0 ? '提升' : '下降'} {Math.abs(qwenGain).toFixed(1)} 个百分点。</p>
  </LearningModule>;
}

export function S9Benchmarks() {
  return <div className="s9-lesson">
    <p className="s9-intro">LensWalk 通过主动规划视觉观察提升视频理解能力。下面用真实实验结果，比较其准确率变化，以及不同 Reasoner 与 Observer 组合的表现。</p>
    <MainResults/>
    <ModelRecipes/>
    <p className="s9-source"><a href={paper} target="_blank" rel="noreferrer">论文原文 · Tables 1–3 ↗</a></p>
  </div>;
}
