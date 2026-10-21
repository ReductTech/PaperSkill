import type { ReactNode } from "react";

export function StatusPill({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad" | "info"; children: ReactNode }) {
  return <span className={`rk-status-pill rk-status-pill--${tone}`}>{children}</span>;
}
