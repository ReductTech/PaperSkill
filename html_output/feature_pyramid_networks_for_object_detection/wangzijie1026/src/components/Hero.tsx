import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry, paperUrl } from '../modules/registry';
import { CoverAnimationProvider } from '../modules/recovered';

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
        <div className="hero-venue">FPN / 交互式论文导读</div>
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
        <div className="guide-publication">
          <p>{meta.authors}</p>
          <p>{meta.affiliation}</p>
          <div className="guide-source-links">
            <a href={paperUrl} target="_blank" rel="noreferrer">阅读 CVPR 2017 正式论文 ↗</a>
            <a href="https://openaccess.thecvf.com/content_cvpr_2017/html/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.html" target="_blank" rel="noreferrer">CVF 论文主页 ↗</a>
          </div>
        </div>

        <CoverAnimationProvider>
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
        </CoverAnimationProvider>
        <div className="guide-source-summary">阅读提示：图表中的论文数值附有节号、表号和实验条件；城市图、特征热力图及尺寸操作均为教学示意。可用左侧目录选择章节，或按页面底部按钮依次阅读。</div>
      </div>
    </section>
  );
}
