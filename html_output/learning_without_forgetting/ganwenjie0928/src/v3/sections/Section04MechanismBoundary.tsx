import { ChapterNavigation } from "../components/ChapterNavigation";
import { CoverageBoundaryView } from "../components/CoverageBoundaryView";
import { ObjectiveBalanceView } from "../components/ObjectiveBalanceView";
import { PreservationCompare } from "../components/PreservationCompare";
import type { LwfChapterId } from "../data/chapters";

export function Section04MechanismBoundary({ onOpenReference, onNavigateChapter }: {
  onOpenReference: (termId: string) => void;
  onNavigateChapter: (chapterId: LwfChapterId) => void;
}) {
  return <section className="v3-narrative-chapter v3-mechanism-chapter" id="chapter-04" aria-labelledby="v3-mechanism-title">
    <header className="v3-chapter-heading">
      <span className="v3-stage-number">04</span>
      <div><p className="v3-eyebrow">CHAPTER 04 / 08 · MECHANISM &amp; BOUNDARY</p><h2 id="v3-mechanism-title">保持旧响应，也给新任务留出空间</h2><p>理解约束对象、共同优化目标，以及约束覆盖不到的地方。</p></div>
    </header>

    <section className="v3-mechanism-block" aria-labelledby="v3-preservation-title">
      <div className="v3-mechanism-block-heading"><span>04A · WHAT IS PRESERVED?</span><h3 id="v3-preservation-title">保持的是响应，不是参数位置</h3></div>
      <PreservationCompare />
      <div className="v3-mechanism-reference-links">
        <button type="button" onClick={() => onOpenReference("response-preservation")}>Reference Hub · response preservation ↗</button>
        <button type="button" onClick={() => onOpenReference("parameter-l2")}>Reference Hub · parameter-L2 baseline ↗</button>
        <button type="button" onClick={() => onOpenReference("jacobian")}>Reference Hub · Jacobian background ↗</button>
      </div>
      <p className="v3-source-line">论文事实：LwF 匹配旧模型在当前新任务输入上的输出；参数 L2 是对照方法。arXiv:1606.09282v3，§3, Figure 2(e), PDF pp.3–4, 9–10。</p>
    </section>

    <section className="v3-mechanism-block" aria-labelledby="v3-objective-title">
      <div className="v3-mechanism-block-heading"><span>04B · STABILITY–PLASTICITY</span><h3 id="v3-objective-title">两个目标共同作用于共享参数</h3></div>
      <ObjectiveBalanceView />
      <div className="v3-mechanism-reference-links">
        <button type="button" onClick={() => onOpenReference("lambda-o")}>Reference Hub · λₒ ↗</button>
        <button type="button" onClick={() => onOpenReference("temperature")}>Reference Hub · Temperature ↗</button>
        <button type="button" onClick={() => onOpenReference("regularization")}>Reference Hub · R / weight decay ↗</button>
        <button type="button" onClick={() => onOpenReference("stability-plasticity")}>Reference Hub · stability–plasticity ↗</button>
        <button type="button" onClick={() => onOpenReference("figure-7")}>Reference Hub · Figure 7 ↗</button>
      </div>
    </section>

    <section className="v3-mechanism-block" aria-labelledby="v3-coverage-title-heading">
      <div className="v3-mechanism-block-heading"><span>04C · WHERE THE CONSTRAINT STOPS</span><h3 id="v3-coverage-title-heading">旧响应约束只覆盖当前 Xₙ</h3></div>
      <CoverageBoundaryView />
      <div className="v3-mechanism-reference-links">
        <button type="button" onClick={() => onOpenReference("domain-coverage")}>Reference Hub · domain coverage ↗</button>
        <button type="button" onClick={() => onOpenReference("old-domain-risk")}>Reference Hub · unobserved old-domain behavior ↗</button>
      </div>
      <p className="v3-source-line">作者讨论了输入分布差异对旧任务表现的影响；本节把它表述为覆盖边界。arXiv:1606.09282v3，PDF pp.2, 7, 10。</p>
    </section>

    <ChapterNavigation chapterId="04" onNavigate={onNavigateChapter} />
  </section>;
}
