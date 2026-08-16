import React from 'react';
import type { Meta, HeroConfig } from '../types';

// Hero: opening context for the paper. A "start" button kicks off progressive
// chapter reveal; detailed mechanism comparisons live in the chapter modules.
export function Hero({
  meta,
  onStart,
  started,
  pageTotal,
}: {
  meta: Meta;
  hero: HeroConfig;
  onStart: () => void;
  started: boolean;
  pageTotal: number;
}) {
  return (
    <section className="hero overview-hero" id="page-1">
      <div className="hero-inner overview-inner">
        <div className="hero-venue">PAGE 1 / {pageTotal} · PAPER OVERVIEW</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">
          {meta.titleZh} · {meta.venue}
        </div>
        <p className="hero-abs hero-context" dangerouslySetInnerHTML={{ __html: meta.coreProblem }} />
        <div className="hero-storyline" aria-label="paper background storyline">
          <div className="story-step">
            <b>主流范式</b>
            <span>GPT / LLaMA / Qwen 采用自回归生成</span>
          </div>
          <div className="story-step">
            <b>核心限制</b>
            <span>效果成熟，但生成顺序固定为从左到右</span>
          </div>
          <div className="story-step">
            <b>替代路线</b>
            <span>Diffusion LLM 从 [MASK] 出发多轮去噪</span>
          </div>
          <div className="story-step">
            <b>LLaDA 之后</b>
            <span>证明可扩展，但性能与机制仍有差距</span>
          </div>
          <div className="story-step strong">
            <b>iLLaDA</b>
            <span>在不改变范式的前提下系统补齐</span>
          </div>
        </div>
        <p className="hero-abs hero-thesis" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => (
            <span key={i} className="tag">
              {k}
            </span>
          ))}
        </div>

        {!started ? (
          <div className="chap-loader hero-loader clean-loader">
            <button className="chap-loader-btn" onClick={onStart}>
              开始汇报 <span className="chap-loader-arrow">→</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
