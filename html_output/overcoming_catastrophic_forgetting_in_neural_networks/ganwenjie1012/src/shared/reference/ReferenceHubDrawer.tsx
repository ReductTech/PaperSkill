import { useEffect, useMemo, useRef, useState } from "react";
import { MobileSheet } from "../foundation/overlay/MobileSheet";
import { referenceRegistry } from "../../data/referenceRegistry";
import type { AnyReference } from "./types";
import { useReferenceApi } from "./ReferenceProvider";

function searchableText(item: AnyReference): string {
  return [item.id, item.title, item.fullName, item.summary, item.role, item.roleInEWC, item.confusion,
    item.boundary, item.sourceCategory, ...(item.keywords ?? []), ...(item.tags ?? []), ...(item.sourceRefs ?? [])]
    .filter(Boolean).join(" ").toLocaleLowerCase();
}

export function ReferenceHubDrawer() {
  const api = useReferenceApi();
  const [query, setQuery] = useState("");
  const entries = useMemo(() => Object.values(referenceRegistry).filter((item): item is AnyReference => Boolean(item)), []);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return search ? entries.filter((item) => searchableText(item).includes(search)) : entries;
  }, [entries, query]);
  const selected = filtered.find((item) => item.id === api.hubReferenceId) ?? filtered[0];
  const detailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (api.hubOpen && selected && selected.id !== api.hubReferenceId) api.openHub(selected.id);
  }, [api.hubOpen, api.hubReferenceId, selected, api.openHub]);
  useEffect(() => { if (detailRef.current) detailRef.current.scrollTop = 0; }, [selected?.id, api.hubOpen]);
  useEffect(() => { if (!api.hubOpen) setQuery(""); }, [api.hubOpen]);

  useEffect(() => {
    if (!api.hubOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [api.hubOpen]);

  const sourceList = (refs?: string[]) => refs?.length ? refs.join(", ") : "Tutorial notes";
  const kindLabels: Record<string, string> = { term:"Term", symbol:"Symbol", formula:"Formula", dataset:"Dataset", environment:"Environment", method:"Method", phase:"Phase", evidence:"Evidence", confusion:"Common confusion", implementation:"Implementation", advanced:"Advanced" };
  const sourceLabels: Record<string, string> = { PAPER_FACT:"Paper fact", PAPER_RESULT:"Paper result", AUTHOR_INTERPRETATION:"Author interpretation", GENERAL_BACKGROUND:"General background", MECHANISM_INTERPRETATION:"Mechanism interpretation", IMPLEMENTATION_MAPPING:"Implementation mapping", TEACHING_EXAMPLE:"Teaching example", LIMITATION:"Limitation" };

  return (
    <div className="ewc-reference-hub-shell"><MobileSheet open={api.hubOpen} title="Reference Hub" onClose={api.closeHub}>
      <div className="ewc-hub">
        <div className="ewc-hub__intro">
          <p>Review terminology, mathematical background, and each concept’s role in EWC. Scroll the two panes independently; selecting an entry opens its detail at the top.</p>
          <label className="ewc-hub__search">Search references
            <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="e.g. Fisher, posterior, parameter anchor" />
          </label>
        </div>
        <div className="ewc-hub__columns">
          <div className="ewc-hub__list" aria-label="Reference entries">
            <p className="ewc-hub__count">{filtered.length} entries</p>
            {filtered.map((item) => (
              <button key={item.id} type="button" className={`ewc-hub__item ${selected?.id === item.id ? "is-selected" : ""}`} onClick={() => api.openHub(item.id)} aria-pressed={selected?.id === item.id}>
                <span className="ewc-hub__item-title">{item.title}</span>
                <span className="ewc-hub__item-kind">{kindLabels[item.kind]}</span>
                <span className="ewc-hub__item-summary">{item.summary}</span>
              </button>
            ))}
            {!filtered.length ? <p className="ewc-hub__empty">No matching entries. Try another search.</p> : null}
          </div>
          <article ref={detailRef} className="ewc-hub__detail" aria-live="polite" tabIndex={0} aria-label="Selected reference details">
            {selected ? <>
              <span className="ewc-hub__detail-kind">{kindLabels[selected.kind]} · {sourceLabels[selected.sourceCategory ?? ""] ?? "Tutorial notes"}</span>
              <h3>{selected.title}</h3>
              {"symbol" in selected ? <div className="ewc-hub__math">{selected.symbol}</div> : null}
              {"expression" in selected ? <div className="ewc-hub__math">{selected.expression}</div> : null}
              <p>{selected.summary}</p>
              <section><h4>Role in EWC</h4><p>{selected.roleInEWC ?? selected.role}</p></section>
              {selected.details?.length ? <section><h4>Origins, mechanisms, and examples</h4><dl className="ewc-hub__details">{selected.details.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.text}{detail.sourceRefs?.length ? <small> ({sourceList(detail.sourceRefs)})</small> : null}</dd></div>)}</dl></section> : null}
              {"experiment" in selected ? <section><h4>Experimental setting</h4><p>{selected.experiment}</p><p>{selected.interpretation}</p></section> : null}
              {selected.confusion ? <section className="ewc-hub__note"><h4>Common confusions</h4><p>{selected.confusion}</p></section> : null}
              {selected.boundary ? <section className="ewc-hub__note"><h4>Scope and limitations</h4><p>{selected.boundary}</p></section> : null}
              <section><h4>Sources and evidence</h4><p>{sourceLabels[selected.sourceCategory ?? ""] ?? "Tutorial notes"} · {sourceList(selected.sourceRefs)}</p>{"sourceLocator" in selected ? <p>{selected.sourceLocator}</p> : null}</section>
              {selected.relatedPages?.length ? <section><h4>Related pages</h4><div className="ewc-hub__links">{selected.relatedPages.map((target) => <button key={`${target.pageId}-${target.anchorId ?? "top"}`} type="button" onClick={() => api.openReference({ pageId: target.pageId, anchorId: target.anchorId })}>Page {Number(target.pageId.split("-")[1])} →</button>)}</div></section> : null}
              {selected.relatedIds?.length ? <section><h4>Related references</h4><div className="ewc-hub__links">{selected.relatedIds.filter(id => referenceRegistry[id]).map((id) => <button key={id} type="button" onClick={() => { setQuery(""); api.openHub(id); }}>{referenceRegistry[id]?.title}</button>)}</div></section> : null}
            </> : <p>Select an entry to view its details.</p>}
          </article>
        </div>
        <p className="ewc-hub__scope">Entries distinguish paper facts, general background, teaching examples, and implementation mappings. The main reasoning remains in the paper pages.</p>
      </div>
    </MobileSheet></div>
  );
}
