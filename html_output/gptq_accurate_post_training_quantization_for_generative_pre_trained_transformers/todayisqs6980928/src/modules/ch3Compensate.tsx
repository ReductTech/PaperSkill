import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STEPS = [
  '量化 w₁：产生量化误差 Δw。RTN 会直接丢弃这个误差。',
  'GPTQ 的补偿：把 Δw 按 Hessian 方向分摊给同层尚未量化的权重（w₂–w₅）。',
  '结果：层输出近似不变，误差被吸收，而非累积到下一层。',
];

// 权重块布局：5 个块，宽 96，高 50，块中心 x 见 WEIGHTS。
const WEIGHTS = [
  { label: 'w₁', cx: 270 },
  { label: 'w₂', cx: 400 },
  { label: 'w₃', cx: 530 },
  { label: 'w₄', cx: 660 },
  { label: 'w₅', cx: 790 },
];
const BW = 96;
const BH = 50;
const TOP = 80; // 块顶 y
const BOTTOM = TOP + BH; // 块底 y = 130
const STEM_Y = 164; // 补偿主干水平线

// 第三章：误差补偿机制。克制配色（蓝=当前、绿=本文方法、红=旧方法丢弃）。
export const Ch3Compensate: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);

  const cellStyle = (idx: number): { fill: string; stroke: string; strokeW: number; text: string } => {
    if (step === 0) {
      if (idx === 0) return { fill: '#27446e', stroke: '#27446e', strokeW: 2, text: '#ffffff' };
      return { fill: '#f0f4ec', stroke: '#cbd5e1', strokeW: 1.5, text: '#21324a' };
    }
    if (idx === 0) return { fill: '#228d5c', stroke: '#228d5c', strokeW: 1.5, text: '#ffffff' };
    return { fill: '#e6f2ec', stroke: '#2f9e6a', strokeW: 1.5, text: '#1f5c3d' };
  };

  return (
    <div className="ch3-page" data-testid="ch3-compensate" data-step={step}>
      <div className="ch3-cards">
        <div className="ch3-card motive">
          <strong>RTN 的缺陷</strong>
          <span>逐权重独立舍入，量化误差被直接丢弃，在层间逐级累积。</span>
        </div>
        <div className="ch3-card insight">
          <strong>核心洞察</strong>
          <span>量化某一权重产生的误差，可由同层未量化权重按 Hessian 方向吸收，保持层输出近似不变。</span>
        </div>
      </div>

      <svg className="ch3-svg" viewBox="0 0 1060 300" role="img" aria-label="误差补偿机制">
        <text x="530" y="40" textAnchor="middle" className="ch3-title">同层权重行的量化与误差补偿</text>

        {/* 权重行 */}
        {WEIGHTS.map((w, i) => {
          const s = cellStyle(i);
          return (
            <g key={w.label}>
              <rect x={w.cx - BW / 2} y={TOP} width={BW} height={BH} rx="8" fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeW} />
              <text x={w.cx} y={TOP + BH / 2 + 5} textAnchor="middle" className="ch3-cell" fill={s.text}>{w.label}</text>
            </g>
          );
        })}

        {/* step 0：误差被丢弃（红色向下箭头） */}
        {step === 0 && (
          <g className="ch3-err-flow">
            <path d={`M${WEIGHTS[0].cx} ${BOTTOM} L${WEIGHTS[0].cx} 192`} className="ch3-err-arrow" markerEnd="url(#ch3ArrowRed)" />
            <text x={WEIGHTS[0].cx + 16} y="170" textAnchor="start" className="ch3-err-label">量化误差 Δw（被丢弃）</text>
          </g>
        )}

        {/* step 1+：补偿主干 + 分支（绿色） */}
        {step >= 1 && (
          <g className="ch3-comp-flow">
            <path d={`M${WEIGHTS[0].cx} ${BOTTOM} L${WEIGHTS[0].cx} ${STEM_Y} L${WEIGHTS[4].cx} ${STEM_Y}`} className="ch3-comp-stem" />
            {[1, 2, 3, 4].map((i) => (
              <path key={i} d={`M${WEIGHTS[i].cx} ${STEM_Y} L${WEIGHTS[i].cx} ${BOTTOM - 6}`} className="ch3-comp-branch" markerEnd="url(#ch3ArrowGreen)" />
            ))}
            <text x="530" y={STEM_Y + 20} textAnchor="middle" className="ch3-comp-label">按 Hessian 方向补偿给剩余权重</text>
          </g>
        )}

        {/* step 2：输出对比 */}
        {step === 2 && (
          <g className="ch3-output-compare">
            <rect x="150" y="250" width="340" height="30" rx="6" className="ch3-out-rtn" />
            <text x="320" y="270" textAnchor="middle" className="ch3-out-label">RTN：输出偏差累积</text>
            <rect x="570" y="250" width="340" height="30" rx="6" className="ch3-out-gptq" />
            <text x="740" y="270" textAnchor="middle" className="ch3-out-label">GPTQ：输出近似不变</text>
          </g>
        )}

        <defs>
          <marker id="ch3ArrowRed" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#c43f52" />
          </marker>
          <marker id="ch3ArrowGreen" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#228d5c" />
          </marker>
        </defs>
      </svg>

      <div className="ctrl">
        <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>上一步</button>
        <span className="val">{step + 1} / {STEPS.length}</span>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>下一步</button>
      </div>
      <div className="feedback">{STEPS[step]}</div>

      <p className="ch3-conclusion">
        <strong>结论：</strong>整网量化被分解为逐层重建（最小化 ‖WX−ŴX‖²）；量化某一权重后，立即由同层未量化权重补偿其误差，使层输出近似不变。
      </p>
    </div>
  );
};

export default Ch3Compensate;
