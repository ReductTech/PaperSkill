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

        <div className="hero-showcase hero-showcase-single">
          <div className="bg-side-canvas hero-showcase-canvas">
            {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
            {hero.newMethod.figure ? (
              <img src={hero.newMethod.figure} alt="手语翻译示意" style={{ width: '100%' }} />
            ) : null}
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
