import React from 'react';
import type { Meta, HeroConfig } from '../types';

// 封面：论文信息 + 「三个范式之下的操作系统层」故事 + 新旧对比 + 开始阅读。

const PARADIGMS = [
  { icon: '👁️', name: 'VLA 模型', good: '感知 → 动作', gap: '缺少结果诊断' },
  { icon: '🔮', name: '世界模型', good: '预测环境动力学', gap: '与任务语言弱耦合' },
  { icon: '🧠', name: 'Agent 系统', good: '分解任务 · 调用工具', gap: '规划与执行同边界' },
];

const SERVICES = ['调度', '验证', '记忆', '评测', '安全'];

export function Hero({ meta, hero, onStart }: { meta: Meta; hero: HeroConfig; onStart: () => void }) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial · {meta.venue}</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">{meta.titleZh}</div>

        <div className="hero-authors">
          <div className="hero-authors-line">{meta.authors}</div>
          <div className="hero-affil">{meta.affiliation}</div>
        </div>

        <div className="hero-gap-visual" aria-hidden>
          <div className="hero-paradigms">
            {PARADIGMS.map((p) => (
              <div className="hero-paradigm" key={p.name}>
                <span className="hero-paradigm-icon">{p.icon}</span>
                <b>{p.name}</b>
                <span className="hero-paradigm-good">{p.good}</span>
                <span className="hero-paradigm-gap">{p.gap}</span>
              </div>
            ))}
          </div>
          <div className="hero-gap-strip">
            <span>缺：共享状态 · 语义验收 · 持久经验 · 监督执行层</span>
          </div>
          <div className="hero-os-band">
            <span className="hero-os-name">PhyAgentOS</span>
            <span className="hero-os-sub">三个范式之下的操作系统层</span>
            <span className="hero-os-services">
              {SERVICES.map((s) => (
                <i key={s}>{s}</i>
              ))}
            </span>
          </div>
        </div>

        <div className="hero-compare">
          <div className="bg-side old">
            <div className="bg-side-head">直接堆叠三种范式</div>
            <p className="bg-side-desc">{hero.oldMethod.desc}</p>
            <ul className="bg-side-points">
              {hero.oldMethod.points?.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">PhyAgentOS 运行时</div>
            <p className="bg-side-desc">{hero.newMethod.desc}</p>
            <ul className="bg-side-points">
              {hero.newMethod.points?.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hero-meta">
          {meta.keywords.map((k) => (
            <span key={k} className="tag">
              {k}
            </span>
          ))}
          {(meta.links ?? []).map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
              {l.label} ↗
            </a>
          ))}
        </div>

        <button className="hero-cta" onClick={onStart}>
          开始阅读 · §1 具身智能系统里到底有哪些角色？
          <span aria-hidden>→</span>
        </button>
        <div className="hero-kbd-hint">键盘 ← / → 也可以翻页</div>
      </div>
    </section>
  );
}
