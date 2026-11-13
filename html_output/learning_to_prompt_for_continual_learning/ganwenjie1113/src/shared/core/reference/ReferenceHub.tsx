import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TermRef } from "./TermRef";
import type { ReferenceEntry } from "./types";

const ReferenceContext = createContext<{ open: (id: string, showDetail?: boolean) => void; entries: ReferenceEntry[] }>({
  open: () => {},
  entries: [],
});

const pageNames: Record<string, string> = {
  P1: "问题与任务设定",
  P2: "ViT 图像序列",
  P3: "Transformer 计算",
  P4: "Prompt 调优",
  P5: "动态检索",
  P6: "完整分类",
  P7: "联合更新",
  P8: "持续运行",
  P9: "实验与证据",
  其他: "其他资料",
};

export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const { open, entries } = useContext(ReferenceContext);
  const entry = entries.find((item) => item.id === id);
  if (!entry) return <>{children ?? id}</>;
  return <TermRef entry={entry} onOpenReference={() => open(id)}>{children}</TermRef>;
}

export function ReferenceButton({ term, page, children = "推导与出处" }: { term?: string; page?: string; children?: ReactNode }) {
  const { open, entries } = useContext(ReferenceContext);
  return (
    <button type="button" className="text-button rk-reference-button" onClick={() => {
      const id = term ?? entries.find(entry => entry.page === page)?.id ?? entries[0]?.id;
      if (id) open(id, Boolean(term));
    }}>
      {children}<span aria-hidden="true"> ↗</span>
    </button>
  );
}

export function ReferenceProvider({ children, entries, title = "概念与资料", sourceLink }: {
  children: ReactNode;
  entries: ReferenceEntry[];
  title?: string;
  sourceLink?: { href: string; label: string };
}) {
  const titleId = useId();
  const entryId = useId();
  const termEntries = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
  const pages = [...new Set(entries.map((item) => item.page ?? "其他"))];
  const dialog = useRef<HTMLDialogElement>(null);
  const article = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState<string>(entries[0]?.id ?? "");
  const [activePage, setActivePage] = useState<string>(entries[0]?.page ?? "其他");
  const [history, setHistory] = useState<string[]>([]);
  const entry = termEntries[active] ?? entries[0];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const restore = () => opener.current?.focus({ preventScroll: true });
    element.addEventListener("close", restore);
    return () => element.removeEventListener("close", restore);
  }, []);

  function revealDetail() {
    requestAnimationFrame(() => {
      if (!dialog.current?.open) return;
      article.current?.focus({ preventScroll: true });
      article.current?.scrollIntoView({ block: "start" });
    });
  }

  const select = (id: string, remember = true) => {
    const next = termEntries[id];
    if (!next || id === active) return;
    if (remember && active) setHistory((items) => [...items, active]);
    setActivePage(next.page ?? "其他");
    setActive(id);
  };

  const selectPage = (page: string) => {
    const first = entries.find((item) => (item.page ?? "其他") === page);
    if (!first) return;
    setHistory([]);
    setActivePage(page);
    setActive(first.id);
  };

  const open = (id: string, showDetail = true) => {
    const next = termEntries[id];
    if (!next) return;
    opener.current = document.activeElement as HTMLElement | null;
    setHistory([]);
    setActivePage(next.page ?? "其他");
    setActive(id);
    if (!dialog.current?.open) dialog.current?.showModal();
    if (dialog.current) dialog.current.scrollTop = 0;
    if (showDetail) revealDetail();
  };

  return (
    <ReferenceContext.Provider value={{ open, entries }}>
      {children}
      <dialog
        role="dialog"
        ref={dialog}
        className="reference-dialog"
        aria-labelledby={titleId}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}
      >
        <div className="reference-shell">
          <header>
            <div>
              <p className="eyebrow">按需阅读 · CONCEPTS &amp; SOURCES</p>
              <h2 id={titleId}>{title}</h2>
            </div>
            <button type="button" className="close-button" aria-label="回到正文，关闭参考资料" onClick={() => dialog.current?.close()}>
              <span className="close-button-label">回到正文</span>
              <svg className="close-button-icon" aria-hidden="true" viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8" /></svg>
            </button>
          </header>

          {pages.length > 0 && <>
            <section className="reference-index" aria-label="按页面浏览术语">
              <p>沿学习顺序选择主题</p>
              <nav aria-label="页面主题">
                {pages.map((page) => <button type="button" key={page} aria-pressed={activePage === page} onClick={() => selectPage(page)}>
                  <strong>{page}</strong>
                  <span>{pageNames[page] ?? page}</span>
                  <small>{entries.filter((item) => (item.page ?? "其他") === page).length} 个概念</small>
                </button>)}
              </nav>
            </section>

            {entry && <>
              <nav className="reference-terms" aria-label={`${activePage} 术语`}>
                <span>{activePage} · 本页术语</span>
                {entries.filter((item) => (item.page ?? "其他") === activePage).map((item) =>
                  <button type="button" key={item.id} data-reference-term={item.id} aria-pressed={active === item.id} onClick={() => select(item.id)}>{item.name}</button>,
                )}
              </nav>

              <article ref={article} tabIndex={-1} data-reference-detail={active} aria-labelledby={entryId}>
                {entry.english && <p className="reference-english">{entry.english}</p>}
                <h3 id={entryId}>{entry.name}</h3>
                <p>{entry.definition}</p>
                {entry.role && <p className="reference-role"><strong>在当前场景中：</strong>{entry.role}</p>}
                {entry.confusion && <p className="quiet-note"><strong>容易混淆：</strong>{entry.confusion}</p>}
                {entry.detail}
                {(entry.related ?? []).some((id) => termEntries[id]) && <nav className="related-terms" aria-label="相关术语">
                  {(entry.related ?? []).filter((id) => termEntries[id]).map((id) =>
                    <button className="text-button" key={id} onClick={() => { select(id); revealDetail(); }}>{termEntries[id].name} ↗</button>,
                  )}
                </nav>}
                {history.length > 0 && <button className="text-button reference-back" onClick={() => {
                  const previous = history[history.length - 1];
                  setHistory((items) => items.slice(0, -1));
                  select(previous, false);
                  revealDetail();
                }}>← 返回上一条目</button>}
                {(entry.source || sourceLink) && <section className="source-note">
                  <h3>出处与教学边界</h3>
                  {entry.source && <p>{entry.source}</p>}
                  {sourceLink && <a href={sourceLink.href} target="_blank" rel="noreferrer">{sourceLink.label}</a>}
                </section>}
              </article>
            </>}
          </>}
        </div>
      </dialog>
    </ReferenceContext.Provider>
  );
}

export { ReferenceProvider as ReferenceHub };
