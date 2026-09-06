/**
 * PaperSkill reveal pattern: chapters start hidden; the loader at the
 * frontier reveals the next one. Clicking is never gated on completion.
 */
export function ChapterLoader({
  hint,
  step,
  label,
  onReveal,
}: {
  hint: string;
  step: number;
  label: string;
  onReveal: () => void;
}) {
  return (
    <div className="chap-loader" data-next-step={step}>
      <span className="chap-loader-hint">{hint}</span>
      <button type="button" className="chap-loader-btn" onClick={onReveal}>
        <span className="chap-loader-step" aria-hidden="true">§{step}</span>
        <span>{label}</span>
        <span className="chap-loader-arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );
}

export default ChapterLoader;
