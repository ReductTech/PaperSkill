import type { Checkpoint, Takeaway } from '../types';
import { GlossaryText } from './Glossary';
import { CheckpointCard } from './EvidencePanel';

/**
 * 总结节 (PaperSkill §2.3): exactly three takeaways, then the chapter's
 * one-minute self-check.
 */
export function ChapterSummary({
  takeaways,
  checkpoint,
}: {
  takeaways: readonly [Takeaway, Takeaway, Takeaway];
  checkpoint: Checkpoint;
}) {
  return (
    <section className="chapter-summary" aria-label="本章要点与自检">
      <header>
        <h3>本章要点</h3>
        <span>总结节 · 3 条</span>
      </header>
      <div className="takeaways-grid">
        {takeaways.map((item) => (
          <article key={item.title} className="takeaway-card">
            <i aria-hidden="true">{item.icon}</i>
            <b>{item.title}</b>
            <p><GlossaryText text={item.desc} /></p>
          </article>
        ))}
      </div>
      <CheckpointCard checkpoint={checkpoint} />
    </section>
  );
}

export default ChapterSummary;
