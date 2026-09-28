import { useEffect, useState } from "react";
import { ReferenceHub, type HubRequest } from "../components/ReferenceHub";
import { useScrollStepSync } from "../shared/foundation/layout/StickySystemView";
import { LwfStageRail } from "./components/LwfStageRail";
import { LwfProcessView } from "./components/LwfProcessView";
import { MobileProcessGuide } from "./components/MobileProcessGuide";
import { LWF_CHAPTERS, getLwfChapter, type LwfChapterId } from "./data/chapters";
import { processSyncSections } from "./data/process";
import { v3ReferenceIds, v3ReferencePriority } from "./data/references";
import { Section00Problem } from "./sections/Section00Problem";
import { Section01Architecture } from "./sections/Section01Architecture";
import { Section02KeyMove } from "./sections/Section02KeyMove";
import { Section03TrainingCycle } from "./sections/Section03TrainingCycle";
import { Section04MechanismBoundary } from "./sections/Section04MechanismBoundary";
import { Section05Sequential } from "./sections/Section05Sequential";
import { Section06Evidence } from "./sections/Section06Evidence";
import { Section07Replay } from "./sections/Section07Replay";
import "../styles/tokens.css";
import "../styles/components.css";
import "../styles/paper.css";
import "../styles/layout.css";
import "../styles/alexnet.css";
import "../styles/reference-hub.css";
import "../shared/foundation/styles/kit.css";
import "./styles/vertical-slice.css";
import "./styles/motion.css";
import "./styles/mechanism.css";
import "./styles/sequential.css";
import "./styles/evidence.css";
import "./styles/replay.css";
import "./styles/grand-trail.css";

const sceneChapters: Record<string, LwfChapterId> = {
  "00": "00", "01": "01", "02": "02", "03": "03", "04": "04", "05": "05", "06": "06", "07": "07",
  A: "00", B: "01", C: "02", D: "03", E: "04", F: "04", G: "04", H: "05", I: "06", J: "07",
};

export function LwfVerticalSlice() {
  const [referenceRequest, setReferenceRequest] = useState<HubRequest | null>(null);
  const [mobileStepId, setMobileStepId] = useState("key-new-task");
  const [isNarrow, setIsNarrow] = useState(false);
  const [mobileProcessVisible, setMobileProcessVisible] = useState(false);
  const processSync = useScrollStepSync(processSyncSections, { manualOverrideMs: 2400, readingLineRatio: 0.42 });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setIsNarrow(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!isNarrow) { setMobileProcessVisible(false); return; }
    const update = () => {
      const rect = document.getElementById("v3-mobile-process")?.getBoundingClientRect();
      const line = window.innerHeight * 0.42;
      setMobileProcessVisible(Boolean(rect && rect.top <= line && rect.bottom > line));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isNarrow]);

  const openReference = (termId?: string) => {
    const cardId = termId ? v3ReferenceIds[termId] : undefined;
    setReferenceRequest(cardId ? { cardId } : {});
  };

  const selectStep = (stepId: string) => {
    setMobileStepId(stepId);
    if (isNarrow) setMobileProcessVisible(true);
    processSync.setManualStep(stepId);
  };

  const navigateChapter = (chapterId: LwfChapterId) => {
    const chapter = getLwfChapter(chapterId);
    if (!chapter || chapter.status !== "ready") return;
    window.history.pushState(null, "", `#chapter-${chapterId}`);

    if (chapterId === "02" || chapterId === "03") {
      const initialStepId = chapterId === "02" ? "key-new-task" : "cycle-warmup";
      if (isNarrow) {
        setMobileStepId(initialStepId);
        setMobileProcessVisible(true);
        processSync.setManualStep(initialStepId);
        window.setTimeout(() => document.getElementById("v3-mobile-process")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
        return;
      }
      processSync.setManualStep(initialStepId);
    }
    document.getElementById(`chapter-${chapterId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const legacyChapterIds: Record<string, LwfChapterId> = {
      "slice-00": "00", "slice-01": "01", "slice-02": "02", "slice-03": "03",
    };
    const navigateFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const legacyChapterId = legacyChapterIds[hash];
      const chapterId = legacyChapterId ?? (hash.startsWith("chapter-") ? hash.slice("chapter-".length) : "");
      const chapter = getLwfChapter(chapterId);
      if (!chapter || chapter.status !== "ready") return;
      if (legacyChapterId) window.history.replaceState(null, "", `#chapter-${chapter.id}`);

      if (chapter.id === "02" || chapter.id === "03") {
        const initialStepId = chapter.id === "02" ? "key-new-task" : "cycle-warmup";
        if (isNarrow) {
          setMobileStepId(initialStepId);
          setMobileProcessVisible(true);
          processSync.setManualStep(initialStepId);
          window.setTimeout(() => document.getElementById("v3-mobile-process")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
          return;
        }
        processSync.setManualStep(initialStepId);
      }
      window.setTimeout(() => document.getElementById(`chapter-${chapter.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    };
    navigateFromHash();
    window.addEventListener("hashchange", navigateFromHash);
    window.addEventListener("popstate", navigateFromHash);
    return () => {
      window.removeEventListener("hashchange", navigateFromHash);
      window.removeEventListener("popstate", navigateFromHash);
    };
  }, [isNarrow, processSync.setManualStep]);

  const openV3Scene = (scene: string) => {
    const direct = sceneChapters[scene];
    const prefix = scene.match(/^([A-D])/i)?.[1]?.toUpperCase();
    const chapterId = direct ?? (prefix ? sceneChapters[prefix] : undefined);
    if (chapterId && LWF_CHAPTERS.some((chapter) => chapter.id === chapterId && chapter.status === "ready")) {
      navigateChapter(chapterId);
    }
  };

  const activeStepId = isNarrow ? (mobileProcessVisible ? mobileStepId : null) : processSync.activeStepId;

  return <div className="lwf-v3">
    <LwfStageRail activeStepId={activeStepId} onOpenReferences={() => openReference()} onSelectChapter={navigateChapter} />
    <main className="v3-main">
      <header className="v3-intro">
        <p className="v3-eyebrow">ECCV 2016 · FIRST VERTICAL SLICE</p>
        <h1>Learning without Forgetting</h1>
        <p>从问题约束到一次完整训练</p>
      </header>

      <Section00Problem onOpenReference={openReference} onNavigateChapter={navigateChapter} />
      <Section01Architecture onOpenReference={openReference} onNavigateChapter={navigateChapter} />

      <div className="v3-desktop-scrolly" aria-label="关键做法与一次训练">
        <aside className="v3-process-sticky"><LwfProcessView activeStepId={processSync.activeStepId} /></aside>
        <div className="v3-narrative-column">
          <Section02KeyMove activeStepId={processSync.activeStepId} onOpenReference={openReference} onSelectStep={selectStep} onNavigateChapter={navigateChapter} />
          <Section03TrainingCycle activeStepId={processSync.activeStepId} onOpenReference={openReference} onSelectStep={selectStep} onNavigateChapter={navigateChapter} />
        </div>
      </div>

      <MobileProcessGuide activeStepId={mobileStepId} onSelectStep={selectStep} onNavigateChapter={navigateChapter} />
      <Section04MechanismBoundary onOpenReference={openReference} onNavigateChapter={navigateChapter} />
      <Section05Sequential onOpenReference={openReference} onNavigateChapter={navigateChapter} />
      <Section06Evidence onOpenReference={openReference} onNavigateChapter={navigateChapter} />
      <Section07Replay onOpenReference={openReference} onNavigateChapter={navigateChapter} />
    </main>

    {referenceRequest ? <ReferenceHub request={referenceRequest} onClose={() => setReferenceRequest(null)} priorityIds={v3ReferencePriority} onOpenScene={openV3Scene} /> : null}
  </div>;
}

export default LwfVerticalSlice;
