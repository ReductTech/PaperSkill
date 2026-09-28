import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const GROUPS = [
  { cols: [0, 1, 2, 3], label: 'group 1' },
  { cols: [4, 5, 6, 7], label: 'group 2' },
  { cols: [8, 9, 10, 11], label: 'group 3' },
];

const STEPS = [
  '量化 group 1 内的列：group 内剩余列立即更新（橙），group 之后的列只记录更新量、延迟更新（灰）。',
  'group 1 全部量化完成，统一对后面的列做一次更新（蓝），避免逐列 read+write。',
  '量化 group 2：同样 group 内立即、group 后延迟。',
  '全部 group 量化完成。',
];

// 第五章：Lazy Batch-Updates 如何缓解带宽压力。
// 信息卡片（动机/洞察） + SVG 展示 group 延迟更新机制（step-through）。
export const Ch5LazyBatch: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  // 每列在给定 step 下的状态：current / inGroup / done / deferred / batchUpdated
  const cellState = (c: number): string => {
    const g = Math.floor(c / 4);
    if (step === 0) {
      if (g === 0) return c === 0 ? 'current' : 'inGroup';
      return 'deferred';
    }
    if (step === 1) {
      if (g === 0) return 'done';
      return 'batchUpdated';
    }
    if (step === 2) {
      if (g === 0) return 'done';
      if (g === 1) return c === 4 ? 'current' : 'inGroup';
      return 'deferred';
    }
    return 'done';
  };

  return (
    <div className="ch5-lazy" data-testid="ch5-lazy" data-step={step}>
      <div className="ch5-cards">
        <div className="ch5-card motive">
          <strong>带宽瓶颈</strong>
          <span>每次量化一列都要 read+write 整个 k×k 矩阵，总 IO 量达 k³；k≥4096 时运行时间几乎被 IO 占据。</span>
        </div>
        <div className="ch5-card insight">
          <strong>关键洞察</strong>
          <span>第 i 列的量化结果只受前 i-1 列影响、不影响前面列 → 后面的列可以延迟更新。</span>
        </div>
      </div>

      <svg className="ch5-svg" viewBox="0 0 1060 210" role="img" aria-label="权重矩阵按 128 列划分 group 的延迟更新">
        <text x="530" y="34" textAnchor="middle" className="ch5-title">权重矩阵按 128 列划分 group</text>

        {/* group 边界 */}
        <line x1="318" y1="52" x2="318" y2="176" className="ch5-group-line" />
        <line x1="538" y1="52" x2="538" y2="176" className="ch5-group-line" />

        {GROUPS.map((g) => (
          <text key={g.label} x={100 + Math.floor(g.cols[0] / 4) * 220 + 110} y="192" textAnchor="middle" className="ch5-group-label">
            {g.label}
          </text>
        ))}

        {Array.from({ length: 12 }).map((_, c) => {
          const x = 100 + c * 55;
          const st = cellState(c);
          let fill = '#e8eee0';
          let stroke = '#d7deea';
          if (st === 'current') {
            fill = '#ffffff';
            stroke = '#21324a';
          } else if (st === 'inGroup') {
            fill = '#f07e47';
            stroke = '#d97706';
          } else if (st === 'done') {
            fill = '#228d5c';
            stroke = '#228d5c';
          } else if (st === 'deferred') {
            fill = '#e8eee0';
            stroke = '#b8c9a7';
          } else if (st === 'batchUpdated') {
            fill = '#27446e';
            stroke = '#27446e';
          }
          return (
            <g key={c}>
              <rect x={x} y="80" width="47" height="47" rx="6" fill={fill} stroke={stroke} strokeWidth={st === 'current' ? 3 : 1.5} />
              <text x={x + 23.5} y="103" textAnchor="middle" className="ch5-cell-label" fill={st === 'done' || st === 'inGroup' || st === 'batchUpdated' ? '#ffffff' : '#21324a'}>列{c + 1}</text>
            </g>
          );
        })}

        <text x="210" y="66" textAnchor="middle" className="ch5-legend">group 内：立即更新</text>
        <text x="650" y="66" textAnchor="middle" className="ch5-legend-deferred">group 后：只记录，延迟更新</text>
      </svg>

      <div className="ctrl">
        <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>上一步</button>
        <span className="val">{step + 1} / {STEPS.length}</span>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>下一步</button>
      </div>
      <div className="feedback">{STEPS[step]}</div>

      <p className="ch5-conclusion">
        <strong>结论：</strong>Lazy Batch-Updates 不减少实际计算量，但将频繁的小块读写聚合为大块读写，有效缓解内存带宽瓶颈。
      </p>
    </div>
  );
};

export default Ch5LazyBatch;
