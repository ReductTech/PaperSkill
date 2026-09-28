import { TermRef } from "../../shared/core/reference";
import { ChapterNavigation } from "../components/ChapterNavigation";
import { LwfArchitectureView } from "../components/LwfArchitectureView";
import { termsById } from "../data/references";
import type { LwfChapterId } from "../data/chapters";

export function Section01Architecture({ onOpenReference, onNavigateChapter }: { onOpenReference: (termId: string) => void; onNavigateChapter: (chapterId: LwfChapterId) => void }) {
  return <section className="v3-stage v3-architecture-stage" id="chapter-01" aria-labelledby="v3-architecture-title">
    <header className="v3-stage-heading">
      <span className="v3-stage-number">01</span>
      <div><p className="v3-eyebrow">CHAPTER 01 / 08 · MODEL STRUCTURE</p><h2 id="v3-architecture-title">Teacher 固定，Student 扩展</h2><p><TermRef term={termsById.teacher} onOpenReference={onOpenReference} /> 提供旧行为目标；Student 用共享主体连接旧任务与新任务输出。</p></div>
    </header>
    <LwfArchitectureView onOpenReference={onOpenReference} />
    <ChapterNavigation chapterId="01" onNavigate={onNavigateChapter} />
  </section>;
}
