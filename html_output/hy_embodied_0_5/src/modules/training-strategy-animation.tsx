import React from 'react';
import type { WidgetProps } from './registry';

export const TrainingStrategyAnimation: React.FC<WidgetProps> = () => (
  <div className="training-strategy" role="img" aria-label="训练流程依次点亮 Cold-start SFT、RL GRPO 探索、RFT 筛选固化和 On-Policy Distillation，最后得到 MoT-2B。">
    <div className="training-flow">
      <div className="training-stage sft">
        <span>01</span>
        <b>Cold-start SFT</b>
        <small>高质量 CoT 建立推理起点</small>
      </div>
      <i className="training-arrow">→</i>
      <div className="training-cycle">
        <div className="training-cycle-label">能力边界自演化</div>
        <div className="training-stage rl">
          <span>02</span>
          <b>RL · GRPO</b>
          <small>在部分成功样本上探索</small>
        </div>
        <i className="training-loop">⇄</i>
        <div className="training-stage rft">
          <span>03</span>
          <b>RFT</b>
          <small>筛选成功轨迹并监督固化</small>
        </div>
      </div>
      <i className="training-arrow">→</i>
      <div className="training-stage opd">
        <span>04</span>
        <b>OPD · 大 → 小</b>
        <small>沿学生状态迁移到 MoT-2B</small>
      </div>
    </div>
    <div className="training-result"><b>偶发成功</b><span>→</span><b>稳定能力</b><span>→</span><b>端侧部署</b></div>
    <div className="training-two-lines">
      <p>训练先用 Cold-start SFT 建立推理起点，再让 RL 在能力边界上探索、RFT 把偶发成功固化为稳定能力。</p>
      <p>最后 OPD 沿学生自己生成的状态，把大模型的推理能力迁移到可部署的 MoT-2B。</p>
    </div>
  </div>
);

export default TrainingStrategyAnimation;
