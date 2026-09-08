import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ArchitectureFocus = 'overview' | 'vision' | 'serialization' | 'attention' | 'position';

const FOCUS_COPY: Record<ArchitectureFocus, string> = {
  overview: '图像、视频和文本使用不同入口，但最终进入同一条输入序列，并在统一 decoder-only backbone 中完成原生多模态建模。',
  vision: '§3：取消独立 Vision Encoder 后，视觉仍先通过轻量入口变成 visual tokens。',
  serialization: '§4：单图、多图和视频通过统一视觉序列化进入同一种 sequence framework。',
  attention: '§5：同一 visual unit 内双向交互，不同 visual units 之间保持 causal relationship。',
  position: '§6：THW-Decoupled Q/K 扩展时序 / 空间表示能力，Native-RoPE 再利用位置索引编码具体的位置结构。',
};

const FOCUS_BUTTONS: Array<{ id: ArchitectureFocus; label: string }> = [
  { id: 'vision', label: '§3 视觉入口' },
  { id: 'serialization', label: '§4 统一序列化' },
  { id: 'attention', label: '§5 Spatial-Temporal Attention' },
  { id: 'position', label: '§6 THW + Native-RoPE' },
];

function FlowArrow() {
  return <i className="ch7a-flow-arrow" aria-hidden="true">→</i>;
}

function ArchitectureMap() {
  const [focus, setFocus] = useState<ArchitectureFocus>('overview');
  const [expanded, setExpanded] = useState(false);

  const selectFocus = (next: ArchitectureFocus) => {
    setFocus(next);
    if (next === 'attention' || next === 'position') setExpanded(true);
  };

  return (
    <div className={`ch7a-architecture is-focus-${focus}`}>
      <div className="ch7a-map-toolbar">
        <div><small>你已经学过这些部分</small><p>点击标签，在同一张 Architecture Map 中找到它的位置。</p></div>
        <button type="button" onClick={() => selectFocus('overview')} className={focus === 'overview' ? 'is-active' : ''}>查看完整路径</button>
      </div>
      <div className="ch7a-focus-buttons">
        {FOCUS_BUTTONS.map((item) => <button type="button" className={focus === item.id ? 'is-active' : ''} aria-pressed={focus === item.id} onClick={() => selectFocus(item.id)} key={item.id}>{item.label}</button>)}
      </div>

      <div className="ch7a-map" aria-label="完整 NEO-ov 架构地图">
        <div className="ch7a-entry ch7a-region-vision">
          <div className="ch7a-entry-lane is-visual"><small>视觉输入</small><b>Image / Video</b><i>↓</i><span>lightweight visual embedding</span><i>↓</i><code>visual tokens</code></div>
          <div className="ch7a-entry-lane is-text"><small>文本输入</small><b>Text</b><i>↓</i><span>Tokenizer / Word Embedding</span><i>↓</i><code>text tokens</code></div>
        </div>
        <FlowArrow />
        <div className="ch7a-node ch7a-region-serialization"><small>输入组织</small><b>Unified Visual Serialization</b><span>Multimodal Tokens → unified input sequence</span><em>serialization scheme · 不是网络层</em></div>
        <FlowArrow />
        <div className="ch7a-node ch7a-region-prebuffer"><small>模型结构</small><b>Pre-Buffer</b></div>
        <FlowArrow />
        <div className={`ch7a-backbone ${expanded ? 'is-expanded' : ''}`}>
          <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            <small>统一 decoder-only 主干</small>
            <b>Unified Backbone</b>
            <span>visual representation · pixel-word interaction · spatial-temporal modeling</span>
            <em>{expanded ? '收起内部 Attention 设计 −' : '展开内部 Attention 设计 +'}</em>
          </button>
          {expanded && <div className="ch7a-backbone-inside">
            <div className={`ch7a-mechanism is-attention ${focus === 'attention' ? 'is-active' : ''}`}><b>Spatial-Temporal Attention</b><span>attention connectivity</span></div>
            <div className={`ch7a-mechanism is-position ${focus === 'position' ? 'is-active' : ''}`}><b>THW-Decoupled Q/K</b><code>[ T | H | W ]</code></div>
            <div className={`ch7a-mechanism is-position ${focus === 'position' ? 'is-active' : ''}`}><b>Native-RoPE</b><code>idx = [ t, h, w ]</code></div>
          </div>}
        </div>
        <FlowArrow />
        <div className="ch7a-node ch7a-region-output"><small>Figure 1 · 输出侧</small><b>Post-LLM</b><span>Output Side</span></div>
        <FlowArrow />
        <div className="ch7a-node ch7a-answer"><small>输出</small><b>Answer</b></div>
      </div>

      <div className="ch7a-map-feedback" aria-live="polite">{FOCUS_COPY[focus]}</div>
    </div>
  );
}

const TRAINING_STAGES = [
  {
    number: '阶段一',
    tag: 'Pre-Training',
    title: '先让视觉“接入”语言主干',
    body: '首先建立基础视觉感知，并逐步让视觉表示与预训练语言主干的语义空间对齐，同时尽量保留原有语言能力。',
    signals: ['image-text pairs', '受限的优化范围'],
    abilities: ['基础视觉感知', '视觉—语言对齐'],
  },
  {
    number: '阶段二',
    tag: 'Mid-Training',
    title: '扩展空间—时间与复杂视觉理解',
    body: '随后加入更丰富的图像和视频训练，使整套模型进一步学习高分辨率视觉、多图关系和空间—时间推理。',
    signals: ['更丰富的图像与视频', '全模型联合优化'],
    abilities: ['高分辨率视觉', '多图 / 视频', '空间—时间推理'],
  },
  {
    number: '阶段三',
    tag: 'Supervised Fine-Tuning',
    title: '学会按照指令完成真实任务',
    body: '最后使用高质量 instruction data，让模型把已经形成的视觉和空间—时间能力用于问答、细粒度理解、多图与视频推理等实际任务。',
    signals: ['高质量 instruction data', '端到端优化'],
    abilities: ['指令理解', '实际多模态任务'],
  },
];

function TrainingProgression() {
  return (
    <div className="ch7t-training">
      <div className="ch7t-progression">
        {TRAINING_STAGES.map((stage, index) => <React.Fragment key={stage.tag}>
          <article className={`ch7t-stage is-stage-${index + 1}`}>
            <header><small>{stage.number}</small><code>{stage.tag}</code></header>
            <h6>{stage.title}</h6>
            <p>{stage.body}</p>
            <div className="ch7t-stage-row"><span>训练重心</span><div>{stage.signals.map((item) => <b key={item}>{item}</b>)}</div></div>
            <div className="ch7t-stage-row is-ability"><span>能力递进</span><div>{stage.abilities.map((item) => <b key={item}>{item}</b>)}</div></div>
          </article>
          {index < TRAINING_STAGES.length - 1 && <i className="ch7t-arrow" aria-hidden="true">→</i>}
        </React.Fragment>)}
      </div>

      <details className="ch7t-details">
        <summary>查看论文训练细节</summary>
        <div>
          <section><b>Pre-Training</b><p>约 20M image-text pairs；优化 patch embedding、Pre-Buffer 和新引入的 QK 参数，以尽量保留预训练 LLM 的语言先验。</p></section>
          <section><b>Mid-Training</b><p>近 60M 样本，混合 text-only、image-text、multi-image 与 video-text 数据，约为 2:4:1:1；联合优化全部层，覆盖 256²–4096² 分辨率、最多 128 帧，并将上下文由 16K 扩展至 36K。</p></section>
          <section><b>Supervised Fine-Tuning</b><p>约 4M 单图、1M 多图与 1M 视频高质量样本，继续进行端到端优化。</p></section>
        </div>
      </details>
    </div>
  );
}

export const NeoCh7Main: React.FC<WidgetProps> = () => (
  <div className="ch7-system-lesson">
    <section className="ch7-system-section" aria-labelledby="ch7-system-title">
      <h5 id="ch7-system-title"><span>7.1</span> 把前面的机制重新拼起来</h5>
      <ArchitectureMap />
      <div className="ch7-system-takeaway">💡 <b>前面学到的并不是几套互不相关的技巧：</b>视觉入口解决“怎么进来”，序列化解决“怎么组织”，Spatial-Temporal Attention 决定“谁能和谁交互”，THW 与 Native-RoPE 则为这些交互提供时序与二维空间结构——它们最终都服务于同一套 unified backbone。</div>
    </section>

    <section className="ch7-training-section" aria-labelledby="ch7-training-title">
      <h5 id="ch7-training-title"><span>7.2</span> 这套统一模型怎样训练出来？</h5>
      <TrainingProgression />
    </section>

    <div className="ch7-final-takeaway">💡 <b>NEO-ov 的关键不只是取消 Vision Encoder，</b>而是把视觉入口、统一序列化、空间—时间交互和位置建模组织进同一套 native backbone；训练上再通过渐进式的 Pre-Training、Mid-Training 和 SFT，逐步建立并强化这些统一视觉能力。</div>
  </div>
);
