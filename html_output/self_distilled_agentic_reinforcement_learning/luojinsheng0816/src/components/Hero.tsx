import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';

type ViewMode = 'landing' | 'presentation';

export function Hero({
  meta,
  hero,
  mode,
  onPresentation,
}: {
  meta: Meta;
  hero: HeroConfig;
  mode: ViewMode;
  onPresentation: () => void;
}) {
  const OldWidget = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const NewWidget = hero.newMethod.componentId ? widgetRegistry[hero.newMethod.componentId] : undefined;

  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        <div className="hero-hook">你会无条件听一个可能拿错谱子的老师吗？</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">{meta.titleZh} · arXiv:2605.15155 · 2026</div>
        <p className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        <div className="hero-thesis">
          <span>核心机制</span>
          <b>同一 token，两种上下文，两次评分，一个信任旋钮。</b>
        </div>
        <div className="hero-meta">
          {(meta.keywords || []).map((k, i) => <span key={i} className="tag">{k}</span>)}
        </div>

        <div className="hero-compare">
          <div className="bg-side old">
            <div className="bg-side-head">旧方法：反馈太晚或盲目蒸馏</div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
              {hero.oldMethod.figure ? <img src={hero.oldMethod.figure} alt="旧方法" style={{ width: '100%' }} /> : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">SDAR：逐 token 选择性信任</div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? <img src={hero.newMethod.figure} alt="SDAR 方法" style={{ width: '100%' }} /> : null}
            </div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
          </div>
        </div>

        <div className="hero-actions" aria-label="开始学习">
          <button className={`hero-mode-btn primary ${mode === 'presentation' ? 'is-active' : ''}`} onClick={onPresentation}>
            <span>▶</span><b>准备好了吗？开始学习</b>
          </button>
        </div>
      </div>
    </section>
  );
}
