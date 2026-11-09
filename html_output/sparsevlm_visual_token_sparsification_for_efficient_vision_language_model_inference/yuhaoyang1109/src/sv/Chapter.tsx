import React from 'react';
import { widgetRegistry } from '../modules/registry';
import { tutorial } from '../data/tutorial';
import { FormulaHtml, Rich } from './Rich';
import type { ChapterText } from './content';

// 一章 = 一张卡片，自上而下：本节问题 → 类比（只在难点章）→ 交互模块 → 洞察 → 公式 → 符号与推导 → 核对
// → 关键数字 → 要点 → 常见误区 → 深入阅读（折叠）→ 继续下一章。版式取自 VTW v7.3 的 vtw9/Chapter.tsx。

const SCENES = tutorial.chapters.flatMap((c) => c.scenes);
const MODS = tutorial.chapters.flatMap((c) => c.modules);

export function ModuleCard({ id, componentId, desc, chapterId, title, notes }: { id: string; componentId: string; desc: string; chapterId: string; title?: string; notes?: string }) {
  const Widget = widgetRegistry[componentId];
  const t = title ?? MODS.find((m) => m.id === id)?.title ?? '';
  const n = notes ?? SCENES.find((s) => s.moduleId === id)?.notes ?? '';
  return (
    <section className="module" id={`m-${id}`}>
      <div className="module-head">
        <span className="num">{id}</span>
        <h4>{t}</h4>
      </div>
      <div className="module-body">
        <p className="module-desc">{desc}</p>
        {Widget ? <Widget chapterId={chapterId} moduleId={id} /> : null}
        {n ? (
          <details className="v9-notes">
            <summary>出处与口径</summary>
            <div className="v9-notes-body">{n}</div>
          </details>
        ) : null}
      </div>
    </section>
  );
}

export function ChapterView({ ch, all, onJump, next }: { ch: ChapterText; all: ChapterText[]; onJump: (n: number) => void; next: { label: string; go: () => void } }) {
  const s = ch.show;
  return (
    <section className="chap" id={ch.id} aria-labelledby={`${ch.id}-t`}>
      <h2 className="chap-title" id={`${ch.id}-t`}>
        <span className="num">§{ch.num}.</span>
        {ch.title}
        <span className="badge-tag">{ch.badge}</span>
      </h2>
      <nav className="flow-mini" aria-label="章节进度">
        {all.map((x, i) => (
          <React.Fragment key={x.id}>
            {i > 0 ? <span className="flow-arrow" aria-hidden="true">→</span> : null}
            <button type="button" className={`flow-step ${x.num === ch.num ? 'is-on' : x.num < ch.num ? 'is-done' : ''}`} aria-current={x.num === ch.num ? 'step' : undefined} title={x.title} onClick={() => onJump(x.num)}>
              §{x.num}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="chap-bridge">
        <div className="cb-icon" aria-hidden="true">?</div>
        <div className="cb-body">
          <div className="cb-title">本节问题</div>
          <div className="cb-text sv-intro">
            <Rich text={ch.intro} />
          </div>
        </div>
      </div>

      {ch.analogy ? (
        <div className="analogy-card is-slim">
          <div className="analogy-body">
            <div className="analogy-kicker">展览评审 · 类比</div>
            <div className="analogy-title">{ch.analogy.title}</div>
            <p className="analogy-text">{ch.analogy.story}</p>
            <p className="analogy-bound">
              <b>类比边界</b>　{ch.analogy.boundary}
            </p>
          </div>
        </div>
      ) : null}

      {ch.modules.map((m) => (
        <ModuleCard key={m.id} id={m.id} componentId={m.componentId} desc={m.desc} chapterId={ch.id} />
      ))}

      {s.insight && ch.insight ? (
        <div className="insight-bar">
          <b>洞察</b>　<Rich text={ch.insight} />
        </div>
      ) : null}

      {s.formulas
        ? (ch.formulas ?? []).map((f) => (
            <div className="formula-explain" key={f.label}>
              <p className="fe-hint">{f.label}　悬停、聚焦或点按带下划线的符号，查看含义</p>
              <div className="fe-formula">
                <FormulaHtml html={f.html} symbols={f.symbols} />
              </div>
              <p className="fe-note">
                <Rich text={f.plain} />
              </p>
            </div>
          ))
        : null}

      {s.derive && ch.derive?.length ? (
        <div className="sv-derive">
          <b>符号与推导</b>
          {ch.derive.map((d) => (
            <span key={d}>
              <Rich text={d} />
            </span>
          ))}
        </div>
      ) : null}

      {s.check && ch.check ? (
        <div className="v9-check">
          <b>核对</b>　<Rich text={ch.check} />
        </div>
      ) : null}

      {s.facts && ch.facts?.length ? (
        <div className="v9-facts">
          {ch.facts.map((f) => (
            <div key={f.value + f.label}>
              <b>{f.value}</b>
              <span>
                <Rich text={f.label} /> <Rich text={`[[tag:${f.tag}]]`} />
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {s.takeaways && ch.takeaways?.length ? (
        <div className="embed-takeaway">
          {ch.takeaways.map((t, i) => (
            <React.Fragment key={t.title}>
              {i > 0 ? <div className="et-arrow" aria-hidden="true">→</div> : null}
              <div className="et-item">
                <div className="et-icon">{i + 1}</div>
                <div className="et-title">{t.title}</div>
                <div className="et-desc">
                  <Rich text={t.desc} />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {s.pitfalls && ch.pitfalls?.length ? (
        <div className="v9-pits">
          <div className="v9-pits-title">常见误区</div>
          <ul>
            {ch.pitfalls.map((p) => (
              <li key={p}>
                <Rich text={p} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {s.deep && ch.deep?.length ? (
        <details className="v9-deep">
          <summary>深入阅读</summary>
          {ch.deep.map((d) => (
            <div key={d.title} className="v9-deep-block">
              <h5>{d.title}</h5>
              {(d.paras ?? []).map((p) => (
                <p key={p}>
                  <Rich text={p} />
                </p>
              ))}
              {d.list ? (
                <ul className="sv-deep-list">
                  {d.list.map((it) => (
                    <li key={it}>
                      <Rich text={it} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </details>
      ) : null}

      <div className="chap-loader">
        <button type="button" className="chap-loader-btn" onClick={next.go}>
          {next.label}
          <span className="chap-loader-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
