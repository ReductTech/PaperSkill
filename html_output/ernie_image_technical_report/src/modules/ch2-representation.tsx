import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type NodeId = 'prompt' | 'pe' | 'text' | 'latent' | 'dit' | 'decoder' | 'image' | 'aes';

interface ArchitectureNode {
  label: string;
  shortLabel: string;
  role: string;
  fact: string;
}

const NODES: Record<NodeId, ArchitectureNode> = {
  prompt: {
    label: '用户提示', shortLabel: '用户提示', role: '自然语言输入',
    fact: '真实用户输入往往简短且不充分；提示词本身不是图像，也不是潜变量。',
  },
  pe: {
    label: 'Prompt Enhancer', shortLabel: 'PE（可选）', role: '可选的提示扩展器',
    fact: '轻量 Prompt Enhancer 在生成前把简短意图扩展为更丰富、结构化的视觉描述。',
  },
  text: {
    label: 'Ministral-3（3B）', shortLabel: '文本编码器', role: '文本编码器',
    fact: 'Ministral-3（3B）把提示转换成供生成器使用的文字条件。',
  },
  latent: {
    label: 'FLUX.2 VAE', shortLabel: 'VAE 潜空间', role: '图像潜空间',
    fact: 'FLUX.2 VAE 提供高保真图像潜空间；扩散生成在潜表示上进行。',
  },
  dit: {
    label: '8B 单流 DiT', shortLabel: '8B 单流 DiT', role: '核心生成器',
    fact: '论文明确说明 ERNIE-Image 建立在 8B 单流 DiT 架构上。完整内部层次未公开。',
  },
  decoder: {
    label: 'VAE 解码端', shortLabel: 'VAE 解码', role: '潜变量到图像',
    fact: '高层重建中，FLUX.2 VAE 的解码端把生成后的潜表示还原为图像。',
  },
  image: {
    label: '生成图像', shortLabel: '生成图像', role: '最终输出',
    fact: '输出来自 DiT 与 VAE 的生成主路，不经过 ERNIE-Image-Aes。',
  },
  aes: {
    label: 'ERNIE-Image-Aes', shortLabel: 'Aes 侧路', role: '数据筛选与审美评估',
    fact: 'Aes 用于清洗预训练数据并进行审美评估，不是图像生成器。',
  },
};

const ORDER: NodeId[] = ['prompt', 'pe', 'text', 'latent', 'dit', 'decoder', 'image', 'aes'];

export const Ch2RepresentationWidget: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<NodeId>('dit');
  const item = NODES[selected];

  return (
    <div>
      <figure className="architecture-figure">
        <img
          className="paper-original-figure"
          src="/images/ernie-image-architecture.png"
          alt="根据论文文字重建的 ERNIE-Image 高层架构：提示增强器与文本编码器形成文字条件，VAE 潜空间与文字条件汇入 8B 单流 DiT，Aes 是独立的数据筛选与审美评估侧路。"
        />

      </figure>
      <div
        className="chip-row"
        role="radiogroup"
        aria-label="架构组件"
        onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          if (event.key === 'Home') return setSelected(ORDER[0]);
          if (event.key === 'End') return setSelected(ORDER[ORDER.length - 1]);
          const delta = event.key === 'ArrowRight' ? 1 : -1;
          setSelected(ORDER[(ORDER.indexOf(selected) + delta + ORDER.length) % ORDER.length]);
        }}
      >
        {ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`chip ${selected === id ? 'selected' : ''}`}
            role="radio"
            aria-checked={selected === id}
            tabIndex={selected === id ? 0 : -1}
            onClick={() => setSelected(id)}
          >
            {NODES[id].shortLabel}
          </button>
        ))}
      </div>
      <div className="hotspot-info">
        <b>{item.label}</b> · {item.role}
        <br />
        {item.fact}
      </div>
      <div className={`feedback ${selected === 'image' ? 'good' : ''}`} aria-live="polite">
        {selected === 'aes'
          ? '当前选择的是独立的数据与评估侧路；它不连接到图像生成输出。'
          : '当前选择的是生成主路组件；文字条件与图像潜变量在单流 DiT 中共同参与生成。'}
      </div>

    </div>
  );
};

export default Ch2RepresentationWidget;
