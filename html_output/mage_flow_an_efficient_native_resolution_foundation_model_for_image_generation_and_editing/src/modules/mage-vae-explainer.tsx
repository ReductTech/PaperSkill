import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export const VaeBottleneckLab: React.FC<WidgetProps> = () => {
  const [steps, setSteps] = useState<4 | 30>(4);
  const backbone = steps === 4 ? 86 : 98;
  const vae = steps === 4 ? 14 : 2;
  return (
    <div className="vae-story-card">
      <div className="ctrl" role="group" aria-label="切换扩散采样步数">
        <button type="button" className={`chip ${steps === 30 ? 'active' : ''}`} onClick={() => setSteps(30)}>传统多步 · 30 步</button>
        <button type="button" className={`chip ${steps === 4 ? 'active' : ''}`} onClick={() => setSteps(4)}>少步模型 · 4 步</button>
      </div>
      <div className="runtime-stack" aria-label={`示意占比：扩散主干 ${backbone}%，VAE ${vae}%`}>
        <div className="runtime-backbone" style={{ width: `${backbone}%` }}>DiT × {steps}</div>
        <div className="runtime-vae" style={{ width: `${vae}%` }}>VAE {vae}%</div>
      </div>
      <p className="module-note">
        {steps === 4
          ? '论文实例：FLUX.2-Klein-4B 在 1K、4 步生成中，VAE 解码约占总时间 14%。主干变快后，固定的一次解码开始决定端到端延迟。'
          : '概念对照：传统多步扩散需要反复执行主干，而 VAE 通常只解码一次，因此过去容易被视为次要成本。'}
      </p>
      <div className="amdahl-callout"><strong>阿姆达尔定律</strong><span>只加速主干，端到端收益最终会被未加速的 VAE 限制。</span></div>
    </div>
  );
};

export const VaeArchitectureLab: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<'decoder' | 'encoder' | 'latent'>('decoder');
  const copy = {
    decoder: {
      title: 'Decoder：从强模型学会，再压成一步',
      body: '堆叠卷积扩散块连接解耦像素扩散头，不使用全局注意力。训练时具备扩散式建模能力，部署时一次前向把 latent 还原为 RGB。',
      flow: ['latent z', '卷积扩散块 × N', '解耦像素扩散头', 'RGB'],
    },
    encoder: {
      title: 'Encoder：Decoder 的结构对偶',
      body: '图像先经 16× patch embedding，再通过堆叠卷积扩散块，一次前向得到 latent。训练真实图像和反复编辑都需要编码，因此 encoder 也必须轻量。',
      flow: ['RGB', '16× Patchify', '卷积扩散块 × N', 'latent z'],
    },
    latent: {
      title: '接口：直接交付 Transformer-ready latent',
      body: 'FLUX.2-VAE 的 8× 下采样、32 通道输出还需 2×2 patchification；Mage-VAE 将其内化，直接输出 16× 下采样、128 通道的视觉 token 网格。',
      flow: ['H × W × 3', 'Mage-VAE', 'H/16 × W/16 × 128', '送入 NR-MMDiT'],
    },
  } as const;
  const current = copy[view];
  return (
    <div className="vae-story-card">
      <div className="ctrl" role="tablist" aria-label="查看 Mage-VAE 设计">
        {([['decoder', 'Decoder'], ['encoder', 'Encoder'], ['latent', 'Latent 接口']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} className={`chip ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>{label}</button>
        ))}
      </div>
      <h5 className="vae-story-title">{current.title}</h5>
      <p>{current.body}</p>
      <div className="vae-mini-flow">
        {current.flow.map((item, index) => <React.Fragment key={item}><span>{item}</span>{index < current.flow.length - 1 && <b aria-hidden="true">→</b>}</React.Fragment>)}
      </div>
      <p className="module-note">全卷积结构的高分辨率计算成本近似随像素数线性增长；参数量小并不是这里的核心指标。</p>
    </div>
  );
};

export const VaeAnchorLab: React.FC<WidgetProps> = () => {
  const [anchored, setAnchored] = useState(true);
  return (
    <div className="vae-story-card">
      <div className="anchor-compare">
        <div className="anchor-teacher"><span>冻结的 FLUX.2-VAE</span><strong>anchor latent zₐ</strong></div>
        <div className={`anchor-student ${anchored ? 'is-anchored' : ''}`}><span>轻量 Mage-VAE</span><strong>posterior qφ(z|x)</strong></div>
      </div>
      <button type="button" className={`anchor-toggle ${anchored ? 'active' : ''}`} aria-pressed={anchored} onClick={() => setAnchored((value) => !value)}>
        {anchored ? 'Anchor KL 已启用：约束潜空间对齐' : 'Anchor KL 已关闭：潜空间可能漂移'}
      </button>
      <p className={`feedback ${anchored ? 'good' : 'bad'}`} aria-live="polite">
        {anchored
          ? '重建与感知训练仍可进行，但 posterior 被拉向 FLUX.2 的 generation-ready latent 分布，因此更容易替换原 tokenizer。'
          : '只追求像素观感，encoder 可能学到另一套 latent 几何；图像重建得好，不代表现有生成骨干仍会使用这些 token。'}
      </p>
    </div>
  );
};

const stages = [
  { id: 1, title: '多步扩散预训练', body: 'Encoder 与 decoder 分别训练为多步流匹配模型：decoder 从 anchor latent 重建像素，encoder 从像素预测 patchified anchor latent。' },
  { id: 2, title: 'Decoder 单步蒸馏', body: '用像素 ℓ1、LPIPS、DINOv2 projected GAN 与 DMD 损失，把多步 decoder 压成一次前向，同时兼顾忠实度、细节与真实感。' },
  { id: 3, title: 'Encoder 单步化与联合微调', body: '先固定单步 decoder 训练 encoder，再解冻两者端到端联合微调；anchor KL 始终负责抑制潜空间漂移。' },
] as const;

export const VaeTrainingLab: React.FC<WidgetProps> = () => {
  return (
    <div className="vae-story-card">
      <div className="training-stages" aria-label="Mage-VAE 三阶段训练">
        {stages.map((item) => <div key={item.id} className="training-stage-card"><span>Stage {item.id}</span><strong>{item.title}</strong><p>{item.body}</p></div>)}
      </div>
      <div className="training-equation">能力来源：多步预训练 <b>→</b> 速度来源：单步蒸馏 <b>→</b> 可用性来源：anchor 对齐</div>
    </div>
  );
};
