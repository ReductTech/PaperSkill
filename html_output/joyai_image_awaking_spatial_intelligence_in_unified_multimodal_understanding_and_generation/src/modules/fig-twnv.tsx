import React from 'react';

export function FigTwnv() {
  return (
    <div className="figure-evidence twnv-evidence">
      <div className="twnv-paper-crop">
        <img src="/images/fig-twnv.png" alt="论文 Figure 13：Thinking with Novel Views 三阶段流程" />
      </div>
      <div className="evidence-legend">
        <div className="legend-title">论文原图 · Figure 13：TwNV 三阶段流程</div>
        <div className="legend-note">
          给定输入图像 I₀ 与空间问题 Q：<strong>Planner</strong> 输出 6-DOF 相机运动指令 → <strong>Synthesizer</strong> 渲染目标新视角 I₁ → <strong>Reasoner</strong> 联合 &#123;I₀, I₁&#125; 推理作答。
        </div>
      </div>
      <div className="twnv-stage-flow">
        <div className="tsf-node planner">
          <div className="tsf-step">1</div>
          <div className="tsf-name">Planner</div>
          <div className="tsf-desc">6-DOF 相机运动规划</div>
        </div>
        <div className="tsf-arrow">→</div>
        <div className="tsf-node synth">
          <div className="tsf-step">2</div>
          <div className="tsf-name">Synthesizer</div>
          <div className="tsf-desc">新视角合成</div>
        </div>
        <div className="tsf-arrow">→</div>
        <div className="tsf-node reasoner">
          <div className="tsf-step">3</div>
          <div className="tsf-name">Reasoner</div>
          <div className="tsf-desc">联合视角推理</div>
        </div>
      </div>
    </div>
  );
}
