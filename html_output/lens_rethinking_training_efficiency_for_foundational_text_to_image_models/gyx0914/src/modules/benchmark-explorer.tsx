import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const models = [
  { name: 'Lens', steps: '20 步', color: '#2c5b91', scores: [0.557, 0.525, 0.930, 0.937, 0.869, 0.951, 0.814] },
  { name: 'Lens-Turbo', steps: '4 步', color: '#e08046', scores: [0.554, 0.519, 0.914, 0.927, 0.889, 0.965, 0.815] },
  { name: 'Z-Image', steps: '论文表 2', color: '#789773', scores: [0.546, 0.535, 0.840, 0.935, 0.867, 0.937, 0.797] },
];
const metrics = [
  { name: 'OneIG 英文', meaning: 'OneIG 的英文整体分。' },
  { name: 'OneIG 中文', meaning: 'OneIG 的中文整体分。' },
  { name: 'GenEval', meaning: '外部文生图评测，检查物体、数量、颜色、位置和属性关系是否符合提示词；分数越高表示组合匹配越好。' },
  { name: 'LongText 英文', meaning: '较长英文提示词的整体分。' },
  { name: 'CVTG 平均', meaning: '视觉文字生成的平均分。' },
  { name: 'CVTG NED', meaning: '视觉文字生成中的归一化编辑距离指标；表中按分数越高越好报告。' },
  { name: 'CVTG CLIP', meaning: '视觉文字生成的 CLIP 指标。' },
];

export const BenchmarkExplorer: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState(2);
  const best = Math.max(...models.map(model => model.scores[metric]));
  const winners = models.filter(model => model.scores[metric] === best).map(model => model.name).join('、');

  return (
    <div className="lens-results lens-widget">
      <div className="lens-widget-kicker">不要把不同测试的分数混成一个总分</div>
      <p className="lens-widget-instruction">选择一项指标，看同一列里各模型的数值。下方可展开论文表 2 的完整相关列。</p>
      <div className="lens-results-metrics" role="group" aria-label="选择比较指标">
        {metrics.map((item, index) => <button type="button" key={item.name} className={`chip ${metric === index ? 'selected' : ''}`} onClick={() => setMetric(index)} aria-pressed={metric === index}>{item.name}</button>)}
      </div>
      <div className="lens-results-chart" aria-live="polite">
        <h5>{metrics[metric].name}<small>论文表 2；横轴从 0 到 1，越高越好</small></h5>
        <p>{metrics[metric].meaning}</p>
        {models.map(model => <div className="lens-results-row" key={model.name}><span>{model.name}<small>{model.steps}</small></span><div className="lens-results-track"><div className="lens-results-bar" style={{ width: `${model.scores[metric] * 100}%`, backgroundColor: model.color }} /></div><b>{model.scores[metric].toFixed(3)}</b></div>)}
        <div className="lens-results-axis"><span>0</span><span>0.5</span><span>1.0</span></div>
      </div>
      <div className="feedback good">这项指标中，三者最高为 {winners}（{best.toFixed(3)}）。这只说明该指标下的表 2 数值，不能推广成所有图像都更好。</div>
      <div className="lens-results-speed"><div><b>Lens</b><strong>20 步 · 3.15 秒</strong></div><div><b>Lens-Turbo</b><strong>4 步 · 0.84 秒</strong></div><p>速度来自论文报告的单张 NVIDIA H100、1024² 图像条件；上面的质量分数来自不同基准测试，不与秒数合并计算。</p></div>
      <details className="lens-results-details"><summary>展开论文表 2 的七项分数</summary><div className="lens-results-table-scroll"><table><thead><tr><th>模型</th>{metrics.map(item => <th key={item.name}>{item.name}</th>)}</tr></thead><tbody>{models.map(model => <tr key={model.name}><th>{model.name}</th>{model.scores.map((score, index) => <td key={metrics[index].name}>{score.toFixed(3)}</td>)}</tr>)}</tbody></table></div></details>
      <p className="lens-widget-source">依据：论文表 2 与摘要/引言中的速度条件。这里只摘取 Lens、Lens-Turbo、Z-Image 三行；速度和质量分数仍需按各自测试条件解读。</p>
    </div>
  );
};
