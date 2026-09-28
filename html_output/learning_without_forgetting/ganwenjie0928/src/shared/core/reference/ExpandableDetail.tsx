import type { ReactNode } from "react";

export function ExpandableDetail({ title, summary, level = "supporting", children, defaultOpen = false }: { title: string; summary?: string; level?: "supporting" | "advanced"; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className={`rk-expandable rk-expandable--${level}`} open={defaultOpen || undefined}>
      <summary>
        <span><strong>{title}</strong>{summary ? <small>{summary}</small> : null}</span>
        <span className="rk-expandable__marker" aria-hidden="true">⌄</span>
      </summary>
      <div className="rk-expandable__content">{children}</div>
    </details>
  );
}
