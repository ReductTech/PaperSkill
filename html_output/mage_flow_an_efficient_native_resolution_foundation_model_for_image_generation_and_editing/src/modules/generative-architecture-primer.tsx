import React from 'react';
import type { WidgetProps } from './registry';

const stages = [
  { id: 'prompt', label: 'Prompt', note: '自然语言描述', detail: '用户用自然语言描述希望生成的内容、风格、构图和文字要求。' },
  { id: 'encoder', label: 'Qwen3-VL 文本编码器', note: '冻结参数', detail: 'Qwen3-VL 把 Prompt 转换为模型可处理的上下文表示；Mage-Flow 训练时冻结该编码器。' },
  { id: 'tau', label: '文本条件序列 τ', note: '变长 token 序列', detail: 'τ 保存 Prompt 的上下文信息，后续与图像 latent token 一起进入多模态注意力。' },
  { id: 'concat', label: 'τ 与当前噪声 latent zₜ 拼接', note: '同时输入时间 t', detail: '当前图像状态 zₜ、文本条件 τ 和时间 t 共同决定这一步应该如何更新。' },
  { id: 'mmdit', label: 'NR-MMDiT(zₜ, t, τ)', note: '本文的生成骨干', detail: '文本流与图像流经过模态专属投影，并在联合自注意力中交换信息。' },
  { id: 'velocity', label: '预测速度 vθ', note: '逐 latent token', detail: '模型为每个图像 latent token 预测速度，即当前状态沿生成路径应该移动的方向。' },
  { id: 'sampler', label: '采样器更新 zₜ', note: '重复若干次', detail: '采样器根据速度更新 zₜ，并把新状态再次送入 NR-MMDiT；Base、对齐版和 Turbo 的重复次数不同。' },
  { id: 'clean', label: '干净图像 latent z₀', note: '潜空间结果', detail: '完成迭代后得到接近数据端的潜变量 z₀，它已经包含图像结构，但还不是 RGB 像素。' },
  { id: 'decoder', label: 'Mage-VAE 解码', note: '一步全卷积解码', detail: 'Mage-VAE 解码器把潜变量还原到像素空间，解码成本也是本文重点优化对象。' },
  { id: 'rgb', label: 'RGB 图像', note: '最终输出', detail: '最终得到可显示、保存和继续编辑的 RGB 图像。' },
] as const;

export function GenerativeArchitecturePrimer(_: WidgetProps) {
  return (
    <div className="generation-primer">
      <div className="generation-flow" aria-label="从 Prompt 到 RGB 图像的生成流程">
        {stages.map((item, index) => (
          <div className={`generation-flow-step is-${item.id}`} key={item.id}>
            <div className="generation-flow-node">
              <span>{index + 1}</span>
              <strong>{item.label}</strong>
              <small>{item.note}</small>
            </div>
            {item.id === 'sampler' ? <span className="generation-loop">↺ 更新后返回 zₜ，重复若干次</span> : null}
            {index < stages.length - 1 ? <span className="generation-flow-arrow" aria-hidden="true">↓</span> : null}
          </div>
        ))}
      </div>
      <aside className="generation-detail">
        <span>完整链路</span>
        <h5>条件编码 → 速度预测 → 像素解码</h5>
        <p>Qwen3-VL 提供文本条件，NR-MMDiT 在潜空间中反复预测速度，Mage-VAE 最后一次解码得到 RGB 图像。</p>
        <div className="generation-equation">
          <b>核心调用</b>
          <code>vθ = NR-MMDiT(zₜ, t, τ)</code>
          <small>采样器用 vθ 更新 zₜ，最终得到 z₀。</small>
        </div>
        <div className="generation-legend">
          <span><i className="is-condition" />条件</span>
          <span><i className="is-latent" />潜变量</span>
          <span><i className="is-model" />模型计算</span>
          <span><i className="is-output" />输出</span>
        </div>
      </aside>
      <div className="feedback good generation-summary">
        Prompt 决定生成条件，NR-MMDiT 反复预测 latent token 的速度，Mage-VAE 最后把 z₀ 解码为 RGB 图像。
      </div>
    </div>
  );
}
