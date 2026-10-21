import { useEffect, useRef, useState } from "react";

/** Tracks the user's system-level reduced-motion preference. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    if (query.addEventListener) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return reduced;
}

/** Keeps keyboard focus inside an open dialog and returns it to the trigger. */
export function useFocusTrap<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const container = containerRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const selector = "button:not(:disabled), a[href], input:not(:disabled), [tabindex='0']";
    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(selector));
    focusables()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  return containerRef;
}
