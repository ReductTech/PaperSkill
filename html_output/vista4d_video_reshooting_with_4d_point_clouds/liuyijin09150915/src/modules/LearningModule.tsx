import { useId, type ReactNode } from "react";

export function LearningModule({
  number,
  title,
  description,
  eyebrow,
  className = "",
  children,
}: {
  number: string;
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const titleId = `learning-module-${generatedId.replace(/:/g, "")}`;

  return <section className={`learning-module ${className}`.trim()} aria-labelledby={titleId}>
    <header className="learning-module-header">
      <span className="learning-module-number">{number}</span>
      <div className="learning-module-heading">
        <h3 id={titleId} className="learning-module-title">{title}</h3>
        {eyebrow ? <span className="learning-module-eyebrow">{eyebrow}</span> : null}
      </div>
    </header>
    <div className="learning-module-body">
      {description ? <p className="learning-module-description">{description}</p> : null}
      {children}
    </div>
  </section>;
}
