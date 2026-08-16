import React from 'react';
import type { WidgetProps } from './registry';

export const MotComparisonStatic: React.FC<WidgetProps> = () => (
  <div className="mot-static" role="img" aria-label="左侧传统共享 Transformer 让视觉与文本共用 QKV、Attention 和 FFN；右侧 MoT 将视觉与语言分流到各自的 QKV、注意力和 FFN。">
    <section className="mot-static-side traditional">
      <div className="mot-static-title"><span>传统</span><b>共享 Transformer</b></div>
      <div className="mot-inputs"><i className="visual">视觉 token</i><i className="language">文本 token</i></div>
      <div className="mot-arrow">↓</div>
      <div className="mot-shared-stack">
        <strong>同一套参数</strong>
        <span>Shared QKV</span>
        <span>Shared Attention</span>
        <span>Shared FFN</span>
      </div>
      <p>视觉与语言共用 QKV、Attention 和 FFN；密集视觉训练会持续改写同一套参数。</p>
    </section>

    <div className="mot-static-vs">VS</div>

    <section className="mot-static-side proposed">
      <div className="mot-static-title"><span>本文</span><b>Mixture-of-Transformers</b></div>
      <div className="mot-inputs"><i className="visual">视觉 token</i><i className="language">文本 token</i></div>
      <div className="mot-split-arrows"><span>↙</span><span>↘</span></div>
      <div className="mot-branches">
        <div className="mot-branch visual">
          <strong>Vision Branch</strong>
          <span>Vision QKV</span>
          <span>Local Full Attention</span>
          <span>Vision FFN</span>
        </div>
        <div className="mot-branch language">
          <strong>Language Branch</strong>
          <span>Language QKV</span>
          <span>Global Causal Attention</span>
          <span>Language FFN</span>
        </div>
      </div>
      <p>视觉与语言进入两条专属分支：增加小模型的视觉容量，同时减少对原有语言参数的干扰。</p>
    </section>

    <div className="mot-static-takeaway">
      <span>传统：视觉与语言争用参数</span>
      <b>→</b>
      <span>MoT：视觉看细节，语言守语义；每个 token 只激活对应分支</span>
    </div>
  </div>
);

export default MotComparisonStatic;
