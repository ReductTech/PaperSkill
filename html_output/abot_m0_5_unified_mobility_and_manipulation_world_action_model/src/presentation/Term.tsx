import React from "react";

export function Term({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <span className="term" tabIndex={0} data-tip={tip}>
      {children}
    </span>
  );
}

export function Evidence({
  from,
  to,
  caption,
  prefix,
}: {
  from: string;
  to: string;
  caption: string;
  prefix?: string;
}) {
  return (
    <div className="evidence" aria-label={caption}>
      {prefix ? <span className="evidence-prefix">{prefix}</span> : null}
      <span className="evidence-old">{from}</span>
      <span className="evidence-arrow">→</span>
      <span className="evidence-new">{to}</span>
      <span className="evidence-caption">{caption}</span>
    </div>
  );
}
