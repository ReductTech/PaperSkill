import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';

// The tutorial is presented as a case file: the reader is the detective, each
// chapter is one dossier that must be examined by hand before it can be stamped
// and filed, and the filed dossiers accumulate into an evidence notebook.

const STORE_KEY = 'kg-gmm-case-v1';

interface SavedState {
  archived: string[];
  touched: string[];
  current: number;
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

const rankOf = (n: number) => {
  if (n >= 10) return '主办侦探 · 结案';
  if (n >= 7) return '主办侦探';
  if (n >= 3) return '二级侦探';
  return '见习侦探';
};

const pad = (n: number) => String(n).padStart(2, '0');

function loadState(): SavedState | null {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    if (!Array.isArray(parsed.archived)) return null;
    return {
      archived: parsed.archived.filter((x): x is string => typeof x === 'string'),
      touched: Array.isArray(parsed.touched) ? parsed.touched.filter((x): x is string => typeof x === 'string') : [],
      current: typeof parsed.current === 'number' ? parsed.current : 0,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const chapters = tutorial.chapters;
  const total = chapters.length;
  const bili = tutorial.bilibili || [];
  const hasBili = bili.length > 0;
  const verdictIndex = total + 1;
  const lastIndex = verdictIndex + (hasBili ? 1 : 0);

  const [archived, setArchived] = useState<string[]>([]);
  const [touched, setTouched] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [boardOpen, setBoardOpen] = useState(false);
  const [drawerShut, setDrawerShut] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setArchived(saved.archived);
      setTouched(saved.touched);
      setCurrent(Math.max(0, Math.min(saved.current, lastIndex)));
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ archived, touched, current }));
    } catch {
      /* storage might be unavailable; the case still works in memory */
    }
  }, [archived, touched, current, restored]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [current]);

  const archivedSet = useMemo(() => new Set(archived), [archived]);
  const touchedSet = useMemo(() => new Set(touched), [touched]);

  const openThrough = useMemo(() => {
    let n = 0;
    for (let i = 0; i < total; i++) {
      if (archivedSet.has(chapters[i].id)) n = i + 1;
      else break;
    }
    return n + 1;
  }, [archivedSet, chapters, total]);

  const isOpen = useCallback(
    (chapterIndex: number) => {
      const ch = chapters[chapterIndex - 1];
      if (archivedSet.has(ch.id)) return true;
      const prev = chapters[chapterIndex - 2];
      if (chapterIndex === 1) return true;
      return prev ? archivedSet.has(prev.id) : false;
    },
    [archivedSet, chapters]
  );

  const goTo = useCallback(
    (index: number) => {
      setCurrent(Math.max(0, Math.min(index, lastIndex)));
      setBoardOpen(false);
    },
    [lastIndex]
  );

  const markTouched = useCallback((id: string) => {
    setTouched((prev) => (prev.indexOf(id) >= 0 ? prev : prev.concat(id)));
  }, []);

  const archive = useCallback((id: string) => {
    setArchived((prev) => (prev.indexOf(id) >= 0 ? prev : prev.concat(id)));
  }, []);

  const reset = useCallback(() => {
    if (!window.confirm('重新开案会清空已归档的卷宗和物证簿，确定吗？')) return;
    setArchived([]);
    setTouched([]);
    setCurrent(0);
  }, []);

  const evidence = chapters
    .map((ch, i) => ({ ch, i }))
    .filter(({ ch }) => archivedSet.has(ch.id))
    .map(({ ch, i }) => ({
      id: ch.id,
      no: `CASE-${pad(i + 1)}`,
      title: ch.title,
      clue: stripHtml(ch.insight || ch.bridge),
      index: i + 1,
    }));

  const currentChapter = current >= 1 && current <= total ? chapters[current - 1] : null;
  const allFiled = archived.length >= total;

  return (
    <div className={`case-shell ${boardOpen ? 'board-open' : ''}`}>
      <header className="case-top">
        <button className="case-board-toggle" onClick={() => setBoardOpen(!boardOpen)}>
          <span>{boardOpen ? '收起卷宗板' : '卷宗板'}</span>
        </button>
        <div className="case-brand">
          <span className="case-brand-dept">市局物证鉴定室 · 调包案</span>
          <span className="case-brand-name">{tutorial.meta.titleZh || tutorial.meta.titleEn}</span>
        </div>
        <div className="case-status">
          <span className="case-status-rank">{rankOf(archived.length)}</span>
          <span className="case-status-count">
            已归档 {archived.length} / {total}
          </span>
          <button
            className="case-status-note"
            onClick={() => {
              const el = document.querySelector('.case-notebook');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            title="翻到物证簿"
          >
            物证簿 {evidence.length} 条
          </button>
          <button className="case-reset" onClick={reset} title="清空进度，重新开案">
            重新开案
          </button>
        </div>
        <div className="case-meter" aria-hidden="true">
          <span style={{ width: `${(archived.length / total) * 100}%` }} />
        </div>
      </header>

      <div className={`case-body ${drawerShut ? 'drawer-shut' : ''}`}>
        <aside className={`case-board ${drawerShut ? 'drawer-shut' : ''}`}>
          <div className="case-board-head">
            <div className="case-board-head-row">
              <h2>卷宗板</h2>
              <button
                className="case-board-fold"
                onClick={() => {
                  setDrawerShut(true);
                  setBoardOpen(false);
                }}
                title="收起卷宗板，腾出整页读卷宗"
              >
                收起 ‹
              </button>
            </div>
            <p>按顺序勘验。前一卷盖章归档，后一卷才会启封。</p>
          </div>
          <button
            className={`case-tab case-tab-brief ${current === 0 ? 'active' : ''}`}
            onClick={() => goTo(0)}
          >
            <span className="case-tab-no">简报</span>
            <span className="case-tab-title">案件简报</span>
            <span className="case-tab-state">{current === 0 ? '在读' : '已阅'}</span>
          </button>
          <div className="case-tabs">
            {chapters.map((ch, i) => {
              const index = i + 1;
              const filed = archivedSet.has(ch.id);
              const open = isOpen(index);
              return (
                <button
                  key={ch.id}
                  className={`case-tab ${current === index ? 'active' : ''} ${filed ? 'filed' : ''} ${
                    open ? '' : 'sealed'
                  }`}
                  onClick={() => (open ? goTo(index) : undefined)}
                  disabled={!open}
                  aria-disabled={!open}
                >
                  <span className="case-tab-no">{`CASE-${pad(index)}`}</span>
                  <span className="case-tab-title">{ch.title}</span>
                  <span className="case-tab-state">
                    {filed ? '已归档' : open ? '待勘验' : '未启封'}
                  </span>
                  {filed ? <i className="case-tab-stamp">归档</i> : null}
                </button>
              );
            })}
          </div>
          <button
            className={`case-tab case-tab-final ${current === verdictIndex ? 'active' : ''} ${
              allFiled ? '' : 'sealed'
            }`}
            onClick={() => (allFiled ? goTo(verdictIndex) : undefined)}
            disabled={!allFiled}
          >
            <span className="case-tab-no">结案</span>
            <span className="case-tab-title">结案陈词</span>
            <span className="case-tab-state">{allFiled ? '可宣读' : `缺 ${total - archived.length} 卷`}</span>
          </button>
        </aside>

        {drawerShut ? (
          <button
            className="case-drawer"
            onClick={() => {
              setDrawerShut(false);
              setBoardOpen(false);
            }}
            title="拉开卷宗板"
            aria-label="拉开卷宗板"
          >
            <span className="case-drawer-text">卷宗板</span>
            <span className="case-drawer-count">
              {archived.length}/{total}
            </span>
          </button>
        ) : null}

        <main className="case-sheet">
          {current === 0 ? (
            <section className="case-brief">
              <div className="case-brief-head">
                <p className="case-kicker">案件简报 · 只给你看的部分</p>
                <h1>{tutorial.meta.titleZh || tutorial.meta.titleEn}</h1>
                <p className="case-brief-sub">
                  {tutorial.meta.venue} · {tutorial.meta.domain}
                </p>
                <p className="case-role">
                  承办侦探：<b>小林</b>——就是你（{rankOf(archived.length)}）。你手上没有实验室，只有一间物证室、一台能跑的模型，
                  和十卷待勘验的案宗。
                </p>
                <p className="case-ref-note">
                  每卷页首夹一张「原文」摘录：章节号、图号或表号，加一句原话——故事只是壳，数字和式子都照 arXiv 2503.18403 原文。
                </p>
              </div>
              <Hero meta={tutorial.meta} hero={tutorial.hero} caseMode />
              <div className="case-brief-ask">
                <p>
                  <b>委托要求：</b>
                  {tutorial.meta.coreProblem}
                </p>
                <p>
                  <b>主办人的怀疑：</b>
                  {tutorial.meta.coreInsight}
                </p>
              </div>
              <div className="case-brief-actions">
                <button className="case-cta" onClick={() => goTo(1)}>
                  接受委托，翻开 CASE-01
                </button>
                {archived.length > 0 ? (
                  <button className="case-cta ghost" onClick={() => goTo(openThrough <= total ? openThrough : total)}>
                    接着上次的进度
                  </button>
                ) : null}
              </div>
            </section>
          ) : currentChapter ? (
            <Dossier
              chapter={currentChapter}
              index={current}
              total={total}
              filed={archivedSet.has(currentChapter.id)}
              touched={touchedSet.has(currentChapter.id)}
              onTouch={() => markTouched(currentChapter.id)}
              onArchive={() => archive(currentChapter.id)}
              onNext={() => goTo(Math.min(current + 1, verdictIndex))}
              onBoard={() => setBoardOpen(true)}
              allFiled={allFiled}
            />
          ) : current === verdictIndex ? (
            <Verdict
              chapters={chapters}
              evidence={evidence}
              onBoard={() => setBoardOpen(true)}
            />
          ) : hasBili ? (
            <BiliVideos items={bili} />
          ) : null}

          <section className="case-notebook" aria-label="物证簿">
            <div className="case-notebook-head">
              <h2>物证簿</h2>
              <span className="case-notebook-count">{evidence.length} 条已抄录</span>
            </div>
            <p className="case-notebook-hint">
              只有盖章归档的卷宗，结论才会抄进这里。它是你最后写结案陈词的底稿。
            </p>
            {evidence.length === 0 ? (
              <div className="case-notebook-empty">还没有归档任何一卷。先去实验台动手勘验。</div>
            ) : (
              <ol className="case-notebook-list">
                {evidence.map((e) => (
                  <li key={e.id}>
                    <button onClick={() => goTo(e.index)}>
                      <span className="case-note-no">{e.no}</span>
                      <span className="case-note-title">{e.title}</span>
                      <span className="case-note-clue">{e.clue}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="case-notebook-foot">
              <span>进度</span>
              <b>
                {archived.length} / {total}
              </b>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Dossier(props: {
  chapter: (typeof tutorial.chapters)[number];
  index: number;
  total: number;
  filed: boolean;
  touched: boolean;
  onTouch: () => void;
  onArchive: () => void;
  onNext: () => void;
  onBoard: () => void;
  allFiled: boolean;
}) {
  const { chapter, index, total, filed, touched, onTouch, onArchive, onNext, onBoard, allFiled } = props;
  const first = chapter.modules[0];
  const task = first ? `在实验台跑一遍「${stripHtml(first.title)}」，看过结果再回来盖章。` : '先把这一卷读完。';

  return (
    <section className={`dossier ${filed ? 'dossier-filed' : ''}`}>
      <div className="dossier-head">
        <div className="dossier-head-left">
          <span className="dossier-no">{`CASE-${pad(index)}`}</span>
          <span className={`dossier-badge ${chapter.badge}`}>{chapter.badgeLabel}</span>
        </div>
        <h1>{chapter.title}</h1>
        <p className="dossier-meta">
          第 {index} 卷 / 共 {total} 卷 · 承办：你（小林）· 案由：博物馆归还品调包
        </p>
        {chapter.paper ? (
          <div className="dossier-paper">
            <span className="dossier-paper-tag">原文</span>
            <span className="dossier-paper-loc">{chapter.paper.loc}</span>
            <p className="dossier-paper-quote">{chapter.paper.quote}</p>
          </div>
        ) : null}
        {filed ? (
          <div className="dossier-stamp" aria-label="已归档">
            <span>已归档</span>
            <i>小林</i>
          </div>
        ) : null}
      </div>

      <div className="dossier-block dossier-brief">
        <h3>
          <span>一</span>委托摘要
        </h3>
        <ChapterBridge text={chapter.bridge} />
        <p className="dossier-task">
          <b>你的任务</b>
          {task}
        </p>
      </div>

      <div className="dossier-block dossier-scene">
        <h3>
          <span>二</span>现场重建
        </h3>
        <AnalogyCard analogy={chapter.analogy} chapterId={chapter.id} />
      </div>

      <div className={`dossier-block dossier-lab ${touched ? 'touched' : ''}`} onPointerDownCapture={onTouch}>
        <h3>
          <span>三</span>勘验实验
        </h3>
        <p className="dossier-lab-hint">
          {touched ? '勘验记录已落笔，可以盖章了。' : '只读不做，卷宗不认账：先在这里动手一次。'}
        </p>
        {chapter.modules.map((m) => (
          <Module key={m.id} module={m} chapterId={chapter.id} />
        ))}
      </div>

      {chapter.insight ? (
        <div className="dossier-block dossier-verdict">
          <h3>
            <span>四</span>勘验结论
          </h3>
          <InsightBar text={chapter.insight} />
        </div>
      ) : null}

      {chapter.formula ? (
        <div className="dossier-block dossier-anex">
          <details>
            <summary>
              <span className="dossier-anex-tag">技术附注</span>
              法医报告里的写法与符号
            </summary>
            <p className="dossier-anex-lead">结论要能复现，附注里得留下这套记法。</p>
            <Formula formula={chapter.formula} />
          </details>
        </div>
      ) : null}

      <div className="dossier-block dossier-archive">
        <h3>
          <span>五</span>归档要点
        </h3>
        <Takeaway items={chapter.takeaways} />
        <div className="dossier-archive-actions">
          <button className="case-cta" onClick={onArchive} disabled={!touched || filed}>
            {filed ? '本卷已归档' : touched ? '盖章归档，写入物证簿' : '先去实验台动手，才能盖章'}
          </button>
          {filed ? (
            <button className="case-cta ghost" onClick={onNext} disabled={!allFiled && index >= total}>
              {index >= total ? '全案归档，去写结案陈词' : '前往下一卷'}
            </button>
          ) : (
            <button className="case-cta ghost" onClick={onBoard}>
              回卷宗板
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Verdict(props: {
  chapters: (typeof tutorial.chapters)[number][];
  evidence: { id: string; no: string; title: string; clue: string; index: number }[];
  onBoard: () => void;
}) {
  const { chapters, evidence, onBoard } = props;
  return (
    <section className="verdict">
      <div className="verdict-head">
        <p className="case-kicker">结案陈词</p>
        <h1>十卷归案，调包案结</h1>
        <p>
          从只认大类的“一句话描述”，到挂着 r=3 条关系去比对，你手上这十卷案宗其实只讲了一件事：
          模型认出证物，靠的不是形容词写得多细，而是它和窑口、底款、纹样这些关系绑得够不够准。
        </p>
      </div>
      <div className="verdict-ledger">
        <h3>全案证据链</h3>
        <ol>
          {evidence.map((e) => (
            <li key={e.id}>
              <span className="case-note-no">{e.no}</span>
              <b>{e.title}</b>
              <span className="case-note-clue">{e.clue}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="verdict-tables">
        <p className="verdict-tables-cap">结案报告对照论文原表（同一协议抄录）</p>
        <ul>
          <li>
            <span>表 1 · ImageNet-R B0-10</span>
            <b>84.29</b>
            <span className="old">对 80.72</span>
            <em>+3.57</em>
          </li>
          <li>
            <span>表 2 · Mini-ImageNet</span>
            <b>78.07</b>
            <span className="old">对 75.18</span>
            <em>+2.89</em>
          </li>
          <li>
            <span>表 3 · CIFAR-100</span>
            <b>79.68</b>
            <span className="old">对 75.43</span>
            <em>+4.25</em>
          </li>
        </ul>
      </div>
      <div className="verdict-sign">
        <span>承办侦探 小林（你）</span>
        <span>{chapters.length} 卷 · 全部归档</span>
        <span className="verdict-stamp">结案</span>
      </div>
      <button className="case-cta ghost" onClick={onBoard}>
        回卷宗板复核
      </button>
    </section>
  );
}
