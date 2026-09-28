import { ChapterNavigation } from "../components/ChapterNavigation";
import { LwfGrandTrail } from "../components/LwfGrandTrail";
import type { LwfChapterId } from "../data/chapters";

export function Section07Replay({ onOpenReference, onNavigateChapter }: {
  onOpenReference: (termId: string) => void;
  onNavigateChapter: (chapterId: LwfChapterId) => void;
}) {
  return <section className="v3-narrative-chapter v3-replay-chapter" id="chapter-07" aria-labelledby="v3-replay-title">
    <header className="v3-chapter-heading">
      <span className="v3-stage-number">07</span>
      <div><p className="v3-eyebrow">CHAPTER 07 / 08 · MODEL LINEAGE</p><h2 id="v3-replay-title">沿着模型轨迹，走完一次 LwF 生命周期</h2><p>从旧模型、新任务输入与响应刷新开始，跟随 Student 的训练与更新，直到它成为下一阶段 Teacher。</p></div>
    </header>

    <section className="v3-replay-block" aria-labelledby="v3-replay-block-title">
      <div className="v3-replay-block-heading"><span>07A · GRAND TRAIL</span><h3 id="v3-replay-block-title">九个检查点，追踪模型如何交接到下一任务</h3><p>选择节点查看输入、输出与参数状态，也可以单次播放整条轨迹；联合训练中的 minibatch 顺序仍由 Chapter 03 解释。</p></div>
      <LwfGrandTrail onOpenReference={onOpenReference} onNavigateChapter={onNavigateChapter} />
    </section>

    <section className="v3-replay-takeaways" aria-labelledby="v3-replay-takeaways-title">
      <div className="v3-replay-block-heading"><span>FINAL MENTAL MODEL</span><h3 id="v3-replay-takeaways-title">离开前记住这六件事</h3></div>
      <ol>
        <li>旧训练数据不可用，但旧模型仍可用。</li>
        <li>Teacher 在当前新任务输入 Xₙ 上生成旧任务响应 Yₒ。</li>
        <li>Student 保留共享主体和旧 head，并增加新 head θₙ。</li>
        <li>L_old 保持旧响应；L_new 学习当前任务标签。</li>
        <li>联合优化时，共享参数 θₛ 同时受旧响应与新任务目标影响。</li>
        <li>当前 Student 完成后成为下一阶段 Teacher；下一任务会刷新响应目标。</li>
      </ol>
    </section>

    <ChapterNavigation chapterId="07" onNavigate={onNavigateChapter} />
  </section>;
}
