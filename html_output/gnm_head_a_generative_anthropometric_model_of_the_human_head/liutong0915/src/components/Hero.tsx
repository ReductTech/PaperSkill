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
        <div className="hero-venue">Interactive Tutorial · 作业 101 · 刘通</div>
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

        <figure className="hero-meme-board">
          <img
            src="./images/gnm-meme-triptych.png"
            alt="原创三联科研梗图：空壳头模破防、完整 GNM 点赞、用同一把尺子公平比较"
          />
          <figcaption>
            <span><b>空壳破防：</b>一张嘴，内部几何去哪了？</span>
            <span><b>完整上岗：</b>眼球、牙齿、舌头各司其职。</span>
            <span><b>同尺比较：</b>先统一协议，再讨论谁更准。</span>
          </figcaption>
        </figure>

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
      </div>
    </section>
  );
}
