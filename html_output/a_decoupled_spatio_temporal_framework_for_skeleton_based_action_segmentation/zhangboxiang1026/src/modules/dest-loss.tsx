// Refinement 2026-10-22. Loss components follow §3.4, Eqs. 10–12; no ambiguous Eq. 11 sign is reconstructed.
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
const steps = [
  { title: '先回答：每帧在做什么', equation: '类别预测 → L_ce', detail: '交叉熵把每一帧的预测类别拉向真实类别。它看逐帧答案，但一个很短的错误类别也可能把完整动作切碎。' },
  { title: '再处理：同一动作被切得太碎', equation: 'L_asb = L_ce + L_gs-tmse', detail: 'Gaussian similarity-weighted TMSE（高斯相似度加权截断均方误差）约束相邻帧类别概率的变化，用于抑制过分割。需要在同一动作内保持稳定，又保留真实动作切换；不是把所有帧都抹成相同类别。' },
  { title: '补上：动作在哪里切换', equation: 'L = L_asb + γ L_brb', detail: '另一个分支学习边界分数。真实动作边界为正样本，其余帧为负样本；论文使用正样本加权的二元逻辑回归损失，缓解边界帧较少的问题。默认 γ=0.1。' },
];
export const DestLoss: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  return <div className="dest-refined">
    <ol className="dest-objective-list">{steps.map((item, i) => <li key={item.title} className={i <= step ? 'is-revealed' : ''}>
      <span className="dest-objective-index">0{i + 1}</span><div><strong>{item.title}</strong><span>{i <= step ? item.equation : '展开后查看这一项怎样补充监督'}</span></div>
    </li>)}</ol>
    <div className="step-ctrl"><button className="chip" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>上一步</button><span className="val">步骤 {step + 1} / 3</span><button className="chip" onClick={() => setStep(s => Math.min(2, s + 1))} disabled={step === 2}>{step === 2 ? '已完成' : '下一步'}</button></div>
    <div className="dest-equation" aria-live="polite">{steps[step].equation}</div>
    <div className="feedback" aria-live="polite">{steps[step].detail}</div>
    <p className="module-note">来源：§3.4、式（10）–（12）。这里展开的是训练目标，不是实际训练过程或损失下降曲线。</p>
  </div>;
};
