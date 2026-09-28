import { ChapterNavigation } from "../components/ChapterNavigation";
import { LwfTaskHandoffView } from "../components/LwfTaskHandoffView";
import { getLwfChapter, type LwfChapterId } from "../data/chapters";

const arxivPaperRecord = "https://arxiv.org/abs/1606.09282v3";

export function Section05Sequential({ onOpenReference, onNavigateChapter }: {
  onOpenReference: (termId: string) => void;
  onNavigateChapter: (chapterId: LwfChapterId) => void;
}) {
  const evidenceChapterReady = getLwfChapter("06")?.status === "ready";

  return <section className="v3-narrative-chapter v3-sequential-chapter" id="chapter-05" aria-labelledby="v3-sequential-title">
    <header className="v3-chapter-heading">
      <span className="v3-stage-number">05</span>
      <div><p className="v3-eyebrow">CHAPTER 05 / 08 · SEQUENTIAL TASKS</p><h2 id="v3-sequential-title">一个任务完成后，下一项怎样接上？</h2><p>跟随任务级生命周期：固定上一阶段模型，在新输入上刷新旧响应，再训练并交接更新后的 Student。</p></div>
    </header>

    <section className="v3-sequential-block" aria-labelledby="v3-sequence-lifecycle-title">
      <div className="v3-sequential-block-heading"><span>05A · TASK-LEVEL LIFECYCLE</span><h3 id="v3-sequence-lifecycle-title">Studentₜ 会成为下一阶段的 Teacherₜ</h3></div>
      <div className="v3-sequence-timescales" aria-label="区分训练步与任务序列层级">
        <div><span>TRAINING-STEP LEVEL</span><strong>Chapter 03</strong><small>一个 minibatch 中的 Forward → Loss → Backward → Update</small></div>
        <div className="is-current"><span>TASK-SEQUENCE LEVEL</span><strong>Chapter 05</strong><small>一个任务阶段结束后，模型怎样交接到下一任务</small></div>
      </div>
      <LwfTaskHandoffView onOpenReference={onOpenReference} onNavigateChapter={onNavigateChapter} />
    </section>

    <section className="v3-sequential-block" aria-labelledby="v3-refresh-title">
      <div className="v3-sequential-block-heading"><span>05B · RESPONSE TARGET REFRESH</span><h3 id="v3-refresh-title">旧响应目标随阶段重新生成</h3></div>
      <div className="v3-refresh-pair">
        <article><span className="v3-refresh-stage">TASK B STAGE</span><p className="v3-refresh-flow"><b>X_B</b><i aria-hidden="true">→</i><b>Teacher_A</b><i aria-hidden="true">→</i><b>Y_A on X_B</b></p><small>Teacher_A 在本阶段的 B 输入上生成 A 任务的响应目标。</small></article>
        <article><span className="v3-refresh-stage">TASK C STAGE</span><p className="v3-refresh-flow"><b>X_C</b><i aria-hidden="true">→</i><b>Teacher_AB</b><i aria-hidden="true">→</i><b>Y_A, Y_B on X_C</b></p><small>下一阶段由更新后的 Teacher_AB 在 C 输入上重新生成所有旧任务响应。</small></article>
      </div>
      <div className="v3-sequence-drift" aria-label="跨任务阶段的概念性模型演进">
        <span>SEQUENTIAL DRIFT · CONCEPTUAL</span>
        <p>Task A → Model_A → Task B → Model_AB → Task C → Model_ABC</p>
        <small>每阶段的旧响应约束都来自当前 Teacher 与当前输入；随着共享参数适配，旧任务表现仍可能逐阶段变化。</small>
      </div>
      <p className="v3-refresh-boundary"><strong>不是永久 cache。</strong> 每一阶段只用当前 Teacher 在当前新任务输入上重算旧任务目标；不需要取回旧任务训练图像或标签。</p>
      <div className="v3-sequential-reference-links">
        <button type="button" onClick={() => onOpenReference("sequential-refresh")}>Reference Hub · response refresh ↗</button>
        <button type="button" onClick={() => onOpenReference("figure-4")}>Reference Hub · Figure 4 ↗</button>
      </div>
    </section>

    <section className="v3-sequential-block v3-sequential-evidence" aria-labelledby="v3-figure4-preview-title">
      <div className="v3-sequential-block-heading"><span>05C · PAPER EVIDENCE INDEX</span><h3 id="v3-figure4-preview-title">Figure 4 · 连续加入任务</h3></div>
      <p>论文在 Places365→VOC 与 ImageNet→Indoor Scenes 设置中分批加入任务，观察各任务在多个阶段的表现。这里标出原文位置和证据边界；详细读图留到 Chapter 06。</p>
      <figure className="v3-figure4-preview">
        <div className="v3-figure4-source">
          <span>原文定位 · Figure 4 · 第 8 页</span>
          <strong>连续加入任务后，各阶段的任务表现如何变化？</strong>
          <p>本页不直接展示或重绘论文原图。需要核对原图时，可从 arXiv 论文记录打开。</p>
          <a href={arxivPaperRecord} target="_blank" rel="noreferrer">打开 arXiv 论文记录 ↗</a>
        </div>
        <figcaption>Chapter 06 按论文报告的任务设置、曲线含义和结论边界逐项说明。</figcaption>
      </figure>
      <div className="v3-figure4-actions">
        <p>连续加入任务后，旧任务表现仍可能下降；该图不表示退化必然单调或完全避免。</p>
        <button type="button" disabled={!evidenceChapterReady} onClick={() => evidenceChapterReady && onNavigateChapter("06")}>在 Chapter 06 查看完整证据 →</button>
      </div>
    </section>

    <ChapterNavigation chapterId="05" onNavigate={onNavigateChapter} />
  </section>;
}
