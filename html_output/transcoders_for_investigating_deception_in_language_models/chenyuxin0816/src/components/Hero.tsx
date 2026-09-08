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
  onPresent,
  started,
}: {
  meta: Meta;
  hero: HeroConfig;
  onStart: () => void;
  onPresent: () => void;
  started: boolean;
}) {
  const OldWidget = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const NewWidget = hero.newMethod.componentId ? widgetRegistry[hero.newMethod.componentId] : undefined;

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-venue">Mechanistic Interpretability · 4-Minute Tutorial</div>
        <h1>你的模型为什么会骗你？</h1>
        <div className="hero-paper-title">{meta.titleEn}</div>
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
            <div className="bg-side-head">只看输出</div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
              {hero.oldMethod.figure ? (
                <img src={hero.oldMethod.figure} alt="传统方法" style={{ width: '100%' }} />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">追踪内部机制</div>
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
            <div className="chap-loader-hint">选择阅读方式</div>
            <div className="hero-actions">
              <button className="chap-loader-btn secondary" onClick={onStart}>
                逐章学习
              </button>
              <button className="chap-loader-btn" onClick={onPresent}>
                4分钟演示 <span className="chap-loader-arrow">→</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
