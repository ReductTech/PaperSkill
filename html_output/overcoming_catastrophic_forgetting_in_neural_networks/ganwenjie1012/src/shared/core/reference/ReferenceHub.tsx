import { useEffect, useMemo, useState } from "react";
import type { ReferenceItem, ReferenceKind } from "./types";

const KINDS: ReferenceKind[] = ["term", "symbol", "formula", "dataset", "method", "evidence", "implementation", "advanced"];

export function ReferenceHub({ items, title = "Reference Hub", onOpen }: { items: ReferenceItem[]; title?: string; onOpen?: (item: ReferenceItem) => void }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ReferenceKind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return items.filter((item) => (kind === "all" || item.kind === kind) && (!search || [item.title, item.summary, ...(item.tags ?? [])].join(" ").toLocaleLowerCase().includes(search)));
  }, [items, kind, query]);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    const match = window.location.hash.match(/^#ref-(.+)$/);
    if (match && items.some((item) => item.id === decodeURIComponent(match[1]))) setSelectedId(decodeURIComponent(match[1]));
  }, [items]);

  const select = (item: ReferenceItem) => {
    setSelectedId(item.id);
    onOpen?.(item);
    window.history.replaceState(null, "", `#ref-${encodeURIComponent(item.id)}`);
  };

  return (
    <section className="rk-reference-hub" aria-label={title}>
      <header className="rk-reference-hub__heading"><div><h2>{title}</h2><p>Search terms, methods, evidence, and implementation notes.</p></div><span>{filtered.length} items</span></header>
      <div className="rk-reference-hub__filters">
        <label>Search references<input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search" /></label>
        <label>Category<select value={kind} onChange={(event) => setKind(event.currentTarget.value as ReferenceKind | "all")}><option value="all">All categories</option>{KINDS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
      <div className="rk-reference-hub__grid">
        <ul className="rk-reference-hub__list" aria-label="Reference entries">
          {filtered.map((item) => (
            <li key={item.id}><button id={`ref-${item.id}`} type="button" className={selectedId === item.id ? "is-selected" : ""} onClick={() => select(item)} aria-current={selectedId === item.id ? "true" : undefined}>
              <span><b>{item.title}</b><small>{item.summary}</small></span><span className="rk-reference-hub__kind">{item.kind}</span>
            </button></li>
          ))}
          {!filtered.length ? <li className="rk-reference-hub__empty">No references match this search.</li> : null}
        </ul>
        <article className="rk-reference-hub__detail" aria-live="polite">
          {selected ? <><span className="rk-reference-hub__kind">{selected.kind}</span><h3>{selected.title}</h3><p>{selected.summary}</p>{selected.content}<div className="rk-reference-hub__tags">{selected.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>{selected.relatedSection ? <a href={`#${selected.relatedSection}`}>Jump to related section</a> : null}</> : <p>Select a reference to open its details.</p>}
        </article>
      </div>
    </section>
  );
}
