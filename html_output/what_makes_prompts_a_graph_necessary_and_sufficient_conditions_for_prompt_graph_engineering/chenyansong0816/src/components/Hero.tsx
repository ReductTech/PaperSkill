import React from 'react';
import type { Meta, HeroConfig } from '../types';

// Hero: paper metadata + two-column conceptual contrast.
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
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">
          {meta.titleZh} · {meta.venue}
        </div>
        <div className="hero-abs">
          <p dangerouslySetInnerHTML={{ __html: meta.coreProblem }} />
          <p dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        </div>
        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => (
            <span key={i} className="tag">
              {k}
            </span>
          ))}
        </div>

        <div className="hero-compare">
          <div className="bg-side old">
            <div className="bg-side-head">概念混用</div>
            {hero.oldMethod.figure ? (
              <div className="bg-side-canvas">
                <img src={hero.oldMethod.figure} alt="概念混用" style={{ width: '100%' }} />
              </div>
            ) : null}
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">定义澄清</div>
            {hero.newMethod.figure ? (
              <div className="bg-side-canvas">
                <img src={hero.newMethod.figure} alt="定义澄清" style={{ width: '100%' }} />
              </div>
            ) : null}
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
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
