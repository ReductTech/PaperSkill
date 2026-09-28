import { useCallback, useRef, useState } from "react";
import type { FocusEvent, PointerEvent } from "react";
import { usePopoverPosition } from "../../foundation/overlay/Popover";
import type { TermDefinition } from "./types";

export function TermRef({ term, children, onOpenReference }: { term: TermDefinition; children?: string; onOpenReference?: (termId: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const skipNextFocusOpen = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const open = !dismissed && (hovered || focused || pinned);

  const close = useCallback(() => {
    setHovered(false);
    setFocused(false);
    setPinned(false);
    setDismissed(true);
  }, []);
  const noteEscape = useCallback(() => {
    skipNextFocusOpen.current = document.activeElement !== triggerRef.current;
  }, []);
  const position = usePopoverPosition(triggerRef, panelRef, open, close, { onEscape: noteEscape });

  const onFocus = () => {
    if (skipNextFocusOpen.current) {
      skipNextFocusOpen.current = false;
      return;
    }
    setDismissed(false);
    setFocused(true);
  };
  const closeOnBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };
  const closeOnLeave = (_event: PointerEvent<HTMLSpanElement>) => setHovered(false);
  const onTriggerClick = () => {
    if (pinned) {
      setHovered(false);
      setFocused(false);
      setPinned(false);
      setDismissed(true);
      return;
    }
    setDismissed(false);
    setPinned(true);
  };
  const openReference = () => {
    triggerRef.current?.focus();
    onOpenReference?.(term.id);
    close();
  };
  const openOnHover = () => {
    setDismissed(false);
    setHovered(true);
  };

  return (
    <span className="rk-term-ref-wrap" onPointerOver={openOnHover} onPointerLeave={closeOnLeave} onMouseLeave={closeOnLeave} onFocus={onFocus} onBlur={closeOnBlur}>
      <button ref={triggerRef} type="button" className="rk-term-ref" aria-haspopup="dialog" aria-expanded={open} aria-controls={`rk-term-${term.id}`} onClick={onTriggerClick}>
        {children ?? term.label}
      </button>
      {open ? (
        <div ref={panelRef} className="rk-term-popover" id={`rk-term-${term.id}`} role="dialog" aria-label={`${term.label} definition`} style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }}>
          <strong>{term.fullName ?? term.label}</strong>
          <span>{term.definition}</span>
          {term.paperRole ? <span><b>本文中的作用：</b> {term.paperRole}</span> : null}
          {term.confusion ? <span><b>容易混淆：</b> {term.confusion}</span> : null}
          {term.sourceKind || term.sourceRef ? <small className="rk-term-popover__source">来源：{[term.sourceKind, term.sourceRef].filter(Boolean).join(" · ")}</small> : null}
          {onOpenReference ? <button type="button" className="rk-term-popover__link" onClick={openReference}>在 Reference Hub 中查看</button> : null}
        </div>
      ) : null}
    </span>
  );
}

export const TermPopover = TermRef;
