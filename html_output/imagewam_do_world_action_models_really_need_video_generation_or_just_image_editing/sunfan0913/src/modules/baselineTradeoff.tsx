import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Baseline = {
  name: string;
  success: '论文报告领先/有竞争力' | '需按统一表格核对';
  latency: string;
  compute: string;
  x: number;
  y: number;
  color: string;
  note: string;
};

const baselines: Baseline[] = [
  {
    name: 'ImageWAM',
    success: '论文报告领先/有竞争力',
    latency: '约为视频式 WAM 的 1/4',
    compute: '约为视频式 WAM 的 1/6',
    x: 82,
    y: 23,
    color: '#2eb67d',
    note: '论文摘要明确报告：在其模拟器与真实世界实验中，优于所比较的标准 VLA 与竞争性 WAM。',
  },
  {
    name: 'FastWAM',
    success: '需按统一表格核对',
    latency: '论文表格待核对',
    compute: '论文表格待核对',
    x: 68,
    y: 44,
    color: '#2f6fed',
    note: '作为视频式 WAM 对照时，应使用相同任务、硬件、控制频率和聚合方式比较。',
  },
  {
    name: 'OpenVLA',
    success: '需按统一表格核对',
    latency: '论文表格待核对',
    compute: '论文表格待核对',
    x: 52,
    y: 58,
    color: '#8b6bd6',
    note: 'VLA 基线与 WAM 的输入、预测目标和推理路径不同，不能仅凭单一成功率横向下结论。',
  },
  {
    name: 'π₀',
    success: '需按统一表格核对',
    latency: '论文表格待核对',
    compute: '论文表格待核对',
    x: 60,
    y: 51,
    color: '#ff8f3d',
    note: '应在论文对应实验协议下比较，不把不同动作空间或数据设置的结果混在一起。',
  },
  {
    name: 'LingBot-VA',
    success: '需按统一表格核对',
    latency: '论文表格待核对',
    compute: '论文表格待核对',
    x: 72,
    y: 69,
    color: '#d45d79',
    note: '页面保留为基线入口；精确数值应以论文实验表和相同评测协议为准。',
  },
];

export const BaselineTradeoff: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState('ImageWAM');
  const [metric, setMetric] = useState<'success' | 'latency' | 'compute'>('success');
  const active = useMemo(() => baselines.find((item) => item.name === selected) ?? baselines[0], [selected]);

  return (
    <div className="baseline-tradeoff">
      <div className="baseline-controls" role="group" aria-label="选择基线">
        {baselines.map((item) => (
          <button
            key={item.name}
            type="button"
            className={item.name === selected ? 'active' : ''}
            onClick={() => setSelected(item.name)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="baseline-metric-tabs" role="group" aria-label="选择分析维度">
        <button type="button" className={metric === 'success' ? 'active' : ''} onClick={() => setMetric('success')}>
          成功率
        </button>
        <button type="button" className={metric === 'latency' ? 'active' : ''} onClick={() => setMetric('latency')}>
          推理延迟
        </button>
        <button type="button" className={metric === 'compute' ? 'active' : ''} onClick={() => setMetric('compute')}>
          算力开销
        </button>
      </div>
      <div className="baseline-chart" aria-label="成功率、延迟和算力的相对权衡图">
        <svg viewBox="0 0 560 290" role="img">
          <text x="38" y="22" className="chart-title">成功率 ↑</text>
          <text x="455" y="276" className="chart-title">延迟 / 算力 ↓</text>
          <line x1="42" y1="246" x2="520" y2="246" className="chart-axis" />
          <line x1="42" y1="36" x2="42" y2="246" className="chart-axis" />
          <line x1="42" y1="92" x2="520" y2="92" className="chart-grid" />
          <line x1="42" y1="162" x2="520" y2="162" className="chart-grid" />
          {baselines.map((item) => (
            <g key={item.name} className={item.name === selected ? 'baseline-dot selected' : 'baseline-dot'} onClick={() => setSelected(item.name)}>
              <circle cx={42 + item.x * 4.7} cy={246 - item.y * 2.1} r={item.name === selected ? 11 : 8} fill={item.color} />
              <text x={42 + item.x * 4.7} y={246 - item.y * 2.1 - 15} textAnchor="middle">{item.name}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="baseline-detail">
        <strong>{active.name}</strong>
        <span>{metric === 'success' ? active.success : metric === 'latency' ? active.latency : active.compute}</span>
        <p>{active.note}</p>
      </div>
      <small className="baseline-disclaimer">
        图中点位是帮助理解三维权衡的相对示意，不是统一实验表的精确百分比；跨基线结论必须回到论文的任务、硬件、数据集、指标和聚合协议。
      </small>
    </div>
  );
};
