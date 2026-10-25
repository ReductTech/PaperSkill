import type { ReactNode } from "react";

export type FeedbackTone = "info" | "good" | "warn" | "bad";
export function Feedback({ tone = "info", children, className = "" }: { tone?: FeedbackTone; children: ReactNode; className?: string }) {
  return <div className={`rk-feedback rk-feedback--${tone} ${className}`.trim()} role="status">{children}</div>;
}
