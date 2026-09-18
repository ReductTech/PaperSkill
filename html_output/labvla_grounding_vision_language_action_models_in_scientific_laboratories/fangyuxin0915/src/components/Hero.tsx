import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';

// Hero (slide 0): paper metadata + old/new two-column contrast. Each side may
// show a canvas widget (componentId) and/or a paper figure.
export function Hero({
  meta,
  hero,
}: {
  meta: Meta;
  hero: HeroConfig;
}) {
  const OldWidget = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const NewWidget = hero.newMethod.componentId ? widgetRegistry[hero.newMethod.componentId] : undefined;

  return (
    <section className="hero">
      <div className="hero-inner">
        <h1>{meta.titleEn}</h1>
        <p className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />

        <div className="hero-compare">
          <div className="bg-side old">
            <div className="bg-side-head">现有问题</div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">论文方案</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
          </div>
        </div>
      </div>
    </section>
  );
}
