import React from 'react';
import { tutorial } from '../../data/tutorial';
import { widgetRegistry } from '../../modules/registry';
import { EvChip, Tag, TAG_INFO } from '../../ui/kit';
import type { ContentTag } from '../../types';

// 按目的给出三条阅读路线（锚点直接跳到第一站）
const ROUTES = [
  { title: '先懂原理', path: '第 2 → 3 → 4 → 5 章', href: '#chap-2' },
  { title: '复现代码与算力', path: '第 6 → 9 章', href: '#chap-6' },
  { title: '检查证据与边界', path: '第 7 → 10 章 → 结论分级', href: '#chap-7' },
];

export function Hero() {
  const hx = tutorial.heroX!;
  const Cloud = widgetRegistry['hero-cloud'];
  const Duel = widgetRegistry['hero-duel'];
  return (
    <header className="hero" id="top">
      <div className="hero-stage">
        {Cloud ? <Cloud chapterId="hero" moduleId="hero" /> : null}
      </div>
      <div className="hero-copy">
        <div className="hero-kicker">{hx.kicker}</div>
        <h1 className="hero-title">
          <span className="hero-word">DivPrune</span>
          <span className="hero-sub">{tutorial.meta.titleZh.replace(/^DivPrune：/, '')}</span>
        </h1>
        <p className="hero-en">{tutorial.meta.titleEn}</p>
        <p className="hero-authors">
          {tutorial.meta.authors}
          <br />
          <span>{tutorial.meta.affiliation}</span>
        </p>
        <div className="hero-lines">
          {hx.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <dl className="hero-stats">
          {hx.stats.map((s) => (
            <div className="hero-stat" key={s.label}>
              <dt>{s.value}</dt>
              <dd>
                {s.label} <EvChip id={s.ev} /> <Tag kind={s.tag} />
              </dd>
            </div>
          ))}
        </dl>
        <div className="hero-legend" aria-label="内容口径图例">
          <span className="hero-legend-k">页面中的口径标记：</span>
          {(Object.keys(TAG_INFO) as ContentTag[]).map((k) => (
            <Tag key={k} kind={k} />
          ))}
        </div>
        <a className="hero-cta" href="#chap-1">
          开始精读 <span aria-hidden="true">↓</span>
        </a>
        <nav className="hero-routes" aria-label="按目的选择阅读路线">
          {ROUTES.map((r) => (
            <a key={r.title} className="hero-route" href={r.href}>
              <b>{r.title}</b>
              <span>{r.path}</span>
            </a>
          ))}
        </nav>
      </div>
      <div className="hero-vs">
        <div className="hero-vs-cap">
          <span className="hero-vs-k">一图看懂</span>
          <span>同一片点云、同样 16 个名额：左边按“重要性”挑，右边按 Max-Min 挑</span>
          <Tag kind="demo" />
        </div>
        {Duel ? <Duel chapterId="hero" moduleId="duel" /> : null}
      </div>
    </header>
  );
}
