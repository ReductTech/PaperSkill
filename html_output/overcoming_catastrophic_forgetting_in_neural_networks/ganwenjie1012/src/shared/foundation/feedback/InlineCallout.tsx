import type { ReactNode } from "react";

export type CalloutKind = "key" | "note" | "caution" | "paper-fact" | "implementation";
export function InlineCallout({ kind = "note", title, children }: { kind?: CalloutKind; title?: string; children: ReactNode }) {
  return (
    <aside className={`rk-callout rk-callout--${kind}`}>
      {title ? <strong className="rk-callout__title">{title}</strong> : null}
      <div>{children}</div>
    </aside>
  );
}
