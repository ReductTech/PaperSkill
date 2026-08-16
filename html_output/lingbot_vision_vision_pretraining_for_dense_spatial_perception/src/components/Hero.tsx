import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';

// Hero: paper metadata + old/new two-column contrast. Each side may show a canvas
// widget (componentId) and/or a paper figure. A "start" button kicks off progressive
// chapter reveal.
export function Hero({
  meta,
  hero,
  onStart,
  started,
}: {
  meta: Meta;
  hero: HeroConfig;
  onStart: () => void;
  started: boolean;
}) {
  const OldWidget = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const NewWidget = hero.newMethod.componentId ? widgetRegistry[hero.newMethod.componentId] : undefined;

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">
          {meta.titleZh} · {meta.venue}
        </div>
        <p className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => (
            <span key={i} className="tag">
              {k}
            </span>
          ))}
        </div>

        <div className="hero-compare">
          <div className="bg-side old">
            <div className="bg-side-head">传统方法</div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
              {hero.oldMethod.figure ? (
                <img src={hero.oldMethod.figure} alt="传统方法" style={{ width: '100%' }} />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">本文方法</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? (
                <img src={hero.newMethod.figure} alt="本文方法" style={{ width: '100%' }} />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
          </div>
        </div>

        {/* 开场导览：交代论文讲什么 + 面向不熟悉听众的背景补课 + 7 屏路线 */}
        <div className="hero-guide">
          <div className="guide-head">
            <span className="guide-badge">开场导览</span>
            <strong>这篇工作到底在讲什么？</strong>
          </div>
          <p className="guide-lead">
            现在的视觉大模型会「认东西」，却不太会「量空间」。机器人要抓杯子、走路避障，靠的是像素级的<b>深度、边界、几何</b>，
            而不是一句「这是杯子」。这篇论文提出 <b>LingBot-Vision</b>：把「边界」当作训练信号，让视觉模型自监督地学会空间结构。
            结果：<b>1B 参数的模型在深度估计上超过 7B 的 DINOv3</b>；蒸馏出的 0.3B 小模型，也用 <b>23× 更少参数</b>追平了它。
          </p>
          <div className="guide-bg">
            <div className="guide-bg-title">背景补课（不熟悉也没关系）</div>
            <div className="guide-bg-row">
              <span className="bg-chip">自监督学习</span> 不用人工标注，让模型自己从图像里学特征。
              <span className="bg-chip">ViT</span> 把图像切成小格（patch），像文字一样送进 Transformer。
              <span className="bg-chip">掩码建模</span> 遮住一部分让模型猜——会「补全」，才会「理解结构」。
            </div>
          </div>
          <div className="guide-steps">
            <span className="guide-steps-label">9 屏故事线：</span>
            <b>① 问题</b><i>→</i><b>② Teacher/Student</b><i>→</i><b>③ 核心洞见</b><i>→</i><b>④ 完整算法流程</b><i>→</i><b>⑤ 目标自举</b><i>→</i><b>⑥ 联合训练</b><i>→</i><b>⑦ 设计依据</b><i>→</i><b>⑧ 消融证据</b><i>→</i><b>⑨ 落地</b>
          </div>
          <div className="guide-flow">
            <span className="guide-steps-label">算法主链（输入到参数更新）：</span>
            图片 → Teacher 预测边界场 → 角点+投票解码 → a-contrario 验证 → 重渲染干净标签 → 边界强制掩码 → Student 学语义+几何 → 反向传播 → EMA 更新 Teacher
          </div>
        </div>

        {!started ? (
          <div className="chap-loader">
            <div className="chap-loader-hint">准备好了吗？</div>
            <button className="chap-loader-btn" onClick={onStart}>
              开始学习 §1 <span className="chap-loader-arrow">→</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
