import { useState } from "react";
import { MobileSheet } from "../../foundation/overlay/MobileSheet";

export type PaperFigureProps = { src: string; alt: string; figureLabel?: string; caption?: string; source?: string; mode?: "original" | "crop" | "redraw" };

export function PaperFigure({ src, alt, figureLabel, caption, source, mode = "original" }: PaperFigureProps) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <figure className={`rk-paper-figure rk-paper-figure--${mode}`}>
      <div className="rk-paper-figure__image-wrap">
        <img src={src} alt={alt} loading="lazy" />
        <button type="button" className="rk-paper-figure__zoom" onClick={() => setZoomed(true)} aria-label="Zoom figure">Zoom</button>
      </div>
      {figureLabel || caption || source ? <figcaption>{figureLabel ? <b>{figureLabel}. </b> : null}{caption}{source ? <small>Source: {source}</small> : null}</figcaption> : null}
      <MobileSheet open={zoomed} title={figureLabel ?? "Figure"} onClose={() => setZoomed(false)}><img className="rk-paper-figure__zoomed" src={src} alt={alt} /><p>{caption}</p>{source ? <small>Source: {source}</small> : null}</MobileSheet>
    </figure>
  );
}
