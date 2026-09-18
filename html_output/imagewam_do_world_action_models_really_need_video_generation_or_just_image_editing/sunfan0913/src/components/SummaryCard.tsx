import React from 'react';

const takeaways = [
  {
    icon: '🧠',
    title: '把未来建模为变化，而不是完整视频',
    text: 'ImageWAM 探索用图像编辑先验聚焦当前状态到目标状态的动作相关变化。',
  },
  {
    icon: '⚡',
    title: '编辑缓存足以承载动作上下文',
    text: '去噪过程产生的 KV cache 可作为紧凑的世界-动作上下文，再交给动作专家推理。',
  },
  {
    icon: '🎯',
    title: '效率收益必须结合实验协议理解',
    text: '论文摘要报告在相应实验对比下约 1/6 FLOPs、约 1/4 延迟；这些数字不应脱离任务与硬件泛化。',
  },
];

export function SummaryCard() {
  return (
    <section className="summary-card" aria-labelledby="summary-title">
      <div className="summary-eyebrow">快速复盘 · Key Takeaways</div>
      <h2 id="summary-title">读完 ImageWAM，记住这三件事</h2>
      <p className="summary-lead">
        论文的核心贡献不是声称视频生成永远没有价值，而是展示一种更贴近动作决策的图像编辑式世界-动作建模路径。
      </p>
      <div className="summary-grid">
        {takeaways.map((item, index) => (
          <article className="summary-item" key={item.title}>
            <div className="summary-number">0{index + 1}</div>
            <div className="summary-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
