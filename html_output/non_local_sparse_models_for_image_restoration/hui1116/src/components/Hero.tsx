import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';
import '../styles/animation-intro.css';

// Hero (slide 0): paper metadata + old/new two-column contrast. Each side may
// show a canvas widget (componentId) and/or a paper figure.
export function Hero({
  meta,
  hero,
  onStart,
}: {
  meta: Meta;
  hero: HeroConfig;
  onStart: () => void;
}) {
  const OldWidget = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const NewWidget = hero.newMethod.componentId ? widgetRegistry[hero.newMethod.componentId] : undefined;

  return (
    <section className="hero">
      <div className="hero-inner">
        <h1>{meta.titleZh}</h1>
        <div className="hero-sub">
          {meta.titleEn} · {meta.venue}
        </div>
        <p className="hero-abs">{meta.coreInsight}</p>
        <div className="hero-actions">
          <button type="button" className="slide-nav-btn slide-nav-btn-primary" onClick={onStart}>开始教程</button>
          {meta.paperSource ? <a className="paper-source" href={meta.paperSource} target="_blank" rel="noreferrer">论文原文 ↗</a> : null}
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
            <div className="bg-side-head">逐块独立编码</div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
              {hero.oldMethod.figure ? (
                <img src={hero.oldMethod.figure} alt="传统方法" className="bg-side-img" />
              ) : null}
            </div>
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">联合稀疏编码</div>
            <div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? (
                <img src={hero.newMethod.figure} alt="本文方法" className="bg-side-img" />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
