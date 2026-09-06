import React from 'react';
import type { WidgetProps } from './registry';

function PixelsToWords() {
  const steps = ['Image / Video Pixels', '轻量视觉入口', 'visual tokens', '统一序列', 'unified backbone', '语言理解 / 生成'];
  return (
    <section className="ch9-concept ch9-pixels">
      <h4>From Pixels to Words <span>——“从像素到文字”到底发生了什么？</span></h4>
      <div className="ch9-pixel-path" aria-label="从视觉像素到语言理解与生成的技术路径">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <b>{step}</b>
            {index < steps.length - 1 && <i>→</i>}
          </React.Fragment>
        ))}
      </div>
      <p>这里的重点不是“AI 最后会说话”，而是视觉信息不再先交给一个完整的外部视觉模型处理完毕，再交给语言模型；它从轻量视觉入口开始，逐步进入统一的语言—视觉建模过程。</p>
    </section>
  );
}

function NativeMeaning() {
  return (
    <section className="ch9-concept ch9-native">
      <h4>Native <span>——“原生”到底原生在哪里？</span></h4>
      <p className="ch9-lead">NEO-ov 去掉的是独立 external Vision Encoder / auxiliary adapter 这类模块边界，而不是取消视觉输入处理。视觉表示学习、视觉—语言交互和后续推理被重新组织进同一套 unified backbone。</p>
      <div className="ch9-native-compare">
        <div>
          <small>Modular</small>
          <b>独立 Vision Encoder</b><i>→</i><b>Projector</b><i>→</i><b>Language Model</b>
        </div>
        <div>
          <small>Native</small>
          <b>轻量视觉入口</b><i>→</i><b>visual tokens</b><i>→</i><b>Unified Backbone</b>
          <em>视觉 + 语言共同建模</em>
        </div>
      </div>
      <p className="ch9-key-line">Native 的重点不是“少了一个模块”，而是视觉能力在哪里形成发生了变化。</p>
    </section>
  );
}

function OneVisionMeaning() {
  return (
    <section className="ch9-concept ch9-onevision">
      <h4>One-Vision <span>——“统一”的到底是什么？</span></h4>
      <p className="ch9-lead">不同视觉输入和能力不再分别依赖完全不同的视觉架构，而是尽可能共享同一套视觉入口、序列组织框架和 unified backbone。</p>
      <div className="ch9-convergence">
        <div><span>单图</span><span>多图</span><span>视频</span><span>空间智能</span></div>
        <i>→</i>
        <strong>One-Vision<small>Unified Backbone</small></strong>
      </div>
      <div className="ch9-differences">
        <strong>统一 ≠ 抹平差异</strong>
        <span><b>多图</b>保留 visual-unit 边界</span>
        <span><b>视频</b>保留时间 / 顺序结构</span>
        <span><b>图像空间</b>保留 H / W 二维位置</span>
      </div>
      <p className="ch9-key-line">统一的是建模框架，而不是把所有视觉输入强行变成完全相同的结构。</p>
    </section>
  );
}

function ScaleMeaning() {
  return (
    <section className="ch9-concept ch9-scale">
      <h4>at Scale <span>——为什么标题不是简单说“一个大模型”？</span></h4>
      <p className="ch9-lead">这里的 Scale 不只是参数量变大。更重要的问题是：Native One-Vision 能否真正扩展到更大的模型、更多训练数据、更复杂的视觉输入和更广泛的任务，而不是只停留在一个小型原型。</p>
      <div className="ch9-scale-map">
        <b>Native One-Vision</b>
        <i>↓</i>
        <div><span>模型规模</span><span>训练数据</span><span>输入类型</span><span>任务范围</span><span>实验竞争力</span></div>
        <i>↓</i>
        <strong>从概念原型走向可规模化方案</strong>
      </div>
      <div className="ch9-scale-evidence">
        <p><b>§7</b>通过渐进式训练让统一模型逐步建立并扩展视觉能力。</p>
        <p><b>§8</b>通过单图、多图、视频和空间智能实验验证，这条 native 路线已经具备综合竞争力。</p>
      </div>
      <p className="ch9-key-line ch9-scale-conclusion">论文真正想推进的不是“一个 encoder-free demo 能不能跑”，而是：Native One-Vision 能不能变成一条可以规模化训练、覆盖多类视觉任务并具备竞争力的模型路线。</p>
    </section>
  );
}

const TITLE_ANNOTATIONS = [
  ['From Pixels to Words', '视觉信息如何从轻量入口进入统一建模'],
  ['Native', '视觉能力不再预先交给独立视觉编码器'],
  ['One-Vision', '多类视觉输入与能力共享统一建模框架'],
  ['at Scale', '这条路线可以扩展到真实规模与广泛任务'],
];

function ReassembledTitle() {
  return (
    <section className="ch9-reassembled">
      <small>现在，重新读一遍标题</small>
      <div>
        {TITLE_ANNOTATIONS.map(([term, meaning]) => (
          <p key={term}><b>{term}</b><span>{meaning}</span></p>
        ))}
      </div>
    </section>
  );
}

export const NeoCh9Main: React.FC<WidgetProps> = () => (
  <div className="ch9-title-lesson">
    <header className="ch9-paper-title">
      <h3>From Pixels to Words</h3>
      <h4>Towards Native One-Vision Models at Scale</h4>
      <p>从像素到文字：迈向规模化的原生统一视觉模型</p>
    </header>

    <PixelsToWords />
    <NativeMeaning />
    <OneVisionMeaning />
    <ScaleMeaning />
    <ReassembledTitle />

    <p className="ch9-paper-summary">总结：NEO-ov 的贡献不只是删除 Vision Encoder，而是重新组织视觉进入、序列化、Attention、位置建模与训练方式，让视觉与语言在统一 backbone 中进行 native modeling，并把这套设计从单图扩展到多图、视频和空间智能。实验表明，这条路线已经具备很强的综合竞争力，但距离全面取代成熟 modular VLM 仍有明显边界。</p>
  </div>
);
