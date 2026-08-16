import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { usePanelWidth } from './omni-interaction-kit';

type ChartSpec = {
  title: string;
  rho: string;
  p: string;
  color: string;
  ranks: number[];
};

const FACTOR_POSITIONS = [.08, .16, .25, .34, .45, .56, .68, .78, .88, .95];
const CHARTS: ChartSpec[] = [
  {
    title: '预训练数据集多样性',
    rho: '−0.27',
    p: '1.1×10⁻⁷',
    color: '#245d87',
    ranks: [9.6, 8.5, 8.9, 7.2, 6.8, 6.1, 5.3, 4.1, 4.5, 2.6],
  },
  {
    title: '模型参数量',
    rho: '−0.21',
    p: '7.0×10⁻⁴',
    color: '#6756a3',
    ranks: [9.4, 8.8, 8.2, 7.4, 7.1, 5.8, 5.1, 4.6, 3.6, 2.7],
  },
];

function pointX(chart: { x: number; w: number }, factor: number) {
  return chart.x + 46 + factor * (chart.w - 76);
}

function pointY(chart: { y: number; h: number }, rank: number) {
  return chart.y + 50 + ((rank - 1) / 9) * (chart.h - 94);
}

export const OmniLab13: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const width = mobile ? 360 : 920;
  const height = mobile ? 590 : 400;
  const [modelIndex, setModelIndex] = useState(4);
  const chartLayouts = mobile
    ? [{ x: 28, y: 102, w: 304, h: 214 }, { x: 28, y: 354, w: 304, h: 214 }]
    : [{ x: 52, y: 102, w: 374, h: 270 }, { x: 494, y: 102, w: 374, h: 270 }];
  const charts = chartLayouts.map((layout, index) => ({ ...CHARTS[index], ...layout }));
  const selectedFactor = FACTOR_POSITIONS[modelIndex];

  return (
    <div className="oi-unit oi-correlation-unit" ref={ref}>
      <div className="oi-caption">
        <span>逐点读取一个模型，观察“因素更大”怎样对应“名次数字更小”</span>
        <strong>ρ &lt; 0：整体向右上</strong>
      </div>
      <div className="oi-rank-control">
        <label htmlFor="oi-model-index">选择示意模型</label>
        <input
          id="oi-model-index"
          type="range"
          min="0"
          max="9"
          step="1"
          value={modelIndex}
          onChange={(event) => setModelIndex(Number(event.target.value))}
          aria-valuetext={`模型 M${modelIndex + 1}`}
        />
        <output htmlFor="oi-model-index">M{modelIndex + 1}</output>
      </div>
      <svg
        className="oi-stage oi-correlation-stage"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="逐点查看示意模型在两个因素上的相对位置和名次，理解负 Spearman 相关"
      >
        <rect x=".5" y=".5" width={width - 1} height={height - 1} rx="6" fill="#f7f9fb" stroke="#d6e0e8" />
        <text x={mobile ? 24 : 42} y="36" className="oi-kicker">机制示意 · 点云不对应论文十个模型的原始观测</text>
        <text x={mobile ? 24 : 42} y="61" className="oi-correlation-rule">右移 = 因素增大　·　上移 = 名次数字降低（更好）</text>
        {charts.map((chart, chartIndex) => {
          const rank = chart.ranks[modelIndex];
          const px = pointX(chart, selectedFactor);
          const py = pointY(chart, rank);
          const plotTop = chart.y + 50;
          const plotBottom = chart.y + chart.h - 44;
          const plotLeft = chart.x + 46;
          const plotRight = chart.x + chart.w - 30;
          const labelY = Math.max(plotTop + 16, py - 13);
          return (
            <g key={chart.title}>
              <rect x={chart.x} y={chart.y} width={chart.w} height={chart.h} rx="5" fill="#fff" stroke="#cbd7e1" />
              <text x={chart.x + 14} y={chart.y + 25} className="oi-label">{chart.title}</text>
              <text x={chart.x + chart.w - 14} y={chart.y + 25} textAnchor="end" className="oi-note">论文中位 ρ = {chart.rho}</text>
              <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} className="oi-axis-line" />
              <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} className="oi-axis-line" />
              {[1, 5, 10].map((rankTick) => {
                const y = pointY(chart, rankTick);
                return <g key={rankTick}>
                  <line x1={plotLeft} y1={y} x2={plotRight} y2={y} className="oi-grid-line" />
                  <text x={plotLeft - 8} y={y + 3} textAnchor="end" className="oi-mini">{rankTick}</text>
                </g>;
              })}
              <text x={plotLeft - 8} y={plotTop - 13} textAnchor="end" className="oi-axis-label">名次</text>
              <text x={plotLeft} y={plotBottom + 18} className="oi-mini">因素小</text>
              <text x={plotRight} y={plotBottom + 18} textAnchor="end" className="oi-mini">因素大</text>
              <text x={(plotLeft + plotRight) / 2} y={plotBottom + 33} textAnchor="middle" className="oi-axis-label">因素相对位置</text>
              <line x1={plotLeft} y1={pointY(chart, 9.6)} x2={plotRight} y2={pointY(chart, 2.4)} stroke={chart.color} strokeWidth="2.5" strokeDasharray="5 5" opacity=".65" />
              {FACTOR_POSITIONS.map((factor, index) => {
                const x = pointX(chart, factor);
                const y = pointY(chart, chart.ranks[index]);
                const selected = index === modelIndex;
                return <g key={index}>
                  {selected && <>
                    <line x1={x} y1={plotTop} x2={x} y2={plotBottom} className="oi-selection-guide" />
                    <line x1={plotLeft} y1={y} x2={x} y2={y} className="oi-selection-guide" />
                  </>}
                  <circle cx={x} cy={y} r={selected ? 7 : 4.5} fill={selected ? '#c47719' : chart.color} opacity={selected ? 1 : .58} stroke={selected ? '#fff' : 'none'} strokeWidth="2" />
                  {selected && <text x={x} y={labelY} textAnchor="middle" className="oi-selected-label">M{index + 1}</text>}
                </g>;
              })}
              <text x={chart.x + 14} y={chart.y + chart.h - 13} className="oi-note">Wilcoxon p = {chart.p}</text>
            </g>
          );
        })}
      </svg>
      <div className="oi-correlation-readout" aria-live="polite">
        <div className="oi-readout-model"><span>当前示意模型</span><b>M{modelIndex + 1}</b><small>同一模型在两张图中同步高亮</small></div>
        {CHARTS.map((chart) => (
          <div className="oi-readout-pair" key={chart.title}>
            <span>{chart.title}</span>
            <b>因素分位 {Math.round(selectedFactor * 100)}%</b>
            <strong>名次约 {chart.ranks[modelIndex].toFixed(1)} / 10</strong>
          </div>
        ))}
      </div>
      <div className="oi-direction-note"><span>读图规则</span><b>因素增大 → 点云倾向向上 → 名次数字下降 → ρ &lt; 0</b></div>
      <div className="oi-feedback neutral"><b>负相关只描述方向：在论文的名次定义中，因素更大时模型名次往往更靠前。页面中的散点与逐点读数是机制示意；论文真实统计是逐数据集计算 Spearman ρ，再汇总其中位数，并用 Wilcoxon 检验判断跨数据集方向是否稳定。p 值不代表效应大小，也不能单独证明因果。</b></div>
    </div>
  );
};
