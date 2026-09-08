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
  const InnovationOne = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const InnovationTwo = hero.newMethod.componentId ? widgetRegistry[hero.newMethod.componentId] : undefined;

  return (
    <section className={`hero af-landing ${started ? 'has-started' : ''}`}>
      <div className="hero-inner">
        <div className="hero-venue">INTERACTIVE PAPER TUTORIAL</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">{meta.titleZh}</div>
        <p className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => <span key={i} className="tag">{k}</span>)}
        </div>

        <div className="af-hero-previews">
          <div className="af-hero-preview latent-preview">
            <div className="af-preview-head">
              <span>INNOVATION I</span>
              <h2>非对称 Flow</h2>
            </div>
            <div className="af-preview-body">
              {InnovationOne ? <InnovationOne chapterId="hero" moduleId="old" /> : null}
            </div>
          </div>

          <div className="af-hero-preview asym-preview">
            <div className="af-preview-head">
              <span>INNOVATION II</span>
              <h2>Latent → Pixel</h2>
            </div>
            <div className="af-preview-body">
              {InnovationTwo ? <InnovationTwo chapterId="hero" moduleId="new" /> : null}
            </div>
          </div>
        </div>

        <div className="af-landing-cta">
          <button className="chap-loader-btn" onClick={onStart} aria-controls="chap-1">
            开始学习 <span className="chap-loader-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
