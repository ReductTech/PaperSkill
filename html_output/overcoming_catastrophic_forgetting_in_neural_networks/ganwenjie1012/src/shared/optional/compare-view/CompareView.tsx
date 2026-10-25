import { SegmentedControl } from "../../foundation/controls/SegmentedControl";
import type { ReactNode } from "react";
import { useState } from "react";

export type ComparePanel = { id: string; title: string; summary?: string; content?: ReactNode; points?: string[] };
export type CompareViewMode = "side-by-side" | "before-after" | "invariant-changing";

export function CompareView({ variants, changes = [], invariants = [], initialMode = "invariant-changing" }: { variants: [ComparePanel, ComparePanel]; changes?: string[]; invariants?: string[]; initialMode?: CompareViewMode }) {
  const [mode, setMode] = useState<CompareViewMode>(initialMode);
  const options = [{ value: "side-by-side" as const, label: "Side by side" }, { value: "before-after" as const, label: "Before / after" }, { value: "invariant-changing" as const, label: "What changes" }];
  return (
    <section className={`rk-compare rk-compare--${mode}`} aria-label="Comparison">
      <SegmentedControl label="Comparison view" value={mode} options={options} onChange={setMode} />
      <div className="rk-compare__panels">{variants.map((variant, index) => <article className={`rk-compare__panel ${mode === "before-after" && index === 1 ? "rk-compare__panel--after" : ""}`} key={variant.id}><span>{index === 0 ? "A" : "B"}</span><h3>{variant.title}</h3>{variant.summary ? <p>{variant.summary}</p> : null}{variant.content}{variant.points ? <ul>{variant.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}</article>)}</div>
      {mode === "invariant-changing" ? <div className="rk-compare__key"><div><h4>What changes</h4>{changes.length ? <ul>{changes.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No changes specified.</p>}</div><div><h4>What stays invariant</h4>{invariants.length ? <ul>{invariants.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No invariants specified.</p>}</div></div> : null}
    </section>
  );
}
