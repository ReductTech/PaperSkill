import React from "react";

export const STORY_SECTIONS = [
  ["01", "问题"],
  ["02", "总体思路"],
  ["03", "Latent Action"],
  ["04", "Dual-Level MoT"],
  ["05", "Dream Forcing"],
  ["06", "Takeaway"],
] as const;

export function ProgressNavigation({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <header className="story-nav">
      <button className="story-brand" onClick={() => onSelect(0)} aria-label="回到开场">
        ABot-M0.5
      </button>
      <nav aria-label="六屏演示进度">
        {STORY_SECTIONS.map(([number, label], index) => (
          <React.Fragment key={number}>
            <button
              className={active === index ? "is-active" : ""}
              onClick={() => onSelect(index)}
              aria-current={active === index ? "step" : undefined}
            >
              <span>{number}</span>
              <small>{label}</small>
            </button>
            {index < STORY_SECTIONS.length - 1 ? <i aria-hidden="true" /> : null}
          </React.Fragment>
        ))}
      </nav>
      <span className="story-time">4 min</span>
    </header>
  );
}
