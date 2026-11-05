import type { Meta, HeroConfig } from '../types';
import { CoverExperience } from '../modules/cover-motion';

export function Hero({ meta, onStart }: { meta: Meta; hero: HeroConfig; onStart?: () => void }) {
  return <section className="coop-cover">
    <header className="cc-heading">
      <div className="cc-title-row"><h1>CoOp<span>.</span></h1><div className="cc-title-zh">让提示<br /><em><span className="cc-full-tagline">学会适应任务。</span><span className="cc-short-tagline">适应任务。</span></em></div></div>
      <div className="cc-overview"><p className="cc-title-en">{meta.titleEn}</p><p className="cc-lead">用少量标注图片，<strong>学出适合任务的提示。</strong></p><span className="cc-paper-type">论文交互精读 · 10 章</span></div>
    </header>
    <CoverExperience />
    <div className="cc-entry">
      <p>从一个词开始，读懂提示学习。</p>
      {onStart && <button type="button" onClick={onStart} className="cc-start">进入第一章 <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg></button>}
    </div>
  </section>;
}
