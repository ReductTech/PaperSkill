import { useEffect, useMemo, useState } from "react";
import type { ReferenceItem, ReferenceKind } from "./types";

const KINDS: ReferenceKind[] = ["term", "symbol", "formula", "dataset", "method", "evidence", "implementation", "advanced"];
const KIND_LABELS: Record<ReferenceKind, string> = { term: "术语", symbol: "符号", formula: "公式", dataset: "数据集", method: "方法", evidence: "证据", implementation: "实现", advanced: "进阶" };

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
      <header className="rk-reference-hub__heading"><div><h2>{title}</h2><p>查找术语、方法、证据与实现说明。</p></div><span>{filtered.length} 条</span></header>
      <div className="rk-reference-hub__filters">
        <label>搜索参考条目<input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="输入术语或符号" /></label>
        <label>类别<select value={kind} onChange={(event) => setKind(event.currentTarget.value as ReferenceKind | "all")}><option value="all">全部类别</option>{KINDS.map((value) => <option key={value} value={value}>{KIND_LABELS[value]}</option>)}</select></label>
      </div>
      <div className="rk-reference-hub__grid">
        <ul className="rk-reference-hub__list" aria-label="Reference entries">
          {filtered.map((item) => (
            <li key={item.id}><button id={`ref-${item.id}`} type="button" className={selectedId === item.id ? "is-selected" : ""} onClick={() => select(item)} aria-current={selectedId === item.id ? "true" : undefined}>
              <span><b>{item.title}</b><small>{item.summary}</small></span><span className="rk-reference-hub__kind">{KIND_LABELS[item.kind]}</span>
            </button></li>
          ))}
          {!filtered.length ? <li className="rk-reference-hub__empty">没有匹配的参考条目。</li> : null}
        </ul>
        <article className="rk-reference-hub__detail" aria-live="polite">
          {selected ? <><span className="rk-reference-hub__kind">{KIND_LABELS[selected.kind]}</span><h3>{selected.title}</h3><p>{selected.summary}</p>{selected.content}<div className="rk-reference-hub__tags">{selected.tags?.filter(Boolean).map((tag) => <span key={tag}>{tag}</span>)}</div>{selected.relatedSection ? <a href={`#${selected.relatedSection}`}>跳转到相关章节</a> : null}</> : <p>选择一个条目查看详情。</p>}
        </article>
      </div>
    </section>
  );
}
