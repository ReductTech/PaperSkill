import { ChapterNavigation } from "../components/ChapterNavigation";
import { LwfEvidenceExplorer } from "../components/LwfEvidenceExplorer";
import { ResultProtocolCard } from "../components/ResultProtocolCard";
import type { LwfChapterId } from "../data/chapters";

export function Section06Evidence({ onOpenReference, onNavigateChapter }: {
  onOpenReference: (termId: string) => void;
  onNavigateChapter: (chapterId: LwfChapterId) => void;
}) {
  return <section className="v3-narrative-chapter v3-evidence-chapter" id="chapter-06" aria-labelledby="v3-evidence-chapter-title">
    <header className="v3-chapter-heading">
      <span className="v3-stage-number">06</span>
      <div><p className="v3-eyebrow">CHAPTER 06 / 08 · PAPER EVIDENCE</p><h2 id="v3-evidence-chapter-title">论文的实验真正支持了什么？</h2><p>按 Claim → Protocol → Evidence → Interpretation → Boundary 阅读，不把局部结果扩成普遍保证。</p></div>
    </header>

    <section className="v3-evidence-block v3-protocol-block" aria-labelledby="v3-protocol-block-title">
      <div className="v3-evidence-block-heading"><span>06A · EXPERIMENTAL PROTOCOL</span><h3 id="v3-protocol-block-title">先看实验在什么条件下进行</h3></div>
      <ResultProtocolCard onOpenReference={onOpenReference} />
    </section>

    <LwfEvidenceExplorer onOpenReference={onOpenReference} />

    <ChapterNavigation chapterId="06" onNavigate={onNavigateChapter} />
  </section>;
}
