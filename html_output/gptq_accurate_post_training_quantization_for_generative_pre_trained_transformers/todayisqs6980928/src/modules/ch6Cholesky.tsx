import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const MAT = [
  [5, 4, 3, 2],
  [4, 5, 4, 3],
  [3, 4, 5, 4],
  [2, 3, 4, 5],
];

const STEPS = [
  'H：对称正定矩阵。反复套用更新公式求逆会累积数值误差，使 H⁻¹ 失去正定性。',
  'Cholesky 分解 H = L·Lᵀ：一次性得到下三角 L（蓝色），数值稳定。',
  '回代求解：用 L 快速求解，无需对海森矩阵逐列更新，进一步减少计算量。',
];

// 第六章：Cholesky 分解。信息卡片（动机/洞察）+ SVG 逐步分解（H → L → 回代）。
export const Ch6Cholesky: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  return (
    <div className="ch6-page" data-testid="ch6-cholesky" data-step={step}>
      <div className="ch6-cards">
        <div className="ch6-card motive">
          <strong>数值不稳定</strong>
          <span>反复套用更新公式累积数值误差，使 H⁻¹ 失去正定性，算法沿错误方向大幅更新，整层量化失效。</span>
        </div>
        <div className="ch6-card insight">
          <strong>关键洞察</strong>
          <span>量化权重 q 时仅需 H⁻¹ 的第 q 行；对对称 H⁻¹ 的删行操作本质上等价于 Cholesky 分解。</span>
        </div>
      </div>

      <svg className="ch6-svg" viewBox="0 0 1060 330" role="img" aria-label="Cholesky 分解过程">
        <text x="530" y="40" textAnchor="middle" className="ch6-title">
          {step === 0 ? 'H（对称正定矩阵）' : step === 1 ? 'Cholesky 分解 H = L·Lᵀ' : '下三角回代求解'}
        </text>

        {MAT.map((row, r) =>
          row.map((v, c) => {
            const x = 380 + c * 66;
            const y = 66 + r * 66;
            const lower = c <= r;
            let fill = '#e8eee0';
            let textFill = '#21324a';
            let label = String(v);
            let stroke = '#d7deea';
            if (step === 1) {
              if (lower) {
                fill = c === r ? '#27446e' : '#5b7bb0';
                textFill = '#ffffff';
                stroke = '#27446e';
              } else {
                fill = '#f5f8f0';
                label = '';
                stroke = '#d7deea';
              }
            } else if (step === 2) {
              if (lower) {
                fill = '#228d5c';
                textFill = '#ffffff';
                label = '✓';
                stroke = '#228d5c';
              } else {
                fill = '#f5f8f0';
                label = '';
                stroke = '#d7deea';
              }
            }
            return (
              <g key={`${r}${c}`}>
                <rect x={x} y={y} width="58" height="58" rx="6" fill={fill} stroke={stroke} strokeWidth="1.5" />
                <text x={x + 29} y={y + 34} textAnchor="middle" className="ch6-cell" fill={textFill}>{label}</text>
              </g>
            );
          })
        )}

        <text x="380" y="360" textAnchor="start" className="ch6-note">下三角部分为 L 的非零元；上三角为零。</text>
      </svg>

      <div className="ctrl">
        <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>上一步</button>
        <span className="val">{step + 1} / {STEPS.length}</span>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>下一步</button>
      </div>
      <div className="feedback">{STEPS[step]}</div>

      <p className="ch6-conclusion">
        <strong>结论：</strong>Cholesky 分解借助成熟 kernel 一次性预计算下三角 L，辅以轻度 dampening（λ=对角均值的 1%），既保证数值稳定，又无需逐列更新海森矩阵，进一步减少计算量。
      </p>
    </div>
  );
};

export default Ch6Cholesky;
