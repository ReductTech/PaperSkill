import React, { useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import type { ChapterDef, DeepBlock, DeepDive, ModuleDef } from '../../types';
import { widgetRegistry } from '../../modules/registry';
import { Rich, ScrollX } from '../../ui/kit';
import { ErrorBoundary } from '../../ui/ErrorBoundary';
import { FormulaX } from './FormulaX';
import { ModuleFrame } from './ModuleFrame';

// 章节版式（第二版）：一句直白的问题 → 主角交互（先操作）→ 一句话结论 →
// “还想深入？”抽屉：以问题为入口（公式、核对、代码口径、精读、次要模块、要点与误区）。
// 不再使用固定的大标题卡与“本节作用”卡；类比只在难点章节出现，并放在它解释的模块之后。

function Block({ b }: { b: DeepBlock }) {
  if (b.type === 'p') {
    return (
      <p>
        <Rich text={b.text} />
      </p>
    );
  }
  if (b.type === 'list') {
    return (
      <ol className="deep-list">
        {b.items.map((it, i) => (
          <li key={i}>
            <Rich text={it} />
          </li>
        ))}
      </ol>
    );
  }
  return (
    <div className="tbl-wrap">
      <ScrollX label="可横向滚动的表格">
        <table className="tbl">
          <thead>
            <tr>
              {b.head.map((h, i) => (
                <th key={i} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      <Rich text={c} />
                    </th>
                  ) : (
                    <td key={j}>
                      <Rich text={c} />
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollX>
      {b.caption ? (
        <p className="tbl-cap">
          <Rich text={b.caption} />
        </p>
      ) : null}
    </div>
  );
}

function Deep({ d }: { d: DeepDive }) {
  return (
    <div className="deep">
      <h4 className="deep-t">{d.title}</h4>
      {d.facts?.length ? (
        <div className="deep-facts">
          {d.facts.map((f) => (
            <div className="deep-fact" key={f.label}>
              <div className="deep-fact-v">{f.value}</div>
              <div className="deep-fact-l">
                <Rich text={f.label} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="deep-body">
        {d.blocks.map((b, j) => (
          <Block b={b} key={j} />
        ))}
      </div>
    </div>
  );
}

function Analogy({ ch }: { ch: ChapterDef }) {
  const Ana = ch.analogy?.componentId ? widgetRegistry[ch.analogy.componentId] : undefined;
  if (!ch.analogy) return null;
  return (
    <aside className="ana-row reveal" aria-label={`打个比方：${ch.analogy.title}`}>
      <div className="ana-row-visual">
        {Ana ? (
          <ErrorBoundary name="类比画面">
            <Ana chapterId={ch.id} moduleId="ana" />
          </ErrorBoundary>
        ) : null}
      </div>
      <div className="ana-row-text">
        <div className="ana-row-k">打个比方 · {ch.analogy.title}</div>
        <p>
          <Rich text={ch.analogy.text} />
        </p>
        <p className="ana-row-note">类比只帮直觉；它和真实机制不一样的地方，以正文为准。</p>
      </div>
    </aside>
  );
}

/**
 * 抽屉：入口是给初学者看的“问题”，不是目录名。默认收起（内容仍在 DOM 中，hidden），
 * 点“还想深入？”整体展开；点某个问题则展开并滚到那一节（读者主动点击才滚动，不劫持滚动）。
 */
function Drawer({ ch, folded }: { ch: ChapterDef; folded: ModuleDef[] }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const asks = ch.asks ?? {};
  const sec = (k: string) => `${ch.id}-ask-${k}`;
  const items: { key: string; q: string; kind?: 'check' }[] = [];
  if (ch.formulas?.length) items.push({ key: 'formulas', q: asks.formulas ?? '公式怎么写？' });
  if (ch.check) items.push({ key: 'check', q: asks.check ?? '有哪些需要核对的地方？', kind: 'check' });
  folded.forEach((m) => items.push({ key: `m-${m.id}`, q: asks.folded?.[m.id] ?? m.title }));
  if (ch.deepDives?.length) items.push({ key: 'deep', q: asks.deep ?? ch.deepDives[0].title });
  items.push({ key: 'recap', q: asks.recap ?? '这里最容易误解什么？' });

  const goTo = (key: string) => {
    setOpen(true);
    window.setTimeout(() => {
      const el = document.getElementById(sec(key));
      if (!el) return;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      // 兜底：平滑滚动被节流时直接跳到位
      if (!reduced) window.setTimeout(() => Math.abs(el.getBoundingClientRect().top) > 60 && el.scrollIntoView({ block: 'start' }), 900);
    }, 60);
  };
  // 底部的“收起”：收起后把抽屉标题行带回视口顶部附近，读者停在本章结尾、而不是被带到下一章中间
  const headRef = useRef<HTMLDivElement>(null);
  const collapse = () => {
    setOpen(false);
    window.setTimeout(() => {
      const el = headRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: 'auto', block: 'center' });
      (el.querySelector('.ch-more-toggle') as HTMLButtonElement | null)?.focus({ preventScroll: true });
    }, 30);
  };
  const Ask = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <section className="ask" id={sec(k)} aria-label={items.find((i) => i.key === k)?.q}>
      <h4 className={`ask-q ${k === 'check' ? 'is-check' : ''}`}>
        <span aria-hidden="true">?</span>
        {items.find((i) => i.key === k)?.q}
      </h4>
      {children}
    </section>
  );

  return (
    <div className={`ch-more reveal ${open ? 'is-open' : ''}`} data-drawer="">
      <div className="ch-more-head" ref={headRef}>
        <button type="button" className="ch-more-toggle" aria-expanded={open} aria-controls={`${ch.id}-more`} onClick={() => setOpen((o) => !o)}>
          <span className="ch-more-k">{open ? '收起' : '还想深入？'}</span>
          <i aria-hidden="true" />
        </button>
        <div className="ch-more-asks" role="list">
          {items.map((it) => (
            <button type="button" role="listitem" key={it.key} className={`ch-more-ask ${it.kind === 'check' ? 'is-check' : ''}`} onClick={() => goTo(it.key)}>
              {it.q}
            </button>
          ))}
        </div>
      </div>
      <div className="ch-more-body" id={`${ch.id}-more`} ref={bodyRef} hidden={!open}>
        {ch.formulas?.length ? (
          <Ask k="formulas">
            {ch.formulas.map((f) => (
              <FormulaX f={f} key={f.label} />
            ))}
          </Ask>
        ) : null}
        {ch.check ? (
          <Ask k="check">
            <div className="check" role="note">
              <span className="check-k">核对</span>
              <p>
                <Rich text={ch.check} />
              </p>
            </div>
          </Ask>
        ) : null}
        {folded.map((m) => (
          <Ask k={`m-${m.id}`} key={m.id}>
            <ModuleFrame module={m} chapterId={ch.id} />
          </Ask>
        ))}
        {ch.deepDives?.length ? (
          <Ask k="deep">
            {ch.deepDives.map((d, i) => (
              <Deep d={d} key={i} />
            ))}
          </Ask>
        ) : null}
        <Ask k="recap">
          <div className={`recap ${ch.pitfalls?.length ? 'has-pit' : ''}`}>
            <div className="recap-take">
              <div className="recap-k">本章要点</div>
              <ol>
                {(ch.takeaways ?? []).map((t) => (
                  <li key={t.title}>
                    <b>{t.title}</b>
                    <span>
                      <Rich text={t.desc} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {ch.pitfalls?.length ? (
              <div className="recap-pit">
                <div className="recap-k pit">常见误区</div>
                <ul>
                  {ch.pitfalls.map((p, i) => (
                    <li key={i}>
                      <Rich text={p} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Ask>
        <button type="button" className="ch-more-close" onClick={collapse}>
          收起，回到本章 <span aria-hidden="true">↑</span>
        </button>
      </div>
    </div>
  );
}

export function Chapter({ ch, index, total }: { ch: ChapterDef; index: number; total: number }) {
  const num = String(index + 1).padStart(2, '0');
  const shown = ch.modules.filter((m) => !m.fold);
  const folded = ch.modules.filter((m) => m.fold);
  const core = shown.find((m) => m.core) ?? shown[0];
  const rest = shown.filter((m) => m !== core);
  const layout = ch.layout ?? 'wide';

  const head = (
    <header className="ch-head reveal">
      <div className="ch-mark">
        <span className="ch-num" aria-hidden="true">
          {num}
        </span>
        <span className="ch-meta">
          第 {index + 1} / {total} 章{ch.kicker ? ` · ${ch.kicker}` : ''}
        </span>
      </div>
      <h2 id={`${ch.id}-title`} tabIndex={-1} className="chap-title">
        <span className="chap-title-mask">{ch.title}</span>
      </h2>
      {ch.question ? (
        <p className="ch-q">
          <span className="ch-q-k">问题</span>
          <span>
            <Rich text={ch.question} />
          </span>
        </p>
      ) : null}
    </header>
  );

  const takeaway = ch.insight ? (
    <p className="ch-take reveal">
      <span className="ch-take-k">一句话</span>
      <span>
        <Rich text={ch.insight} />
      </span>
    </p>
  ) : null;

  const renderModule = (m: ModuleDef) => (
    <React.Fragment key={m.id}>
      <div className="reveal">
        <ModuleFrame module={m} chapterId={ch.id} />
      </div>
      {ch.analogy?.after === m.id ? <Analogy ch={ch} /> : null}
    </React.Fragment>
  );

  return (
    <section id={ch.id} className={`ch ch-${layout}`} aria-labelledby={`${ch.id}-title`}>
      {layout === 'split' && core ? (
        <div className="ch-split-grid">
          <div className="ch-split-side">
            {head}
            {takeaway}
          </div>
          <div className="ch-split-main">{renderModule(core)}</div>
        </div>
      ) : (
        <>
          {head}
          {core ? renderModule(core) : null}
          {takeaway}
        </>
      )}
      {rest.map(renderModule)}
      {ch.analogy && !ch.analogy.after ? <Analogy ch={ch} /> : null}
      <Drawer ch={ch} folded={folded} />
    </section>
  );
}
