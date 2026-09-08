import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';

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
  const h1 = meta.titleShort || 'Qwen-VLA';

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial</div>
        <h1>{h1}</h1>
        <div className="hero-sub">{meta.titleZh}</div>
        <p className="hero-abs hero-paper-en">
          {meta.titleEn} · {meta.venue}
        </p>
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
            <div className="bg-side-head">{hero.oldMethod.panelHead || '传统 Specialist Fragmentation'}</div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">{hero.newMethod.panelHead || 'Qwen-VLA Unified Generalist'}</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
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
