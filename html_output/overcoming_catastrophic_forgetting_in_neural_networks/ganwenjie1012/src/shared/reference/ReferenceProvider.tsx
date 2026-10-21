import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CanonicalReferenceId, GrandAnimationStateId, OpenReferenceTarget, PageId, RuntimeObjectId } from "../../contracts/ids";
import type { ReferenceApi } from "./types";

const ReferenceContext = createContext<ReferenceApi | null>(null);

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageId>("page-01-problem");
  const [hubOpen, setHubOpen] = useState(false);
  const [hubReferenceId, setHubReferenceId] = useState<CanonicalReferenceId>();
  const [activeAnimationStateId, setActiveAnimationStateId] = useState<GrandAnimationStateId>();
  const [activeRuntimeObject, setActiveRuntimeObject] = useState<RuntimeObjectId>();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentPage]);

  const navigatePage = useCallback((pageId: PageId) => {
    setCurrentPage(pageId);
    setActiveRuntimeObject(undefined);
  }, []);

  const openHub = useCallback((referenceId?: CanonicalReferenceId) => {
    setHubReferenceId(referenceId);
    setHubOpen(true);
  }, []);

  const closeHub = useCallback(() => setHubOpen(false), []);

  const openReference = useCallback((target: OpenReferenceTarget) => {
    if (target.animationStateId) {
      setActiveAnimationStateId(target.animationStateId);
      setCurrentPage("page-10-grand-animation");
      setHubOpen(false);
      return;
    }
    if (target.pageId) {
      setCurrentPage(target.pageId);
      setHubOpen(false);
      setActiveRuntimeObject(undefined);
      if (target.anchorId) {
        window.requestAnimationFrame(() => document.getElementById(target.anchorId!)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
      return;
    }
    if (target.referenceId) openHub(target.referenceId);
  }, [openHub]);

  const value = useMemo<ReferenceApi>(() => ({
    openReference,
    openHub,
    closeHub,
    navigatePage,
    currentPage,
    hubOpen,
    hubReferenceId,
    activeAnimationStateId,
    activeRuntimeObject,
    setActiveRuntimeObject,
  }), [openReference, openHub, closeHub, navigatePage, currentPage, hubOpen, hubReferenceId, activeAnimationStateId, activeRuntimeObject]);

  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
}

export function useReferenceApi(): ReferenceApi {
  const value = useContext(ReferenceContext);
  if (!value) throw new Error("useReferenceApi must be used inside ReferenceProvider");
  return value;
}
