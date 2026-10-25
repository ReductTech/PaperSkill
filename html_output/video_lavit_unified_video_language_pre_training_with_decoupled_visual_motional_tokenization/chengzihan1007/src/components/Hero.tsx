import type { Meta, HeroConfig } from '../types';

const steps = [
  { number: '01', title: '压缩视频', detail: 'I-frame + motion vector', chapter: 2, glyph: '▣' },
  { number: '02', title: '双路 Token 化', detail: 'Visual + Motion', chapter: 4, glyph: '◈' },
  { number: '03', title: '统一语言模型', detail: '成组序列 · next token', chapter: 5, glyph: '[ ]' },
  { number: '04', title: '视频解码', detail: 'Keyframe + EMC', chapter: 6, glyph: '▶' },
];

export function Hero({ meta, hero, onNavigate }: { meta: Meta; hero: HeroConfig; onNavigate: (chapter: number) => void }) {
  return <section className="hero vl-hero">
    <div className="hero-inner">
      <div className="hero-venue">Video-LaVIT · 论文交互教程</div>
      <h1>{meta.titleZh}</h1>
      <div className="hero-sub">{meta.titleEn}</div>
      <p className="hero-abs">{meta.coreInsight}</p>
      <div className="vl-hero-contrast"><div><small>问题</small><strong>{hero.oldMethod.desc}</strong></div><span>→</span><div><small>论文方法</small><strong>{hero.newMethod.desc}</strong></div></div>
      <div className="vl-hero-map-heading"><span>论文方法总览</span><small>点击步骤，直接进入对应章节</small></div>
      <div className="vl-hero-map">{steps.map((step, index) => <button type="button" key={step.number} className="vl-hero-map-step" onClick={() => onNavigate(step.chapter)}>
        <span className="vl-hero-step-number">{step.number}</span><span className="vl-hero-step-glyph">{step.glyph}</span><strong>{step.title}</strong><small>{step.detail}</small><em>第 {step.chapter} 章 ↗</em>{index < steps.length - 1 && <span className="vl-hero-step-link" aria-hidden="true">→</span>}
      </button>)}</div>
      <p className="vl-hero-hint">原图、公式、实验数字会在对应章节与交互并排呈现；模拟部分有明确标记。</p>
    </div>
  </section>;
}
