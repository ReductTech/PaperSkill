import { useId, type ReactNode } from 'react';

// Same subsection shell and class structure as the accepted PaperSkill LearningModule.
export function LearningModule({ number, title, description, eyebrow, children }: {
  number: string;
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const titleId = `learning-module-${generatedId.replace(/:/g, '')}`;

  return <section className="module learning-module" aria-labelledby={titleId}>
    <header className="module-head">
      <span className="num">{number}</span>
      <h3 id={titleId}>{title}</h3>
      {eyebrow ? <span className="learning-module-eyebrow">{eyebrow}</span> : null}
    </header>
    <div className="module-body learning-module-body">
      {description ? <p className="module-desc">{description}</p> : null}
      {children}
    </div>
  </section>;
}
