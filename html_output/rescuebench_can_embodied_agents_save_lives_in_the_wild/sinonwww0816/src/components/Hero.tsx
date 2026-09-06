import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';
import { assetPath } from '../lib/assetPath';

// Keep the paper-skill reference information hierarchy while retaining the
// paper-specific RescueBench background and animated scenario.
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
  const HeroWidget = widgetRegistry[hero.componentId];

  return (
    <section
      className="hero hero-v2"
      style={{ backgroundImage: `linear-gradient(90deg, rgba(11, 24, 34, .92), rgba(11, 24, 34, .68) 56%, rgba(11, 24, 34, .38)), url("${assetPath(hero.background)}")` }}
    >
      <div className="hero-inner hero-v2-inner">
        <div className="hero-v2-copy">
          <div className="hero-venue">Interactive Tutorial</div>
          <h1>{meta.titleEn}</h1>
          <div className="hero-v2-subtitle">
            {meta.titleZh} · {meta.venue}
          </div>
          <p className="hero-v2-abstract" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
          <div className="hero-v2-meta" aria-label="论文关键词">
            {meta.keywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>
        </div>
        <div className="hero-v2-story" aria-label="从已知目标导航到连续搜索救援任务的自动演示">
          <div className="hero-v2-story-head">
            <h2>{hero.title}</h2>
            <p>{hero.subtitle}</p>
          </div>
          {HeroWidget ? <HeroWidget chapterId="hero" moduleId="loop" /> : null}
          <p className="hero-v2-prompt">{hero.prompt}</p>
        </div>

        {!started ? (
          <div className="hero-v2-cta chap-loader">
            <div className="chap-loader-hint">准备好了吗？</div>
            <button className="chap-loader-btn" onClick={onStart}>
              {hero.cta} <span className="chap-loader-arrow">→</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
