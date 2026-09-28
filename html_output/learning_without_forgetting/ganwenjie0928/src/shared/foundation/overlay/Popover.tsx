import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

const VIEWPORT_GUTTER = 12;
const ANCHOR_GAP = 8;

export type PopoverPosition = { top: number; left: number; ready: boolean };

export function usePopoverPosition(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
  options: { returnFocusOnEscape?: boolean; onEscape?: () => void } = {},
): PopoverPosition {
  const [position, setPosition] = useState<PopoverPosition>({ top: 0, left: 0, ready: false });
  const onEscapeRef = useRef(options.onEscape);
  const returnFocusOnEscape = options.returnFocusOnEscape ?? true;

  useLayoutEffect(() => {
    onEscapeRef.current = options.onEscape;
  }, [options.onEscape]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition((current) => current.ready ? { ...current, ready: false } : current);
      return;
    }

    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!anchor || !panel) return;

      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
      const width = Math.min(panel.width, Math.max(0, viewportWidth - VIEWPORT_GUTTER * 2));
      const height = Math.min(panel.height, Math.max(0, viewportHeight - VIEWPORT_GUTTER * 2));
      const maxLeft = Math.max(VIEWPORT_GUTTER, viewportWidth - width - VIEWPORT_GUTTER);
      const left = Math.min(Math.max(VIEWPORT_GUTTER, anchor.left), maxLeft);
      const below = anchor.bottom + ANCHOR_GAP;
      const above = anchor.top - height - ANCHOR_GAP;
      const maxTop = Math.max(VIEWPORT_GUTTER, viewportHeight - height - VIEWPORT_GUTTER);
      const top = below + height <= viewportHeight - VIEWPORT_GUTTER
        ? below
        : above >= VIEWPORT_GUTTER
          ? above
          : Math.min(Math.max(VIEWPORT_GUTTER, below), maxTop);

      setPosition((current) => current.top === top && current.left === left && current.ready
        ? current
        : { top, left, ready: true });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && !panelRef.current?.contains(target) && !anchorRef.current?.contains(target)) onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onDismiss();
      onEscapeRef.current?.();
      if (returnFocusOnEscape) anchorRef.current?.focus();
    };

    place();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    if (anchorRef.current) observer?.observe(anchorRef.current);
    if (panelRef.current) observer?.observe(panelRef.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, panelRef, open, onDismiss, returnFocusOnEscape]);

  return position;
}

export function Popover({ label, trigger, children, className = "" }: { label: string; trigger: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const position = usePopoverPosition(triggerRef, panelRef, open, close);

  return (
    <>
      <button ref={triggerRef} type="button" className="rk-popover__trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {trigger}
      </button>
      {open ? (
        <div ref={panelRef} className={`rk-popover ${className}`.trim()} role="dialog" aria-label={label} style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }}>
          <button type="button" className="rk-overlay__close" aria-label="Close" onClick={close}>×</button>
          {children}
        </div>
      ) : null}
    </>
  );
}
