import type { ReactNode } from "react";

export type FigureFrameCounter = { index: number; total: number };

/**
 * The frame a teaching figure lives in: an eyebrow, a figure title, an optional
 * step counter, a caption, the figure itself, and a key row underneath. It keeps
 * every figure on a page in the same hierarchy without turning each one into
 * another card.
 */
export function FigureFrame({ label, title, counter, note, children, footer, className = "", headingId }: {
  label: string;
  title: ReactNode;
  counter?: FigureFrameCounter;
  note?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headingId?: string;
}) {
  return <div className={`rk-figure${className ? ` ${className}` : ""}`}>
    <header className="rk-figure__header">
      <div className="rk-figure__heading">
        <p className="rk-figure__eyebrow">{label}</p>
        <h3 className="rk-figure__title" id={headingId}>{title}</h3>
      </div>
      {counter ? <p className="rk-figure__counter" aria-label={`Step ${counter.index} of ${counter.total}`}><span>{String(counter.index).padStart(2, "0")}</span><i>/ {String(counter.total).padStart(2, "0")}</i></p> : null}
    </header>
    {note ? <p className="rk-figure__note">{note}</p> : null}
    <div className="rk-figure__body">{children}</div>
    {footer ? <div className="rk-figure__footer">{footer}</div> : null}
  </div>;
}
