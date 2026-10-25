import React from 'react';
import { tutorial } from '../../data/tutorial';
import { widgetRegistry } from '../../modules/registry';
import { EvChip, Tag, TAG_INFO } from '../../ui/kit';
import { ErrorBoundary } from '../../ui/ErrorBoundary';
import { useReducedMotion } from '../../lib/hooks';
import { jumpTo } from './Nav';
import type { ContentTag } from '../../types';

export function Hero() {
  const hx = tutorial.heroX!;
  const Stage = widgetRegistry['hero-tide'];
  const reduced = useReducedMotion();
  return (
    <header className="hero" id="top">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-kicker">{hx.kicker}</div>
          <h1 className="hero-title" tabIndex={-1}>
            <span className="hero-word">VTW</span>
            <span className="hero-sub">先看 K 层，再撤出视觉 Token</span>
          </h1>
          <p className="hero-en">{tutorial.meta.titleEn}</p>
          <p className="hero-authors">
            {tutorial.meta.authors}
            <br />
            <span>
              {tutorial.meta.venue} · 2025-04-11 ·{' '}
              <a href="https://doi.org/10.1609/aaai.v39i5.32567" target="_blank" rel="noopener noreferrer">
                DOI 10.1609/aaai.v39i5.32567
              </a>
            </span>
          </p>
          <div className="hero-lines">
            {hx.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </div>
        <div className="hero-stage">
          <ErrorBoundary name="封面舞台">{Stage ? <Stage chapterId="hero" moduleId="hero" /> : null}</ErrorBoundary>
        </div>
      </div>

      <dl className="hero-stats">
        {hx.stats.map((s) => (
          <div className="hero-stat" key={s.label}>
            <dt>{s.value}</dt>
            <dd>
              {s.label}
              <span className="hero-stat-tags">
                <EvChip id={s.ev} /> <Tag kind={s.tag} />
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <nav className="routes" aria-label="三条阅读路线">
        <div className="routes-k">按目的选一条路线</div>
        <div className="routes-grid">
          {tutorial.routes!.map((r, i) => (
            <div className={`route route-${r.id}`} key={r.id}>
              <div className="route-num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h2 className="route-t">{r.title}</h2>
              <p className="route-who">{r.who}</p>
              <ol className="route-stops">
                {r.stops.map((s) => (
                  <li key={s.target}>{s.label}</li>
                ))}
              </ol>
              <a
                className="route-go"
                href={`#${r.stops[0].target}`}
                onClick={(e) => {
                  e.preventDefault();
                  jumpTo(r.stops[0].target, reduced);
                }}
              >
                从第一站开始：{r.stops[0].label} <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>
      </nav>

      <div className="hero-legend" aria-label="内容口径图例">
        <span className="hero-legend-k">页面中的口径标记（可点按查看说明）：</span>
        {(Object.keys(TAG_INFO) as ContentTag[]).map((k) => (
          <Tag key={k} kind={k} />
        ))}
      </div>
    </header>
  );
}
