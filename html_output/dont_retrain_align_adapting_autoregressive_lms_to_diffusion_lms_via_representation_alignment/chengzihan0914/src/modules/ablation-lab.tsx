import { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Group = 'metric' | 'weight' | 'layers';
type Metric = 'p1' | 'p10';

const DATA: Record<Group, Array<{ label: string; p1: number; p10: number; note: string }>> = {
  metric: [
    { label: 'L2', p1: 12.0, p10: 25.0, note: '绝对距离会受到隐藏状态尺度变化影响。' },
    { label: 'Cosine', p1: 18.0, p10: 31.0, note: '方向几何在两个指标上都优于 L2，因此成为默认选择。' },
  ],
  weight: [
    { label: 'λ = 1', p1: 7.5, p10: 22.6, note: '锚定较弱，教师表示没有被充分利用。' },
    { label: 'λ = 5', p1: 9.9, p10: 26.8, note: '对齐增强，但仍低于默认权重。' },
    { label: 'λ = 10', p1: 18.0, p10: 31.0, note: '论文采用的默认值，在这组 sweep 中给出最强综合结果。' },
    { label: 'λ = 20', p1: 11.3, p10: 29.3, note: '过强锚定限制学生适配双向去噪机制。' },
  ],
  layers: [
    { label: 'Lower', p1: 11.28, p10: 25.0, note: '低层单独对齐不足以保住完整表示结构。' },
    { label: 'Middle', p1: 15.73, p10: 31.1, note: '中层包含较强的可迁移信号。' },
    { label: 'Upper', p1: 8.96, p10: 31.71, note: 'Upper 的 pass@10 最高，但 pass@1 明显较低。' },
    { label: 'All', p1: 18.0, p10: 31.0, note: 'All 的 pass@1 最高，说明信号分布在网络深度中。' },
  ],
};

export const AblationLab: React.FC<WidgetProps> = () => {
  const [group, setGroup] = useState<Group>('metric');
  const [metric, setMetric] = useState<Metric>('p1');
  const [selected, setSelected] = useState(1);
  const rows = DATA[group];
  const max = metric === 'p1' ? 20 : 35;
  const active = rows[Math.min(selected, rows.length - 1)];
  const value = active[metric];
  const best = useMemo(() => Math.max(...rows.map((row) => row[metric])), [rows, metric]);
  const chooseGroup = (next: Group) => {
    setGroup(next);
    setSelected(next === 'metric' ? 1 : next === 'weight' ? 2 : 3);
  };
  return (
    <div className="ablation-lab">
      <div className="ablation-toolbar">
        <div className="chip-row">
          <button type="button" className={`chip ${group === 'metric' ? 'selected' : ''}`} onClick={() => chooseGroup('metric')}>距离函数</button>
          <button type="button" className={`chip ${group === 'weight' ? 'selected' : ''}`} onClick={() => chooseGroup('weight')}>λ 权重</button>
          <button type="button" className={`chip ${group === 'layers' ? 'selected' : ''}`} onClick={() => chooseGroup('layers')}>对齐层范围</button>
        </div>
        <div className="metric-toggle" aria-label="选择评估指标">
          <button type="button" className={metric === 'p1' ? 'selected' : ''} onClick={() => setMetric('p1')}>pass@1</button>
          <button type="button" className={metric === 'p10' ? 'selected' : ''} onClick={() => setMetric('p10')}>pass@10</button>
        </div>
      </div>
      <div className="ablation-chart" role="group" aria-label={`HumanEval ${metric === 'p1' ? 'pass@1' : 'pass@10'} 消融柱状图`}>
        {rows.map((row, index) => {
          const rowValue = row[metric];
          const isBest = rowValue === best;
          return (
            <button
              type="button"
              key={row.label}
              className={`ablation-row ${selected === index ? 'selected' : ''} ${isBest ? 'best' : ''}`}
              onClick={() => setSelected(index)}
              aria-label={`${row.label}，${metric === 'p1' ? 'pass@1' : 'pass@10'} 为 ${rowValue.toFixed(2)}`}
            >
              <span className="ablation-label">{row.label}</span>
              <span className="ablation-track"><i style={{ width: `${rowValue / max * 100}%` }} /></span>
              <strong>{rowValue.toFixed(2)}</strong>
            </button>
          );
        })}
      </div>
      <div className={`feedback ${value === best ? 'good' : group === 'weight' && active.label === 'λ = 20' ? 'bad' : ''}`}>
        <b>{active.label} · {metric === 'p1' ? 'pass@1' : 'pass@10'} = {value.toFixed(2)}。</b>{active.note}
      </div>
      <p className="evidence-caption">数据源：论文 Table 2，HumanEval；所有设置沿用同一 AR→DLM 转换协议。</p>
    </div>
  );
};
