import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusEvent, PointerEvent } from "react";
import { usePopoverPosition } from "../../foundation/overlay/Popover";
import type { TermDefinition } from "./types";

export function TermRef({ term, children, onOpenReference }: { term: TermDefinition; children?: string; onOpenReference?: (termId: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const skipNextFocusOpen = useRef(false);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const open = !dismissed && (hovered || focused || pinned);

  const cancelClose = () => {
    if (closeTimerRef.current !== undefined) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = undefined;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      if (!pinned && document.activeElement !== triggerRef.current && !panelRef.current?.contains(document.activeElement)) setHovered(false);
    }, 160);
  };
  const close = useCallback(() => {
    cancelClose();
    setHovered(false);
    setFocused(false);
    setPinned(false);
    setDismissed(true);
  }, []);
  useEffect(() => () => cancelClose(), []);
  const noteEscape = useCallback(() => {
    skipNextFocusOpen.current = document.activeElement !== triggerRef.current;
  }, []);
  const position = usePopoverPosition(triggerRef, panelRef, open, close, { onEscape: noteEscape });

  const onFocus = () => {
    if (skipNextFocusOpen.current) {
      skipNextFocusOpen.current = false;
      return;
    }
    cancelClose();
    setDismissed(false);
    setFocused(true);
  };
  const closeOnBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setFocused(false);
      scheduleClose();
    }
  };
  const closeOnLeave = (_event: PointerEvent<HTMLSpanElement>) => scheduleClose();
  const onTriggerClick = () => {
    if (pinned) {
      setHovered(false);
      setFocused(false);
      setPinned(false);
      setDismissed(true);
      cancelClose();
      return;
    }
    setDismissed(false);
    setPinned(true);
  };
  const openReference = () => {
    onOpenReference?.(term.id);
    close();
  };
  const openOnHover = () => {
    cancelClose();
    setDismissed(false);
    setHovered(true);
  };

  return (
    <span className="rk-term-ref-wrap" onPointerOver={openOnHover} onPointerLeave={closeOnLeave} onFocus={onFocus} onBlur={closeOnBlur}>
      <button ref={triggerRef} type="button" className="rk-term-ref" aria-haspopup="dialog" aria-expanded={open} aria-controls={`rk-term-${term.id}`} onClick={onTriggerClick}>
        {children ?? term.label}
      </button>
      {open ? (
        <div ref={panelRef} className="rk-term-popover" id={`rk-term-${term.id}`} role="dialog" aria-label={`${term.label} definition`} style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }} onPointerEnter={cancelClose} onPointerLeave={closeOnLeave}>
          <span className="icarl-term-popover__eyebrow">Term · {term.sourceKind ?? "Teaching reference"}</span>
          <h3>{term.fullName ?? term.label}</h3>
          <p>{term.definition}</p>
          {term.formula ? <div className="icarl-reference-formula" role="math" aria-label={`${term.label} formula`}>{term.formula}</div> : null}
          {term.paperRole ? <p><b>Role in this paper</b> {term.paperRole}</p> : null}
          {term.confusion ? <p className="icarl-term-popover__note"><b>Easy to confuse with</b> {term.confusion}</p> : null}
          {onOpenReference ? <button type="button" className="rk-term-popover__link" onClick={openReference}>Open Reference Hub →</button> : null}
        </div>
      ) : null}
    </span>
  );
}

export const TermPopover = TermRef;
