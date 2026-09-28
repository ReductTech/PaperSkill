import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export type StickySection = { id: string; stepId?: string };
export type StickySectionChangeSource = "scroll" | "manual";
type StickySyncOptions = {
  manualOverrideMs?: number;
  readingLineRatio?: number;
  onActiveSectionChange?: (section: StickySection, source: StickySectionChangeSource) => void;
};
type StickySyncValue = { activeStepId: string | null; setManualStep: (stepId: string) => void };

const StickySyncContext = createContext<StickySyncValue | null>(null);

export function useStickyStepSync(): StickySyncValue | null {
  return useContext(StickySyncContext);
}

export function useScrollStepSync(sections: StickySection[], { manualOverrideMs = 1100, readingLineRatio = 0.5, onActiveSectionChange }: StickySyncOptions = {}) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const activeRef = useRef<StickySection | null>(null);
  const activeStepRef = useRef<string | null>(null);
  const manualUntil = useRef(0);
  const releaseTimer = useRef<number | null>(null);
  const sectionSignature = sections.map((section) => `${section.id}:${section.stepId ?? ""}`).join("|");
  const sectionsRef = useRef(sections);
  const changeCallbackRef = useRef(onActiveSectionChange);
  sectionsRef.current = sections;
  changeCallbackRef.current = onActiveSectionChange;

  const commitSection = useCallback((section: StickySection | null, source: StickySectionChangeSource) => {
    if ((activeRef.current?.id ?? null) === (section?.id ?? null) && activeStepRef.current === (section?.stepId ?? null)) return;
    activeRef.current = section;
    activeStepRef.current = section?.stepId ?? null;
    setActiveSectionId(section?.id ?? null);
    setActiveStepId(section?.stepId ?? null);
    if (section) changeCallbackRef.current?.(section, source);
  }, []);

  const sectionAtReadingLine = useCallback((): StickySection | null => {
    const readingLine = window.innerHeight * readingLineRatio;
    const visible = sectionsRef.current.map((section) => {
      const element = document.getElementById(section.id);
      return element ? { section, rect: element.getBoundingClientRect() } : null;
    }).filter((entry): entry is { section: StickySection; rect: DOMRect } => Boolean(entry && entry.rect.bottom > 0 && entry.rect.top < window.innerHeight));
    const containing = visible.filter((entry) => entry.rect.top <= readingLine && entry.rect.bottom > readingLine).sort((a, b) => b.rect.top - a.rect.top);
    if (containing.length) return containing[0].section;
    visible.sort((a, b) => Math.abs(a.rect.top - readingLine) - Math.abs(b.rect.top - readingLine));
    return visible[0]?.section ?? null;
  }, [readingLineRatio]);

  const selectManually = useCallback((stepId: string) => {
    const section = sectionsRef.current.find((item) => item.stepId === stepId) ?? null;
    manualUntil.current = Date.now() + Math.max(0, manualOverrideMs);
    if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
    setActiveSectionId(activeRef.current?.id ?? null);
    activeStepRef.current = stepId;
    setActiveStepId(stepId);
    if (section) changeCallbackRef.current?.(section, "manual");
    releaseTimer.current = window.setTimeout(() => {
      manualUntil.current = 0;
      commitSection(sectionAtReadingLine(), "scroll");
      releaseTimer.current = null;
    }, Math.max(0, manualOverrideMs));
  }, [commitSection, manualOverrideMs, sectionAtReadingLine]);

  useEffect(() => {
    const syncFromScroll = () => {
      if (Date.now() < manualUntil.current) return;
      commitSection(sectionAtReadingLine(), "scroll");
    };
    const observed: Element[] = [];
    const topMargin = Math.max(0, Math.round(readingLineRatio * 100 - 1));
    const bottomMargin = Math.max(0, Math.round((1 - readingLineRatio) * 100 - 1));
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(syncFromScroll, { rootMargin: `-${topMargin}% 0px -${bottomMargin}% 0px`, threshold: 0 });
    for (const section of sectionsRef.current) {
      const element = document.getElementById(section.id);
      if (element) { observer?.observe(element); observed.push(element); }
    }
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("resize", syncFromScroll);
    syncFromScroll();
    return () => {
      observer?.disconnect();
      observed.length = 0;
      window.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("resize", syncFromScroll);
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
    };
  }, [commitSection, sectionAtReadingLine, sectionSignature, readingLineRatio]);

  return { activeSectionId, activeStepId, setManualStep: selectManually };
}

export function StickySystemView({ visual, children, label = "Persistent system view", sections = [], manualOverrideMs, onActiveSectionChange }: {
  visual: ReactNode;
  children: ReactNode;
  label?: string;
  sections?: StickySection[];
  manualOverrideMs?: number;
  onActiveSectionChange?: (section: StickySection, source: StickySectionChangeSource) => void;
}) {
  const sync = useScrollStepSync(sections, { manualOverrideMs, onActiveSectionChange });
  const context = useMemo(() => ({ activeStepId: sync.activeStepId, setManualStep: sync.setManualStep }), [sync.activeStepId, sync.setManualStep]);
  return (
    <StickySyncContext.Provider value={context}>
      <section className="rk-sticky-system" aria-label={label} data-active-section-id={sync.activeSectionId ?? undefined} data-active-step-id={sync.activeStepId ?? undefined}>
        <div className="rk-sticky-system__visual">{visual}</div>
        <div className="rk-sticky-system__content">{children}</div>
      </section>
    </StickySyncContext.Provider>
  );
}
