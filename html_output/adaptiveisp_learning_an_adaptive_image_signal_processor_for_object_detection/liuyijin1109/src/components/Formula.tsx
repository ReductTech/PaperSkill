import { memo, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./Formula.css";

export type FormulaSymbol = { sym: string; desc: string };
export type FormulaDef = { html: string; symbols: readonly FormulaSymbol[] };

// Formula markup and symbol definitions are local, trusted content. This follows
// InSpatio-World's Unicode/HTML formula and data-sym event delegation.
export function mark(sym: string, display = sym) {
  return `<span class="sym fe-formula-sym" data-sym="${sym}">${display}</span>`;
}

type Tip = { sym: string; element: HTMLElement };
type Position = { top: number; left: number; below: boolean };
const FormulaMarkup = memo(function FormulaMarkup({ html }: { html: string }) {
  return <span className="fe-formula" dangerouslySetInnerHTML={{ __html: html }} />;
});

export function Formula({ formula, inline = false, label }: { formula: FormulaDef; inline?: boolean; label?: string }) {
  const root = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState<Tip | null>(null);
  const [pinned, setPinned] = useState<Tip | null>(null);
  const [suppressed, setSuppressed] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const tipId = useId();
  const selected = pinned ?? (hovered?.element !== suppressed ? hovered : null);
  const definition = formula.symbols.find((item) => item.sym === selected?.sym);

  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>("[data-sym]").forEach((element) => {
      const sym = element.dataset.sym ?? "";
      const desc = formula.symbols.find((item) => item.sym === sym)?.desc;
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", `${sym}：${desc ?? "查看变量含义"}`);
      element.setAttribute("aria-expanded", String(selected?.element === element));
      if (selected?.element === element) element.setAttribute("aria-describedby", tipId);
      else element.removeAttribute("aria-describedby");
      element.classList.toggle("active", selected?.element === element);
    });
  }, [formula, selected?.element, tipId]);

  useLayoutEffect(() => {
    if (!selected || !definition) { setPosition(null); return; }
    const update = () => {
      const rect = selected.element.getBoundingClientRect();
      if (!rect.width) return;
      const tipRect = tooltipRef.current?.getBoundingClientRect();
      if (!tipRect) return;
      const content = root.current?.querySelector<HTMLElement>(".fe-formula")?.getBoundingClientRect() ?? rect;
      const outer = root.current?.getBoundingClientRect() ?? content;
      const measuredLineHeight = inline ? parseFloat(getComputedStyle(root.current?.parentElement ?? selected.element).lineHeight) : 0;
      const lineHeight = Number.isFinite(measuredLineHeight) ? measuredLineHeight : rect.height;
      const lineTop = rect.top - Math.max(0, (lineHeight - rect.height) / 2);
      const topEdge = inline ? Math.min(content.top, lineTop) : Math.min(content.top, outer.top);
      const bottomEdge = inline ? Math.max(content.bottom, lineTop + lineHeight) : Math.max(content.bottom, outer.bottom);
      const gap = 12;
      const viewportMargin = 8;
      const aboveTop = topEdge - gap - tipRect.height;
      const belowTop = bottomEdge + gap;
      const aboveFits = aboveTop >= viewportMargin;
      const belowFits = belowTop + tipRect.height <= window.innerHeight - viewportMargin;
      const below = !aboveFits && (belowFits || window.innerHeight - belowTop > topEdge - gap);
      const width = tipRect.width;
      const left = Math.max(viewportMargin + width / 2, Math.min(window.innerWidth - viewportMargin - width / 2, rect.left + rect.width / 2));
      setPosition({ top: below ? belowTop : topEdge - gap, left, below });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [selected?.element, definition, inline]);

  useEffect(() => {
    if (!pinned) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) { setPinned(null); setHovered(null); setSuppressed(null); }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setPinned(null); setHovered(null); setSuppressed(null); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [pinned]);

  const symbolFrom = (target: EventTarget | null) => {
    const element = target instanceof Element ? target.closest<HTMLElement>("[data-sym]") : null;
    return element && root.current?.contains(element) ? element : null;
  };
  const toggle = (element: HTMLElement) => {
    const sym = element.dataset.sym;
    if (!sym) return;
    if (pinned?.element === element) { setPinned(null); setHovered(null); setSuppressed(element); }
    else { setPinned({ sym, element }); setHovered(null); setSuppressed(null); }
  };
  const events = {
    onPointerOver: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") return;
      const element = symbolFrom(event.target);
      if (element) setHovered((previous) => previous?.element === element ? previous : { sym: element.dataset.sym ?? "", element });
    },
    onPointerOut: (event: React.PointerEvent<HTMLElement>) => {
      const element = symbolFrom(event.target);
      if (element && !element.contains(event.relatedTarget as Node)) { setHovered(null); setSuppressed(null); }
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      const element = symbolFrom(event.target);
      if (element) setHovered((previous) => previous?.element === element ? previous : { sym: element.dataset.sym ?? "", element });
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (symbolFrom(event.target)) setHovered(null);
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      const element = symbolFrom(event.target);
      if (!element) return;
      event.stopPropagation();
      toggle(element);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") { setPinned(null); setHovered(null); setSuppressed(null); event.stopPropagation(); return; }
      const element = symbolFrom(event.target);
      if (element && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.stopPropagation(); toggle(element); }
    },
  };

  const content = <FormulaMarkup html={formula.html} />;
  const tooltip = selected && definition && createPortal(
    <span ref={tooltipRef} id={tipId} role="tooltip" className="fe-tooltip" style={{ visibility: position ? "visible" : "hidden", top: position?.top ?? 0, left: position?.left ?? 0, transform: `translate(-50%, ${position?.below ? "0" : "-100%"})` }}>
      {definition.desc}
    </span>, document.body);
  return inline ? <><span ref={root} className="formula-interactive-inline" aria-label={label} {...events}>{content}</span>{tooltip}</>
    : <><div ref={root as React.RefObject<HTMLDivElement>} className="formula-explain formula-interactive" aria-label={label} {...events}>
      <p className="fe-hint">指向或点击公式中的符号查看含义</p>{content}
    </div>{tooltip}</>;
}
