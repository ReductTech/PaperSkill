import type { Meta, HeroConfig } from '../types';
import { HeroComparison } from '../modules/rev-hero';
export function Hero({ meta, hero }: { meta: Meta; hero: HeroConfig }) {
  return <section className="hero"><div className="hero-inner">
    <h1>{meta.titleEn}</h1>
    <div className="hero-sub">{meta.titleZh}</div>
    <p className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
    <div className="hero-meta">{meta.keywords.map(k => <span className="tag" key={k}>{k}</span>)}</div>
    <div className="hero-task"><strong>同一个任务</strong><span>把这朵黄花变成红花，使用预测深度引导构图，再转成卡通风格。</span></div>
    <HeroComparison oldDesc={hero.oldMethod.desc} newDesc={hero.newMethod.desc} />
  </div></section>;
}
