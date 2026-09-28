import { useEffect, useState } from "react";
import { LWF_CHAPTERS, getLwfChapter, type LwfChapterId } from "../data/chapters";

export function LwfStageRail({ activeStepId, onOpenReferences, onSelectChapter }: {
  activeStepId: string | null;
  onOpenReferences: () => void;
  onSelectChapter: (id: LwfChapterId) => void;
}) {
  const [activeChapterId, setActiveChapterId] = useState<LwfChapterId>("00");
  const activeChapter = getLwfChapter(activeChapterId)!;

  useEffect(() => {
    const update = () => {
      const readingLine = window.innerHeight * 0.42;
      const mobileProcess = document.getElementById("v3-mobile-process");
      const mobileRect = mobileProcess?.getBoundingClientRect();
      const processRect = mobileRect && mobileRect.height > 0
        ? mobileRect
        : document.querySelector(".v3-desktop-scrolly")?.getBoundingClientRect();
      const processAtReadingLine = Boolean(processRect && processRect.top <= readingLine && processRect.bottom > readingLine);
      if (activeStepId && processAtReadingLine) {
        setActiveChapterId(activeStepId.startsWith("key-") ? "02" : "03");
        return;
      }

      const visible: { id: LwfChapterId; rect: DOMRect }[] = [];
      for (const chapter of LWF_CHAPTERS) {
        if (chapter.status !== "ready") continue;
        const element = document.getElementById(`chapter-${chapter.id}`);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) visible.push({ id: chapter.id, rect });
      }
      const current = visible.find((item) => item.rect.top <= readingLine && item.rect.bottom > readingLine)
        ?? visible.sort((a, b) => Math.abs(a.rect.top - readingLine) - Math.abs(b.rect.top - readingLine))[0];
      if (current) {
        setActiveChapterId(current.id);
        return;
      }
      if (activeStepId) setActiveChapterId(activeStepId.startsWith("key-") ? "02" : "03");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [activeStepId]);

  return <aside className="v3-stage-rail" aria-label="LwF 学习导航">
    <div className="v3-rail-brand">
      <span className="v3-rail-mark" aria-hidden="true">L</span>
      <div><strong>Learning without Forgetting</strong><small>ECCV 2016 · 精读工作区</small></div>
    </div>
    <p className="v3-rail-label">FIRST VERTICAL SLICE</p>
    <div className="v3-rail-progress"><span>CHAPTER {activeChapterId} / {String(LWF_CHAPTERS.length).padStart(2, "0")}</span><strong>{activeChapter.title}</strong><small>{LWF_CHAPTERS.filter((chapter) => chapter.status === "ready").length} / {LWF_CHAPTERS.length} chapters ready</small></div>
    <nav className="v3-rail-nav" aria-label={`${LWF_CHAPTERS.length} 个章节`}>
      {LWF_CHAPTERS.map((chapter) => {
        const ready = chapter.status === "ready";
        return <button key={chapter.id} type="button" className={`${activeChapterId === chapter.id ? "is-active" : ""}${ready ? "" : " is-planned"}`} aria-current={activeChapterId === chapter.id ? "page" : undefined} disabled={!ready} onClick={() => ready && onSelectChapter(chapter.id)}>
          <span className="v3-rail-chapter-number">{chapter.id}</span><strong>{chapter.title}</strong>{ready ? null : <small>planned</small>}
        </button>;
      })}
    </nav>
    <button type="button" className="v3-rail-reference" onClick={onOpenReferences}><span aria-hidden="true">⌕</span> Reference Hub</button>
  </aside>;
}
