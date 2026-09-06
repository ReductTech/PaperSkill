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
        <div className="hero-venue">Interactive Tutorial</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">
          {meta.titleZh} · {meta.venue}
        </div>
        <p className="hero-abs"><strong>研究问题：</strong>{meta.coreProblem}</p>
        <p className="hero-abs" dangerouslySetInnerHTML={{ __html: `<strong>论文回答：</strong>${meta.coreInsight}` }} />
        <div className="hero-scope-grid" aria-label="论文适用条件与主要局限">
          <div className="hero-scope-card fit"><strong>适用条件</strong><p>{meta.applicability}</p></div>
          <div className="hero-scope-card limit"><strong>主要局限</strong><p>{meta.limitations}</p></div>
        </div>
        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => (
            <span key={i} className="tag">
              {k}
            </span>
          ))}
        </div>

        <div className="hero-compare">
          <div className="bg-side old">
            <div className="bg-side-head">1.0 已有基础与剩余问题</div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
              {hero.oldMethod.figure ? (
                <img src={hero.oldMethod.figure} alt="传统方法" style={{ width: '100%' }} />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">1.5 在相同约束下升级</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? (
                <img src={hero.newMethod.figure} alt="本文方法" style={{ width: '100%' }} />
              ) : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
          </div>
        </div>

        <div className="chap-loader">
          <div className="chap-loader-hint">{started ? '切换学习方式' : '选择学习方式'}</div>
          <div className="hero-start-actions">
            <button className="chap-loader-btn" onClick={onStart}>{started ? '从头看完整教程' : '完整教程'} <span className="chap-loader-arrow">→</span></button>
            <button className="chap-loader-btn secondary" onClick={onPresent}>4 分钟展示 <span className="chap-loader-arrow">▶</span></button>
          </div>
        </div>
      </div>
    </section>
  );
}
