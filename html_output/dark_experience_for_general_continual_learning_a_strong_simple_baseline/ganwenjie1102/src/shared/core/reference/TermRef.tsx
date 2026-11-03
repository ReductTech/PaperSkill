import { useCallback, useId, useRef, useState } from "react";
import type { FocusEvent, PointerEvent, ReactNode } from "react";
import { usePopoverPosition } from "../../foundation/overlay/Popover";
import type { KnowledgeEntry, TermRefLabels } from "./types";

const DEFAULT_LABELS: TermRefLabels = {
  definition: "术语解释",
  paperRole: "在本文中的作用：",
  easyToConfuse: "容易混淆：",
  openReference: "查看完整解释",
};

export function TermRef({ entry, children, onOpenReference, labels }: {
  entry: KnowledgeEntry;
  children?: ReactNode;
  onOpenReference?: (entryId: string) => void;
  labels?: Partial<TermRefLabels>;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const skipNextFocusOpen = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = `rk-term-${useId()}`;
  const copy = { ...DEFAULT_LABELS, ...labels };
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

  const onFocus = (event: FocusEvent<HTMLSpanElement>) => {
    if (skipNextFocusOpen.current) {
      skipNextFocusOpen.current = false;
      return;
    }
    const previous = event.relatedTarget;
    if (previous instanceof Element && previous.closest('[role="dialog"]')) return;
    setDismissed(false);
    setFocused(true);
  };
  const closeOnBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };
  const closeOnLeave = (event: PointerEvent<HTMLSpanElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && panelRef.current?.contains(nextTarget)) return;
    setHovered(false);
  };
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
    close();
    triggerRef.current?.focus();
    onOpenReference?.(entry.id);
  };
  const openOnHover = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType === "touch") return;
    setDismissed(false);
    setHovered(true);
  };

  return (
    <span className="rk-term-ref-wrap" onPointerEnter={openOnHover} onPointerOut={closeOnLeave} onFocus={onFocus} onBlur={closeOnBlur}>
      <button ref={triggerRef} type="button" className="rk-term-ref" data-term-id={entry.id} aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId} onClick={onTriggerClick}>
        {children ?? entry.hover.title}
      </button>
      {open ? (
        <div ref={panelRef} className="rk-term-popover" id={panelId} role="dialog" aria-label={`${entry.hover.title} ${copy.definition}`} style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }}>
          <strong>{entry.hover.title}</strong>
          <span>{entry.hover.definitionZh}</span>
          {entry.hover.paperRoleZh ? <span><b>{copy.paperRole}</b> {entry.hover.paperRoleZh}</span> : null}
          {entry.hover.confusionZh ? <span><b>{copy.easyToConfuse}</b> {entry.hover.confusionZh}</span> : null}
          {onOpenReference ? <button type="button" className="rk-term-popover__link" onClick={openReference}>{copy.openReference}</button> : null}
        </div>
      ) : null}
    </span>
  );
}
