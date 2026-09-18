import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Stage = {
  title: string;
  badge: string;
  headline: string;
  detail: string;
};

const stages: Stage[] = [
  {
    title: 'Lens-RL',
    badge: '能力参照',
    headline: '20 步 + CFG 5.0',
    detail: '后训练后的 Lens-RL 作为目标能力：逐步把潜表示推向符合提示词的结果。',
  },
  {
    title: '少步蒸馏',
    badge: '训练阶段',
    headline: '学习分布，不是删掉步骤',
    detail: '论文从 Lens-800M 中筛选约 10 万条平衡的图文数据，让少步学生匹配目标分布；方法结合 DMD2、decoupled-DMD、SenseFlow，并用 R1 稳定对抗训练。',
  },
  {
    title: 'Lens-Turbo',
    badge: '推理结果',
    headline: '4 步、无需 CFG',
    detail: '蒸馏后的生成器把推理压到 4 步；论文报告它大体保留原模型的图像质量和提示词遵循能力。',
  },
];

export const TurboDistillation: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const current = stages[stage];

  return (
    <div className="lens-widget lens-turbo-widget">
      <div className="lens-widget-kicker">Turbo 的核心：用蒸馏换取更少的采样步骤</div>
      <p className="lens-widget-instruction">依次点击三个阶段，观察“原模型能力 → 蒸馏训练 → 4 步生成”如何衔接。Turbo 不是简单跳过 16 步，而是重新训练一个少步生成器。</p>
      <div className="lens-turbo-path" role="group" aria-label="Lens-Turbo 蒸馏流程">
        {stages.map((item, index) => (
          <React.Fragment key={item.title}>
            {index > 0 ? <span className="lens-turbo-arrow" aria-hidden="true">→</span> : null}
            <button
              type="button"
              className={`lens-turbo-stage ${stage === index ? 'is-active' : ''}`}
              onClick={() => setStage(index)}
              aria-pressed={stage === index}
            >
              <span className="lens-turbo-index">{index + 1}</span>
              <strong>{item.title}</strong>
              <small>{item.badge}</small>
            </button>
          </React.Fragment>
        ))}
      </div>
      <div className={`lens-turbo-detail stage-${stage}`} aria-live="polite">
        <div className="lens-turbo-detail-head">
          <span>{current.badge}</span>
          <h5>{current.title}</h5>
        </div>
        <strong>{current.headline}</strong>
        <p>{current.detail}</p>
        {stage === 1 ? (
          <div className="lens-turbo-roles">
            <span><b>冻结教师网络</b>提供目标方向</span>
            <span><b>学生生成器</b>学习少步分布</span>
            <span><b>真实图像</b>帮助判别器校准</span>
          </div>
        ) : null}
        {stage === 2 ? (
          <div className="lens-turbo-speedline"><span>Lens：20 步 · 3.15 秒</span><b>→</b><span>Turbo：4 步 · 0.84 秒</span></div>
        ) : null}
      </div>
      <div className="feedback good">
        {stage === 0 ? '先保留完整模型的能力作为参照，再训练少步版本。' : stage === 1 ? '蒸馏训练让学生模型直接学习目标分布与提示词能力，而不是在推理时临时跳步。' : '结果是更快的 4 步生成；质量比较要看下一模块的同一指标和同一测试条件。'}
      </div>
      <p className="lens-widget-source">依据：论文第 2.4 节、附录 D.2 与第 2.5 节。蒸馏细节为论文方法的简化示意。</p>
    </div>
  );
};
