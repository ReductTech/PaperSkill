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
        <div className="hero-venue">交互式论文教程</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">
          中文释义：{meta.titleZh}<br />{meta.venue}
        </div>
        <p className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        <div className="hero-story hero-story-simple">
          <div className="hero-solution">
            <div className="bg-side-head">VideoAgent 核心流程</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? (
                <img src={hero.newMethod.figure} alt="本文方法" style={{ width: '100%' }} />
              ) : null}
            </div>
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
