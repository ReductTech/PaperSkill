import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';

// Hero (slide 0): paper metadata + 传统/AHE 双闭环流程图（flowId 指定画布组件），
// 下方并排两段叙述卡（oldMethod/newMethod 的 desc）。
export function Hero({
  meta,
  hero,
}: {
  meta: Meta;
  hero: HeroConfig;
}) {
  const FlowWidget = hero.flowId ? widgetRegistry[hero.flowId] : undefined;

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

        <div className="hero-loops">
          <div className="hero-loops-canvas">
            <div className="hero-loops-head">两种 Harness 工程循环</div>
            {FlowWidget ? <FlowWidget chapterId="hero" moduleId="loops" /> : null}
          </div>
          <div className="hero-loops-narr">
            <div className="hero-narr-card old">
              <div className="hero-narr-head">传统人工循环</div>
              <p dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
            </div>
            <div className="hero-narr-card new">
              <div className="hero-narr-head">AHE 自动闭环</div>
              <p dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
