// Refinement 2026-10-22. Exact rows from Table 3, MCFS-130 five-fold averages.
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
const rows = [
  { name: 'MS-GCN', f1: 39.1, flops: 39.97, params: 1.10 },
  { name: 'DeST†（TCN）', f1: 61.8, flops: 4.91, params: .76 },
  { name: 'DeST 标准版', f1: 63.0, flops: 6.89, params: 1.10 },
  { name: 'DeST*（加 TSR）', f1: 66.0, flops: 12.32, params: 2.00 },
];
const metrics = { f1: { label: 'F1@50（越高越好）', max: 75, unit: '', digits: 1 }, flops: { label: 'FLOPs（越低越省）', max: 45, unit: 'G', digits: 2 }, params: { label: '参数量（越低越小）', max: 2.3, unit: 'M', digits: 2 } } as const;
export const DestResults: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<keyof typeof metrics>('f1');
  const [selected, setSelected] = useState(2);
  const [revealed, setRevealed] = useState(true);
  const spec = metrics[metric];
  const row = rows[selected];
  const note = selected === 0 ? '这是 Table 3 中的一项时空建模基线，不代表表内所有已有方法。' : selected === 1 ? '用 TCN 替换线性 Transformer。它是所列配置中计算量和参数量最小的 DeST 变体，但 F1@50 低于标准版。' : selected === 2 ? '标准版使用线性 Transformer。相对这里列出的 MS-GCN，F1@50 增加 23.9 个百分点；FLOPs 从 39.97G 降至 6.89G。' : '增加额外 TSR 分支（Table 3 标注为来自参考文献 [23]）。相对标准版，F1@50 增加 3.0 个百分点，FLOPs 增至约 1.79 倍，参数量也增加。';
  return <div className="dest-refined">
    <div className="ctrl">{(Object.keys(metrics) as (keyof typeof metrics)[]).map(key => <button key={key} className={'chip' + (metric === key ? ' active' : '')} aria-pressed={metric === key} onClick={() => setMetric(key)}>{metrics[key].label}</button>)}<button className="chip" onClick={() => setRevealed(s => !s)}>{revealed ? '隐藏数值，先判断' : '开始比较'}</button></div>
    <div className="dest-results-bars">{rows.map((r, i) => <button key={r.name} className={'dest-result-row' + (selected === i ? ' is-focus' : '')} aria-pressed={selected === i} onClick={() => setSelected(i)}><span className="dest-result-name">{r.name}</span><span className="dest-bar-track"><i style={{ width: revealed ? `${r[metric] / spec.max * 100}%` : '0%' }} /></span><strong>{revealed ? r[metric].toFixed(spec.digits) + spec.unit : '?'}</strong></button>)}</div>
    <div className="feedback" aria-live="polite"><strong>{row.name}：</strong>{note}</div>
    <details className="dest-details"><summary>展开原始数值与评测协议</summary><table className="paper"><caption>Table 3 · MCFS-130 五折交叉验证均值</caption><thead><tr><th>方法</th><th>F1@50 ↑</th><th>FLOPs ↓</th><th>参数量 ↓</th></tr></thead><tbody>{rows.map(r => <tr key={r.name}><td>{r.name}</td><td>{r.f1.toFixed(1)}</td><td>{r.flops.toFixed(2)}G</td><td>{r.params.toFixed(2)}M</td></tr>)}</tbody></table><p>MCFS-130 与 MCFS-22 报五折均值；PKU-MMD、LARa 使用单次验证。不同数据集和协议不能合成一个总排名。</p></details>
    <div className="dest-evidence-card"><span>读完结果，还要保留边界</span><p>本文仍认为细粒度动作有改进空间，并提出更好的空间拓扑、多流融合及自监督长序列建模等后续方向。与 TVG 可衔接的是“时间边界和时序表示”这个问题；DeST 的数值不证明文本查询定位能力。</p><p>延伸阅读可以选择 VTimeCoT：看看模型怎样借助可视化工具寻找并核对时间证据；这是一条推荐的学习路线，不是必读顺序。</p></div>
    <p className="module-note">网页依据 arXiv v1。IJCV 2026 版尚未逐项对照；这里不混用不同版本结果。FLOPs 是计算量，不等于在任意硬件上的实际运行速度。</p>
  </div>;
};
