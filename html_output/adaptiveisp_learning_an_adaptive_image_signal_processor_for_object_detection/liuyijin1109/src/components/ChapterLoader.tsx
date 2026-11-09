/** Matches the reference Hero/App loader markup; styles come only from its CSS. */
import { chapters } from "../content";
export function ChapterLoader({
  next,
  onContinue,
}: {
  next: number;
  onContinue: () => void;
}) {
  return (
    <div className="chap-loader">
      <div className="chap-loader-hint">
        {next === 1 ? "准备好了吗？" : null}
      </div>
      <button
        className="chap-loader-btn"
        onClick={onContinue}
        aria-label={next === 1 ? `开始学习：${chapters[0][0]}` : undefined}
      >
        {next === 1 ? "开始学习" : "继续学习"} §{next}{" "}
        <span className="chap-loader-arrow">→</span>
      </button>
    </div>
  );
}
