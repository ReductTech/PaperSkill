import { useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, fmt, Slider, Feedback } from './aqKit';
import { SymbolHint } from '../components/SymbolHint';

export function GradualMask(_props: WidgetProps) {
  const [epoch, setEpoch] = useState(1);
  const [alpha, setAlpha] = useState(0.5);
  const total = 20;
  const h = 12;
  const width = clamp(Math.round((epoch / total) * h), 1, h);
  const off = Math.min(2 * width, h - 1);
  const dominant = off * alpha < 1;

  const cellSize = 30;
  const gap = 2;
  const size = h * cellSize + (h - 1) * gap;

  const tone = width <= 2 ? 'blue' : dominant ? 'green' : 'red';
  const feedback = width <= 2
    ? '刚开始：只有对角活跃，训练保守'
    : dominant
      ? '逐带解冻，对角依然占优，可逆保持'
      : '非对角过大、对角不再占优，训练会崩溃';

  return (
    <div className="aq-layout aq-two">
      <div className="aq-panel grow" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${size + 60} ${size + 24}`} width={size + 60} height={size + 24} role="img"
          aria-label={`渐进掩码，带宽 ${width}，稳定因子 ${fmt(alpha)}`}>
          <g transform="translate(46 12)">
            {Array.from({ length: h }).map((_, i) => Array.from({ length: h }).map((__, j) => {
              const d = Math.abs(i - j);
              let fill = '#eef2f7';
              let label = '·';
              let c = '#9aa7ba';
              if (i === j) { fill = '#228d5c'; label = '1'; c = '#ffffff'; }
              else if (d > 0 && d <= width) { fill = alpha > 0.55 ? '#f07e47' : '#f7c29a'; label = 'α'; c = '#7a3311'; }
              return (
                <g key={`${i}-${j}`}>
                  <rect x={j * (cellSize + gap)} y={i * (cellSize + gap)} width={cellSize} height={cellSize} rx={3} fill={fill} />
                  <text x={j * (cellSize + gap) + cellSize / 2} y={i * (cellSize + gap) + cellSize / 2 + 1}
                    textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" fill={c}>{label}</text>
                </g>
              );
            }))}
          </g>
        </svg>
        <div className="aq-legend" style={{ marginTop: 6 }}>
          <span><i className="aq-dot" style={{ background: '#228d5c' }} />对角 = 1</span>
          <span><i className="aq-dot" style={{ background: '#f7c29a' }} />带内 = α</span>
          <span><i className="aq-dot" style={{ background: '#eef2f7' }} />带外 = 0</span>
        </div>
      </div>
      <div className="aq-panel">
        <div className="aq-heading">渐进掩码 GM</div>
        <Slider label="训练进度" value={epoch} min={1} max={total} step={1} onChange={setEpoch} />
        <Slider label="稳定因子 α" value={alpha} min={0} max={1} step={0.01} onChange={setAlpha} />
        <p className="aq-formula">
          <SymbolHint meaning="GM：渐进掩码，随训练逐步放宽。">GM</SymbolHint><sub>ij</sub> = 1(i=j)；α(0&lt;|i−j|≤(e/t)·h)；0(否则)
        </p>
        <p className="aq-body muted">带宽 = {fmt(width)}，带内幅度 = α = {fmt(alpha)}。</p>
        <Feedback tone={tone}>{feedback}</Feedback>
        <p className="aq-note"><b>h=12</b> 为示意，非真实 hidden size。</p>
      </div>
    </div>
  );
}