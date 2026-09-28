import type { ReactNode } from "react";

export function NarrativeStep({ id, index, title, description, active, onSelect, children }: {
  id: string;
  index: number;
  title: string;
  description: ReactNode;
  active: boolean;
  onSelect?: (id: string) => void;
  children?: ReactNode;
}) {
  const selectStep = () => {
    onSelect?.(id);
    if (onSelect) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return <article className="v3-narrative-step" id={id} data-step-note={id} data-active={active} aria-current={active ? "step" : undefined}>
    <span className="v3-narrative-index">{String(index).padStart(2, "0")}</span>
    <div className="v3-narrative-body">
      <h3><button type="button" onClick={selectStep} aria-current={active ? "step" : undefined}>{title}</button></h3>
      <p>{description}</p>
      {children ? <div className="v3-narrative-support">{children}</div> : null}
    </div>
  </article>;
}
