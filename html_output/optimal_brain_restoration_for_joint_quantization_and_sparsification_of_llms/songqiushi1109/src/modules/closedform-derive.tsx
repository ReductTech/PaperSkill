import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { SegButton, Feedback } from './obrKit';
import { SymbolHint } from '../components/SymbolHint';

// ch5：闭式解。二阶泰勒 → 行解耦 → 从 E 到 R 的闭式补偿，无需梯度下降。
const STEPS = [
  { id: 0, label: '二阶泰勒展开' },
  { id: 1, label: '行解耦近似' },
  { id: 2, label: '闭式解 Δw*_R' },
];
const TIPS = [
  '把压缩对下游 loss 的扰动做二阶泰勒展开：一阶梯度项 + ½ 二次型 Hessian 项。',
  '假设权重各行之间近似解耦，H 退化成块对角，每行可独立求解，避免对整块 Hessian 求逆。',
  '分组 R/E 后得到从 E 到 R 的闭式补偿，无需任何梯度下降迭代，和 GPTQ/SparseGPT 同源。',
];

export function ClosedFormDerive(_props: WidgetProps) {
  const [step, setStep] = useState(2);
  return (
    <div className="obr-layout obr-two">
      <div className="obr-panel">
        <div className="obr-heading">二阶展开 → 行解耦 → 闭式解</div>
        <div className="obr-formula-box">
          {step === 0 && (
            <span className="obr-formula">
              <SymbolHint meaning="ΔL：压缩造成的 loss 扰动。">Δ<i>L</i></SymbolHint>
              {' ≈ '}
              <SymbolHint meaning="∇L：loss 对权重的梯度。">⟨∇<i>L</i>, Δ<i>W</i>⟩</SymbolHint>
              {' + ½ '}
              <SymbolHint meaning="H：loss 对权重的 Hessian 矩阵。"><i>vec</i>(Δ<i>W</i>) <i>H</i> <i>vec</i>(Δ<i>W</i>)<sup>T</sup></SymbolHint>
            </span>
          )}
          {step === 1 && (
            <span className="obr-formula">
              <SymbolHint meaning="H 近似为块对角，每行独立。"><i>H</i> ≈ block-diag(<i>H</i><sub>1</sub>, …, <i>H</i><sub>r</sub>)</SymbolHint>
            </span>
          )}
          {step === 2 && (
            <span className="obr-formula">
              <SymbolHint meaning="从 E 到 R 的闭式补偿。">Δ<i>w</i>*<sub>R</sub> = −(<i>H</i><sub>RR</sub>)<sup>−1</sup> <i>H</i><sub>RE</sub> · <i>w</i><sub>E</sub></SymbolHint>
            </span>
          )}
        </div>
        <svg viewBox="0 0 420 300" width="420" height="300" role="img" aria-label="Hessian 矩阵示意">
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => {
              const inRR = step === 2 && r < 4 && c < 4;
              const inRE = step === 2 && r < 4 && c >= 4;
              const decoupled = step >= 1;
              const onBlock = Math.floor(r / 4) === Math.floor(c / 4);
              const off = decoupled && !onBlock;
              const fill = inRR ? '#228d5c' : inRE ? '#c43f52' : off ? '#eef1f6' : '#dbe3ef';
              const x = 24 + c * 47, y = 16 + r * 33;
              return <rect key={`${r}-${c}`} x={x} y={y} width={40} height={27} rx={5} fill={fill} stroke={off ? 'none' : '#ffffff'} />;
            })
          )}
          <text x="24" y="290" fontSize={17} fill="#68778f">
            {step === 2 ? '绿=H_RR（保留块） 红=H_RE（交叉块）' : step === 1 ? '块对角：行之间解耦' : '全量 Hessian'}
          </text>
        </svg>
        <div className="obr-note">公式与 Hessian 结构为示意；精确推导与归一化见论文 §4。</div>
      </div>
      <div className="obr-panel">
        <div className="obr-heading">推导三步</div>
        <div className="obr-steps">
          {STEPS.map((s) => (
            <button key={s.id} type="button" className={`obr-step-btn ${step === s.id ? 'is-active' : ''} tone-blue`}
              onClick={() => setStep(s.id)}>
              <span>{s.id + 1}</span><b>{s.label}</b>
            </button>
          ))}
        </div>
        <p className="obr-body">{TIPS[step]}</p>
        <Feedback tone="green">
          {step === 2
            ? '闭式解是 OBR 的核心卖点：算 Hessian + 分组补偿，无优化循环，适合复现。'
            : step === 1 ? '行解耦把大矩阵求逆变成逐行小矩阵，是工程上的关键近似。' : '二阶展开为“最优补偿”提供数学依据。'}
        </Feedback>
        <p className="obr-body muted">与 Optimal Brain 血脉同源：GPTQ 只补偿量化、SparseGPT 只补偿剪枝，OBR 用统一扰动框架同时补偿两者。</p>
      </div>
    </div>
  );
}
