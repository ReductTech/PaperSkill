import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';

// Hero (slide 0): paper metadata + three-column contrast.
// Left = old method · Middle = GARD feature-space idea · Right = restored point cloud teaser.
// Each side may show a canvas widget (componentId) and/or a paper figure.
export function Hero({
  meta,
  hero,
}: {
  meta: Meta;
  hero: HeroConfig;
}) {
  const OldWidget = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const PC = hero.pointCloud;
  const PCWidget = PC?.componentId ? widgetRegistry[PC.componentId] : undefined;
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

        <div className="hero-compare three-col">
          <div className="bg-side old">
            <div className="bg-side-head">① 传统方法（像素空间）</div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
              {hero.oldMethod.figure ? (
                <img src={hero.oldMethod.figure} alt="传统方法" className="bg-side-img" />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          {PC ? (
            <div className="bg-side middle">
              <div className="bg-side-head">② GARD 关键思想（特征空间）</div>
              <div className="bg-side-canvas">
                {PCWidget ? <PCWidget chapterId="hero" moduleId="mid" /> : null}
                {PC.figure ? (
                  <img src={PC.figure} alt="GARD 特征空间" className="bg-side-img" />
                ) : null}
              </div>
              <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: PC.desc }} />
            </div>
          ) : null}
          <div className="bg-side new">
            <div className="bg-side-head">③ GARD 输出（点云对比）</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? (
                <img src={hero.newMethod.figure} alt="GARD 输出" className="bg-side-img" />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
          </div>
        </div>
      </div>
    </section>
  );
}
