import { useState } from "react";
import { MobileSheet } from "../../foundation/overlay/MobileSheet";

export type FigureAnnotation = { id: string; x: number; y: number; label: string; text: string };
export type PaperFigureProps = { src: string; alt: string; figureLabel?: string; caption?: string; source?: string; mode?: "original" | "crop" | "redraw"; annotations?: FigureAnnotation[] };

export function PaperFigure({ src, alt, figureLabel, caption, source, mode = "original", annotations = [] }: PaperFigureProps) {
  const [zoomed, setZoomed] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  return (
    <figure className={`rk-paper-figure rk-paper-figure--${mode}`}>
      <div className="rk-paper-figure__image-wrap">
        <img src={src} alt={alt} loading="lazy" />
        {annotations.map((annotation) => <button key={annotation.id} type="button" className={`rk-paper-figure__marker ${activeAnnotation === annotation.id ? "is-active" : ""}`} style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }} aria-label={`${annotation.label}: ${annotation.text}`} aria-pressed={activeAnnotation === annotation.id} onClick={() => setActiveAnnotation(activeAnnotation === annotation.id ? null : annotation.id)}>{annotation.label}</button>)}
        <button type="button" className="rk-paper-figure__zoom" onClick={() => setZoomed(true)} aria-label="Zoom figure">Zoom</button>
      </div>
      {activeAnnotation ? <p className="rk-paper-figure__annotation" aria-live="polite">{annotations.find((item) => item.id === activeAnnotation)?.text}</p> : null}
      {figureLabel || caption || source ? <figcaption>{figureLabel ? <b>{figureLabel}. </b> : null}{caption}{source ? <small>Source: {source}</small> : null}</figcaption> : null}
      <MobileSheet open={zoomed} title={figureLabel ?? "Figure"} onClose={() => setZoomed(false)}><img className="rk-paper-figure__zoomed" src={src} alt={alt} /><p>{caption}</p>{source ? <small>Source: {source}</small> : null}</MobileSheet>
    </figure>
  );
}
