import type { CSSProperties, ReactNode } from "react";
import { useViewportMotion } from "./viewport-motion";
import "./viewport-diagrams.css";

type Cue = { title: string; text: string };

export function ViewportFigure({ className, label, timing, cues, caption, children }: {
  className: string;
  label: string;
  timing: readonly [number, number];
  cues: readonly [Cue, Cue, Cue];
  caption: ReactNode;
  children: ReactNode;
}) {
  const { ref, phase } = useViewportMotion(...timing);
  return <figure className={className + " viewport-figure"} data-guide-phase={phase}>
    <div className="viewport-sheet" style={{ "--phase-two": timing[0] + "ms", "--phase-three": timing[1] + "ms" } as CSSProperties}>
      <div className="viewport-drawing" ref={ref} data-entered={phase >= 0} tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
      <ol className="viewport-cues" aria-label="跟读图解">
        {cues.map((cue, index) => <li key={cue.title} aria-current={index === phase ? "step" : undefined}>
          <span className="viewport-cue-number" aria-hidden="true">{index + 1}</span>
          <div><strong>{cue.title}</strong><span>{cue.text}</span></div>
        </li>)}
      </ol>
    </div>
    <figcaption>{caption}</figcaption>
  </figure>;
}
