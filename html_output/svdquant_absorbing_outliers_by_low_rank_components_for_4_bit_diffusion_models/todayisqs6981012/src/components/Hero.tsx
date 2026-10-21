import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';

// Hero（第 0 屏）：论文元信息 + 老/新两栏对比 + 四支柱 + 关键指标与报告条件。
export function Hero({ meta, hero }: { meta: Meta; hero: HeroConfig }) {
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
                <img src={hero.oldMethod.figure} alt="传统方法" className="bg-side-img" />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">本文方法</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? (
                <img src={hero.newMethod.figure} alt="本文方法" className="bg-side-img" />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
          </div>
        </div>

        <div className="hero-pillars">
          {hero.pillars.map((p) => (
            <div className="hero-pillar" key={p.index}>
              <span className="hp-index">{p.index}</span>
              <div className="hp-body">
                <strong>{p.title}</strong>
                <span>{p.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-performance">
          <div className="hp-metrics">
            {hero.metrics.map((m) => (
              <div className="hp-metric" key={m.value}>
                <strong>{m.value}</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          <p className="hp-conditions">{hero.conditions}</p>
        </div>
      </div>
    </section>
  );
}
