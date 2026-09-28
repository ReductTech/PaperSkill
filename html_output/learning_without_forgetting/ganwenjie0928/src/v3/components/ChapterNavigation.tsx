import { LWF_CHAPTERS, type LwfChapterId } from "../data/chapters";

export function ChapterNavigation({ chapterId, onNavigate }: {
  chapterId: LwfChapterId;
  onNavigate: (chapterId: LwfChapterId) => void;
}) {
  const index = LWF_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
  const previous = LWF_CHAPTERS[index - 1];
  const next = LWF_CHAPTERS[index + 1];
  const previousReady = previous?.status === "ready";
  const nextReady = next?.status === "ready";

  return <nav className="v3-chapter-navigation" aria-label="章节翻页">
    <button type="button" className="v3-chapter-navigation-link is-previous" disabled={!previousReady} onClick={() => previousReady && onNavigate(previous.id)}>
      <span>{previous ? `← ${previous.id}` : "首章"}</span>
      <strong>{previous?.title ?? "问题设定"}</strong>
    </button>
    <span className="v3-chapter-page-count">CHAPTER {chapterId} / {String(LWF_CHAPTERS.length).padStart(2, "0")}</span>
    <button type="button" className="v3-chapter-navigation-link is-next" disabled={!nextReady} onClick={() => nextReady && onNavigate(next.id)}>
      <span>{next ? `${next.id} ${next.status === "planned" ? "· planned" : "→"}` : "末章"}</span>
      <strong>{next?.title ?? "完整回放"}</strong>
    </button>
  </nav>;
}
