import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TermRef } from "../shared/core/reference/TermRef";
import { asKitTerm, termEntries } from "./term-data";
import type { TermId } from "./term-data";
export type { TermId } from "./term-data";

const ReferenceContext = createContext<(term: TermId) => void>(() => {});
export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const open = useContext(ReferenceContext);
  return <TermRef entry={asKitTerm(termEntries[id])} onOpenReference={() => open(id)}>{children}</TermRef>;
}
export function ReferenceButton({ term = "kl", children = "推导与出处" }: { term?: TermId; children?: ReactNode }) {
  const open = useContext(ReferenceContext);
  return <button type="button" className="text-button" onClick={() => open(term)}>{children}<span aria-hidden="true"> ↗</span></button>;
}
export function ReferenceProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<TermId>("kl");
  const [history, setHistory] = useState<TermId[]>([]);
  const opener = useRef<HTMLElement | null>(null);
  const article = useRef<HTMLElement>(null);
  const entry = termEntries[active];
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const restore = () => opener.current?.focus({ preventScroll: true });
    element.addEventListener("close", restore);
    return () => element.removeEventListener("close", restore);
  }, []);
  const select = (id: TermId, remember = true) => {
    if (id === active) return;
    if (remember) setHistory((items) => [...items, active]);
    setActive(id);
  };
  useEffect(() => {
    if (!dialog.current?.open) return;
    dialog.current.scrollTop = 0;
    article.current?.focus({ preventScroll: true });
  }, [active]);
  const open = (id: TermId) => {
    opener.current = document.activeElement as HTMLElement | null;
    setActive(id); setHistory([]);
    if (!dialog.current?.open) dialog.current?.showModal();
    if (dialog.current) dialog.current.scrollTop = 0;
  };
  return <ReferenceContext.Provider value={open}>{children}<dialog role="dialog" ref={dialog} className="reference-dialog" aria-labelledby="reference-title" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="reference-shell"><header><div><p className="eyebrow">按需阅读 · REFERENCE</p><h2 id="reference-title">推导与出处</h2></div><button type="button" className="close-button" aria-label="关闭参考资料" onClick={() => dialog.current?.close()}>回到正文 <span aria-hidden="true">×</span></button></header><nav aria-label="参考术语">{Object.values(termEntries).map((item) => <button type="button" key={item.id} data-reference-term={item.id} aria-pressed={active === item.id} onClick={() => select(item.id)}>{item.name}</button>)}</nav><article ref={article} tabIndex={-1} data-reference-detail={active} aria-labelledby="entry-title"><p className="reference-english">{entry.english}</p><h3 id="entry-title">{entry.name}</h3><p>{entry.definition}</p><p className="reference-role"><strong>在当前场景中：</strong>{entry.role}</p><p className="quiet-note"><strong>容易混淆：</strong>{entry.confusion}</p>{entry.detail}<nav className="related-terms" aria-label="相关术语">{entry.related.map((id) => <button className="text-button" key={id} onClick={() => select(id)}>{termEntries[id].name} ↗</button>)}</nav>{history.length > 0 && <button className="text-button reference-back" onClick={() => { const previous = history[history.length - 1]; setHistory((items) => items.slice(0, -1)); select(previous, false); }}>← 返回上一条目</button>}<section className="source-note"><h3>出处与教学边界</h3><p>{entry.source}</p><a href="https://arxiv.org/abs/2004.07211v2" target="_blank" rel="noreferrer">Buzzega 等，NeurIPS 2020 · arXiv v2 ↗</a></section></article></div></dialog></ReferenceContext.Provider>;
}
