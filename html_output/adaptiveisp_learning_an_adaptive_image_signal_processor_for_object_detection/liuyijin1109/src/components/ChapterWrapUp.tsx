export type ChapterWrapUpProps = {
  takeawayTitle: string;
  takeawayText: string;
  evidenceTitle: string;
  evidenceText: string;
  nextTitle: string;
  nextText: string;
  nextChapterLabel: string;
};

export function ChapterWrapUp({
  takeawayTitle,
  takeawayText,
  evidenceTitle,
  evidenceText,
  nextTitle,
  nextText,
  nextChapterLabel,
}: ChapterWrapUpProps) {
  return (
    <div className="embed-takeaway" aria-label="本章总结与下一问">
      <div className="et-item">
        <div className="et-icon" aria-hidden="true">🎯</div>
        <div className="et-title">{takeawayTitle}</div>
        <div className="et-desc">{takeawayText}</div>
      </div>
      <div className="et-arrow" aria-hidden="true">→</div>
      <div className="et-item">
        <div className="et-icon" aria-hidden="true">🔧</div>
        <div className="et-title">{evidenceTitle}</div>
        <div className="et-desc">{evidenceText}</div>
      </div>
      <div className="et-arrow" aria-hidden="true">→</div>
      <div className="et-item">
        <div className="et-icon" aria-hidden="true">✨</div>
        <div className="et-title">{nextTitle}</div>
        <div className="et-desc">{nextText}</div>
        <div className="et-next-label">{nextChapterLabel}</div>
      </div>
    </div>
  );
}
