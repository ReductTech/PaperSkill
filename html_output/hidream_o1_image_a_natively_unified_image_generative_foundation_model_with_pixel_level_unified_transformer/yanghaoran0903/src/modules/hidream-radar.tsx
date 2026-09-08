import React, { useState } from 'react';
import type { WidgetProps } from './registry';

interface RadarSeries {
  name: string;
  color: string;
  values: number[];
  overall: string;
  params: string;
}

interface RadarChartProps extends WidgetProps {
  series?: RadarSeries[];
}

const RADAR_LABELS = ['Single-Obj', 'Two-Obj', 'Count', 'Color', 'Position', 'Attr', 'Overall'];
const DEFAULT_RADAR: RadarSeries[] = [
  { name: 'HiDream-O1-Image', color: '#4cc9f0', values: [100, 99, 79, 89, 93, 78, 90], overall: '0.90', params: '8B' },
  { name: 'HiDream-O1-Image-Pro', color: '#f72585', values: [100, 99, 85, 94, 94, 79, 92], overall: '0.92', params: '200B+' },
  { name: 'Qwen-Image', color: '#2ecc71', values: [99, 92, 89, 88, 76, 77, 87], overall: '0.87', params: '27B' },
  { name: 'FLUX.2 [Dev]', color: '#ffb703', values: [100, 99, 79, 93, 73, 78, 87], overall: '0.87', params: '56B' },
];

function Frame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="hd-widget reveal-on-scroll">
      <header className="hd-widget-head">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>
      <div className="hd-widget-body">{children}</div>
    </section>
  );
}

export default function PerformanceRadarChart({ series = DEFAULT_RADAR }: RadarChartProps) {
  const [hoverDim, setHoverDim] = useState<number | null>(null);
  const [hoverModel, setHoverModel] = useState<string | null>(null);
  const size = 360;
  const center = size / 2;
  const radius = 126;
  const pointsFor = (values: number[]) => values.map((value, index) => {
    const angle = -Math.PI / 2 + (index / RADAR_LABELS.length) * Math.PI * 2;
    const r = (value / 100) * radius;
    return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
  }).join(' ');
  const hoverValues = hoverDim === null ? null : series.map((item) => ({ name: item.name, value: item.values[hoverDim], color: item.color }));

  return (
    <Frame title="性能对比雷达图" subtitle="移动端自动切换为垂直柱状图；重点看8B模型打败27B模型的参数效率故事。">
      <div className="hd-radar-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} className="hd-radar" role="img" aria-label="GenEval雷达图">
          <title>GenEval performance radar</title>
          <desc>HiDream-O1-Image 8B Overall 0.90，高于Qwen-Image 27B和FLUX.2 Dev 56B的0.87。</desc>
          <circle cx={center} cy={center} r={radius} className="hd-radar-bg" />
          {Array.from({ length: 4 }, (_, ring) => <circle key={ring} cx={center} cy={center} r={((ring + 1) / 4) * radius} className="hd-radar-ring" />)}
          {RADAR_LABELS.map((label, index) => {
            const angle = -Math.PI / 2 + (index / RADAR_LABELS.length) * Math.PI * 2;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            const labelX = center + Math.cos(angle) * (radius + 24);
            const labelY = center + Math.sin(angle) * (radius + 24);
            return (
              <g key={label}>
                <line x1={center} y1={center} x2={x} y2={y} className="hd-radar-axis" />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`hd-radar-label ${hoverDim === index ? 'active' : ''}`}
                  onMouseEnter={() => setHoverDim(index)}
                  onMouseLeave={() => setHoverDim(null)}
                >
                  {label}
                </text>
              </g>
            );
          })}
          {series.map((item) => {
            const visible = hoverModel === null || hoverModel === item.name;
            return (
              <g key={item.name} opacity={visible ? 1 : 0.25} onMouseEnter={() => setHoverModel(item.name)} onMouseLeave={() => setHoverModel(null)}>
                <polygon points={pointsFor(item.values)} fill={`${item.color}2b`} stroke={item.color} strokeWidth={hoverModel === item.name ? 3 : 2} />
                {item.values.map((value, index) => {
                  const angle = -Math.PI / 2 + (index / RADAR_LABELS.length) * Math.PI * 2;
                  const r = (value / 100) * radius;
                  return <circle key={`${item.name}-${index}`} cx={center + Math.cos(angle) * r} cy={center + Math.sin(angle) * r} r={4} fill={item.color} />;
                })}
              </g>
            );
          })}
        </svg>

        <div className="hd-radar-side">
          {series.map((item) => (
            <button key={item.name} className="hd-legend" onMouseEnter={() => setHoverModel(item.name)} onMouseLeave={() => setHoverModel(null)}>
              <span className="hd-legend-swatch" style={{ background: item.color }} />
              <span>{item.name} · {item.params} · Overall {item.overall}</span>
            </button>
          ))}
          <div className="hd-tooltip">
            <strong>关键故事点</strong>
            <div>HiDream-O1-Image 8B：Overall 0.90</div>
            <div>Qwen-Image 27B：Overall 0.87</div>
            <div>FLUX.2 [Dev] 56B：Overall 0.87</div>
          </div>
          {hoverValues && hoverDim !== null ? (
            <div className="hd-tooltip"><strong>{RADAR_LABELS[hoverDim]}</strong>{hoverValues.map((item) => <div key={item.name} style={{ color: item.color }}>{item.name}: {item.value}</div>)}</div>
          ) : (
            <div className="hd-tooltip">悬停维度或模型查看具体数值。</div>
          )}
        </div>
      </div>

      <div className="hd-mobile-bars" aria-label="移动端GenEval柱状图">
        {RADAR_LABELS.map((label, index) => (
          <div key={label} className="hd-mobile-bar-group">
            <strong>{label}</strong>
            {series.map((item) => (
              <div key={`${label}-${item.name}`} className="hd-mobile-bar-row">
                <span>{item.name}</span>
                <div className="hd-mobile-bar-track"><i style={{ width: `${item.values[index]}%`, background: item.color }} /></div>
                <em>{item.values[index]}</em>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}
