import { Fragment, memo } from 'react';
import type { MouseEvent } from 'react';
import { tutorial } from '../data/tutorial';
import { FormulaBlock, Panel } from '../modules/layout';
import type { ChapterDef } from '../types';
import { Module } from './Module';
import '../styles/series-chapter.css';

type ChapterProps = { ch: ChapterDef; index: number; go: (id: string) => void };

const chapters = tutorial.chapters;
const pruningQuestion = '同样只留 288 个图块，按注意力选和随机选，会留下哪些不同的位置？从哪一层开始，模型才真正少算？';

function ChapterModulesNav({ ch, go }: Pick<ChapterProps, 'ch' | 'go'>) {
  if (ch.modules.length < 2) return null;
  function jump(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    e.preventDefault();
    go(e.currentTarget.hash.slice(1));
  }
  return (
    <nav className="series-module-links" aria-label="本章实验">
      {ch.modules.map((m) => (
        <a key={m.id} href={'#module-' + m.id.replace('.', '-')} onClick={jump}>
          <b>{m.id}</b> {m.title} <span aria-hidden="true">↓</span>
        </a>
      ))}
    </nav>
  );
}

export const SeriesChapter = memo(function SeriesChapter({ ch, index, go }: ChapterProps) {
  const next = chapters[index + 1];
  const pruning = ch.id === 'chap-5';
  const showAnalogy = ch.id === 'chap-2' || ch.id === 'chap-4';
  const deep = ch.deepDive;

  return (
    <section className="chap series-chapter" id={ch.id} aria-labelledby={ch.id + '-title'}>
      <h2 className="chap-title" id={ch.id + '-title'}>
        <span className="num">§{index + 1}.</span>
        {ch.title}
        <span className="badge-tag">{ch.badgeLabel}</span>
      </h2>
      <nav className="flow-mini" aria-label="章节进度">
        {chapters.map((other, i) => (
          <Fragment key={other.id}>
            {i > 0 && <span className="flow-arrow" aria-hidden="true">→</span>}
            <button type="button" className={'flow-step' + (i === index ? ' is-on' : i < index ? ' is-done' : '')}
              title={other.title} aria-label={'第 ' + (i + 1) + ' 章，' + other.title}
              aria-current={i === index ? 'step' : undefined} onClick={() => go(other.id)}>
              §{i + 1}
            </button>
          </Fragment>
        ))}
      </nav>

      <div className="chap-bridge">
        <div className="cb-icon" aria-hidden="true">?</div>
        <div className="cb-body">
          <div className="cb-title">本节问题</div>
          <div className="cb-text sv-intro" dangerouslySetInnerHTML={{ __html: pruning ? pruningQuestion : ch.bridge }} />
          <ChapterModulesNav ch={ch} go={go} />
        </div>
      </div>
      {showAnalogy && ch.analogy && (
        <div className="analogy-card is-slim">
          <div className="analogy-body">
            <div className="analogy-kicker">舞台灯光 · 类比</div>
            <div className="analogy-title">{ch.analogy.title}</div>
            <p className="analogy-text" dangerouslySetInnerHTML={{ __html: ch.analogy.text }} />
          </div>
        </div>
      )}

      {ch.modules.map((m) => <Module key={m.id} module={m} chapterId={ch.id} />)}
      {ch.insight && (
        <div className="insight-bar">
          <b>洞察</b>　<span dangerouslySetInnerHTML={{ __html: ch.insight }} />
        </div>
      )}
      {ch.formula && <FormulaBlock f={ch.formula} />}
      {ch.panels?.map((id) => <Panel key={id} id={id} chapterId={ch.id} />)}

      {deep?.facts && (
        <div className="v9-facts">
          {deep.facts.map((f) => (
            <div key={f.label}>
              <b>{f.value}</b>
              <span dangerouslySetInnerHTML={{ __html: f.label }} />
            </div>
          ))}
        </div>
      )}
      {ch.takeaways.length > 0 && (
        <div className="embed-takeaway" aria-label="本章要点">
          {ch.takeaways.map((t, i) => (
            <Fragment key={t.title}>
              {i > 0 && <div className="et-arrow" aria-hidden="true">→</div>}
              <div className="et-item">
                <div className="et-icon">{i + 1}</div>
                <div className="et-title">{t.title}</div>
                <div className="et-desc" dangerouslySetInnerHTML={{ __html: t.desc }} />
              </div>
            </Fragment>
          ))}
        </div>
      )}
      {ch.pitfalls?.length ? (
        <div className="v9-pits">
          <div className="v9-pits-title">常见误区</div>
          <ul>{ch.pitfalls.map((p) => <li key={p} dangerouslySetInnerHTML={{ __html: p }} />)}</ul>
        </div>
      ) : null}
      {(deep || (!showAnalogy && ch.analogy)) && (
        <details className="v9-deep">
          <summary>深入阅读</summary>
          {deep && (
            <div className="v9-deep-block">
              <h5>{deep.title}</h5>
              {pruning && <p dangerouslySetInnerHTML={{ __html: ch.bridge }} />}
              {deep.paragraphs.map((p) => <p key={p} dangerouslySetInnerHTML={{ __html: p }} />)}
            </div>
          )}
          {!showAnalogy && ch.analogy && (
            <div className="v9-deep-block">
              <h5>{ch.analogy.title}</h5>
              <p dangerouslySetInnerHTML={{ __html: ch.analogy.text }} />
            </div>
          )}
        </details>
      )}
      <div className="chap-loader">
        <button type="button" className="chap-loader-btn" onClick={() => go(next?.id || 'closing')}>
          {next ? '继续 §' + (index + 2) + ' · ' + (next.nav || next.title) : '收束页 · 结论、术语与来源'}
          <span className="chap-loader-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
});
