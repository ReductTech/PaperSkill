import React from 'react';
import type { Meta, HeroConfig } from '../types';

// Hero (slide 0): paper metadata + old/new two-column contrast. Each side may
// show a canvas widget (componentId) and/or a paper figure.
export function Hero({
  meta,
  hero: _hero,
}: {
  meta: Meta;
  hero: HeroConfig;
}) {
  return (
    <section className="hero paper-cover">
      <div className="hero-inner paper-cover-inner">
        <div className="hero-venue">论文互动精读 · {meta.venue}</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">{meta.titleZh}</div>

        <div className="cover-background">
          <span>研究背景</span>
          <p>机器人领域中，多样化且带动作标签的数据集昂贵而稀缺；网络上虽然存在海量人类视频，却缺少可直接用于机器人控制的动作标注，因此很难被充分利用。</p>
        </div>

        <div className="cover-core-grid">
          <article>
            <small>CORE QUESTION · 核心问题</small>
            <p>从无动作标签的人类与机器人视频中学习到的表示，究竟保留了多少可泛化的动作语义与连续控制信息？</p>
          </article>
          <article>
            <small>CORE FINDING · 核心结论</small>
            <p>在 LARYBench 的双轨评测下，通用视觉编码器往往比专门训练的具身潜在动作模型保留更多可读出的动作信息。</p>
          </article>
        </div>

        <div className="cover-contribution">
          <small>CONTRIBUTION · 领域贡献</small>
          <p>LARYBench 以 attentive probe 评估动作语义分类、以 MLP Action Expert 评估连续控制回归，在统一协议下比较 11 个模型的动作表示质量。</p>
        </div>

        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => (
            <span key={i} className="tag">
              {k}
            </span>
          ))}
        </div>
        <button className="cover-start" onClick={()=>window.dispatchEvent(new CustomEvent('lary-next-slide'))}>开始探索 →</button>
      </div>
    </section>
  );
}
