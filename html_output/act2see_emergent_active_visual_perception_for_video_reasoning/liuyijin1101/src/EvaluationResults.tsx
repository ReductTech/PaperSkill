import { useState } from 'react';
import { benchmarks, PAPER } from './content';
import './styles/evaluation.css';

const ablation = [
  { label: '纯文本示范', score: 71.9 },
  { label: '仅 Retrieve', score: 72.8 },
  { label: '仅 Generate', score: 72.4 },
  { label: 'Retrieve + Generate', score: 73.7 },
] as const;

function PaperSource({ table }: { table: '2' | '8' }) {
  return <a className="source-link" href={`${PAPER}#S4.T${table}`} target="_blank" rel="noreferrer">论文报告 · Table {table} ↗</a>;
}

export function EvaluationBenchmark() {
  const [selected, setSelected] = useState('VCR-Bench');
  const benchmark = benchmarks.find(item => item.name === selected) ?? benchmarks[3];
  const gain = (benchmark.score - benchmark.base).toFixed(1);

  return <div className="evaluation-main">
    <div className="evaluation-source"><PaperSource table="2"/><span>同一基座模型的前后比较</span></div>
    <div className="evaluation-picker" role="group" aria-label="选择视频推理基准">
      {benchmarks.map(item => <button key={item.name} type="button" className={item.name === selected ? 'selected' : ''} aria-pressed={item.name === selected} onClick={() => setSelected(item.name)}>{item.name}</button>)}
    </div>
    <div className="evaluation-chart" role="img" aria-label={`${benchmark.name}：Qwen3-VL-8B-Thinking ${benchmark.base}，Act2See ${benchmark.score}，绝对分数提升 ${gain} 分`}>
      <div className="evaluation-chart-heading"><div><span className="evaluation-kicker">当前基准</span><h3>{benchmark.name}</h3><p>{benchmark.skill}</p></div><div className="evaluation-gain"><span>绝对分数提升</span><strong>+{gain} 分</strong></div></div>
      <div className="evaluation-score-row"><div className="evaluation-score-label"><span>基座 · Qwen3-VL-8B-Thinking</span><strong>{benchmark.base.toFixed(1)}</strong></div><div className="evaluation-track"><span className="evaluation-fill base" style={{ width: `${benchmark.base}%` }}/></div></div>
      <div className="evaluation-score-row"><div className="evaluation-score-label"><span>Act2See</span><strong>{benchmark.score.toFixed(1)}</strong></div><div className="evaluation-track"><span className="evaluation-fill act" style={{ width: `${benchmark.score}%` }}/></div></div>
      <div className="evaluation-axis"><span>0</span><span>50</span><span>100</span></div>
    </div>
  </div>;
}

export function EvaluationAblation() {
  return <div className="evaluation-ablation">
    <div className="evaluation-source"><PaperSource table="8"/><span>Video-MME 准确率 · 1k 样本消融</span></div>
    <div className="evaluation-ablation-chart" role="img" aria-label="Video-MME 准确率：纯文本示范 71.9，仅 Retrieve 72.8，仅 Generate 72.4，Retrieve 加 Generate 73.7">
      {ablation.map(item => <div className={`evaluation-ablation-row${item.label === 'Retrieve + Generate' ? ' best' : ''}`} key={item.label}>
        <span className="evaluation-ablation-label">{item.label}</span>
        <div className="evaluation-ablation-track"><span style={{ width: `${((item.score - 70) / 4) * 100}%` }}/></div>
        <strong>{item.score.toFixed(1)}</strong>
      </div>)}
      <div className="evaluation-ablation-axis"><span>70</span><span>72</span><span>74</span></div>
    </div>
    <p className="evaluation-note">Table 8：四组各使用 1,000 条 SFT 样本，基座相同，输入帧均为 1 fps；图中横轴截取 70–74，数值为原始准确率。仅使用 Retrieve 或 Generate 均高于纯文本示范，混合两种工具的训练示范在本组最高。此处的 73.7 与 Table 2 完整训练的 74.2 属于不同实验设置。</p>
  </div>;
}
