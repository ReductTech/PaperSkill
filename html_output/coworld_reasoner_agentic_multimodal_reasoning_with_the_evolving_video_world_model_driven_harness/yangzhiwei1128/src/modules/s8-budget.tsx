import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp } from './sceneKit';

const STAGES = [
  { name: '① 能力边界评估', base: 50, span: 14, k: 0.9 },
  { name: '② 请求 VWM 协助', base: 44, span: 22, k: 0.7 },
  { name: '③ 视频解读', base: 56, span: 12, k: 1.1 },
  { name: '④ 证据整合', base: 47, span: 17, k: 0.8 },
];

const valueAt = (stage: typeof STAGES[number], budget: number) => stage.base + stage.span * (1 - Math.exp(-budget / stage.k));

export function S8Budget(_props: WidgetProps) {
  const [budget, setBudget] = useState(2);
  const width = 300;
  const height = 120;
  const points = (stage: typeof STAGES[number]) =>
    Array.from({ length: 21 }, (_, index) => {
      const b = (index / 20) * 5;
      const x = 12 + (b / 5) * (width - 24);
      const y = height - 14 - ((valueAt(stage, b) - 40) / 30) * (height - 28);
      return `${x.toFixed(1)},${clamp(y, 8, height - 8).toFixed(1)}`;
    }).join(' ');
  const saturated = budget >= 3;
  return (
    <div className="ps-page s8-page">
      <div className="ps-dial">
        <span className="ps-dial-label">每阶段修订预算 B</span>
        <strong className="ps-dial-value">{budget}</strong>
        <input type="range" min="0" max="5" step="1" value={budget} aria-label="每阶段修订预算"
          onChange={event => setBudget(Number(event.target.value))} />
        <div className="ps-dial-meta">3 轮共演化 × 每阶段 ≤ 5 次修订</div>
        <div className={`ps-dial-state ${saturated ? 'is-warn' : ''}`}>
          {budget === 0 ? '不修订：四阶段都停在初始骨架。' : saturated ? '曲线走平阶段会提前停止。' : '还在涨，继续加预算有意义。'}
        </div>
      </div>
      <div className="ps-curves">
        <div className="ps-panel-head">阶段通过率随修订次数变化（示意）</div>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="四个阶段的通过率曲线随修订预算上升并趋于饱和">
          <path d={`M12 ${height - 14} H${width - 12} M12 8 V${height - 14}`} stroke="#d7deea" strokeWidth="2" fill="none" />
          {STAGES.map((stage, index) => (
            <polyline key={stage.name} points={points(stage)} fill="none"
              stroke={['#27446e', '#228d5c', '#7c3aed', '#f07e47'][index]} strokeWidth="4" strokeLinecap="round" />
          ))}
          <line x1={12 + (budget / 5) * (width - 24)} y1="8" x2={12 + (budget / 5) * (width - 24)} y2={height - 14} stroke="#c43f52" strokeDasharray="6 6" strokeWidth="2" />
        </svg>
        <div className="ps-legend">
          {STAGES.map((stage, index) => (
            <span key={stage.name}><i style={{ background: ['#27446e', '#228d5c', '#7c3aed', '#f07e47'][index] }} />{stage.name}</span>
          ))}
        </div>
        <p className="ps-note-small">横轴为修订次数 0–5，纵轴为通过率；曲线为教学示意，B=5 与 3 轮取自论文设置。</p>
      </div>
    </div>
  );
}
