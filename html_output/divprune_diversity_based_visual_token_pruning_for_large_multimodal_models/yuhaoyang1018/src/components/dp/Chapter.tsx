import React, { useId, useState } from 'react';
import type { ChapterDef, DeepBlock, DeepDive } from '../../types';
import { widgetRegistry } from '../../modules/registry';
import { Rich, ScrollX } from '../../ui/kit';
import { FormulaX } from './FormulaX';
import { ModuleFrame } from './ModuleFrame';

// 章节版式（参照 FastV 版的节奏）：
// 片头卡 → 开场卡（本节作用 + 类比画布）→ 公式 → 交互模块 → 核对提示 → 洞察 → 精读（折叠，关键数字常驻）→ 要点与误区。

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
      <ul className="deep-list">
        {b.items.map((it, i) => (
          <li key={i}>
            <Rich text={it} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="tbl-wrap">
      <ScrollX label="可横向滚动的表格">
        <table className="tbl">
          <thead>
            <tr>
              {b.head.map((h) => (
                <th key={h} scope="col">
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

/** 精读：关键数字常驻；正文默认折叠，高度用 grid 0fr → 1fr 过渡。 */
function Deep({ d }: { d: DeepDive }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`deep ${open ? 'is-open' : ''}`}>
      <button type="button" className="deep-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span className="deep-k">精读</span>
        <span className="deep-t">{d.title}</span>
        <span className="deep-toggle">
          {open ? '收起' : '展开'}
          <i aria-hidden="true" />
        </span>
      </button>
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
      <div className="deep-collapse" id={id} hidden={!open}>
        <div className="deep-body">
          {d.blocks.map((b, j) => (
            <Block b={b} key={j} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Chapter({ ch, index, total }: { ch: ChapterDef; index: number; total: number }) {
  const Ana = ch.analogy.componentId ? widgetRegistry[ch.analogy.componentId] : undefined;
  const num = String(index + 1).padStart(2, '0');
  return (
    <section id={ch.id} className="chap" aria-labelledby={`${ch.id}-title`}>
      <header className="chap-card reveal">
        <div className="chap-num" aria-hidden="true">
          {num}
        </div>
        <div className="chap-headtext">
          <div className="chap-meta">
            <span>
              CHAPTER {num} / {String(total).padStart(2, '0')}
            </span>
            <span className="chap-badge">{ch.badgeLabel}</span>
          </div>
          <h2 id={`${ch.id}-title`} tabIndex={-1}>
            <span className="chap-title-mask">{ch.title}</span>
          </h2>
        </div>
      </header>

      <div className="intro reveal">
        <div className="intro-text">
          <div className="intro-k">本节作用</div>
          <p className="intro-bridge">
            <Rich text={ch.bridge} />
          </p>
          <div className="intro-ana">
            <div className="intro-ana-title">类比 · {ch.analogy.title}</div>
            <p>
              <Rich text={ch.analogy.text} />
            </p>
          </div>
        </div>
        <div className="intro-visual">{Ana ? <Ana chapterId={ch.id} moduleId="ana" /> : null}</div>
      </div>

      {(ch.formulas ?? []).map((f) => (
        <div className="reveal" key={f.label}>
          <FormulaX f={f} />
        </div>
      ))}

      {ch.modules.map((m) => (
        <div className="reveal" key={m.id}>
          <ModuleFrame module={m} chapterId={ch.id} />
        </div>
      ))}

      {ch.check ? (
        <div className="check reveal" role="note">
          <span className="check-k">核对</span>
          <p>
            <Rich text={ch.check} />
          </p>
        </div>
      ) : null}

      {ch.insight ? (
        <div className="insight reveal" role="note">
          <span className="insight-k">洞察</span>
          <p>
            <Rich text={ch.insight} />
          </p>
        </div>
      ) : null}

      {(ch.deepDives ?? []).map((d, i) => (
        <div className="reveal" key={i}>
          <Deep d={d} />
        </div>
      ))}

      <div className={`recap reveal ${ch.pitfalls?.length ? 'has-pit' : ''}`}>
        <div className="recap-take">
          <div className="recap-k">本章要点</div>
          <ol>
            {ch.takeaways.map((t) => (
              <li key={t.title}>
                <span className="recap-ic" aria-hidden="true">
                  {t.icon}
                </span>
                <span>
                  <b>{t.title}</b>
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
    </section>
  );
}
