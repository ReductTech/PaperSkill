import { TermRef } from "../../shared/core/reference";
import { ChapterNavigation } from "../components/ChapterNavigation";
import { problemFacts } from "../data/problem";
import { termsById } from "../data/references";
import type { LwfChapterId } from "../data/chapters";

const availability = [
  { id: "old-model", label: "OLD MODEL", state: "可运行", note: "保留旧任务模型" },
  { id: "old-data", label: "OLD TRAINING DATA", state: "不可用", note: "旧图像与标签无法访问" },
  { id: "new-data", label: "NEW DATA", state: "可用", note: "当前输入 Xₙ 与标签 Yₙ" },
];

const matrix = [
  { id: "finetuning", learn: "✓", preserve: "弱", withoutOldData: "✓", note: "共享参数更新，旧输出可能漂移。" },
  { id: "feature-extraction", learn: "受限", preserve: "✓", withoutOldData: "✓", note: "冻结共享表示，适应能力受限。" },
  { id: "joint-training", learn: "✓", preserve: "✓", withoutOldData: "✕", note: "需要旧任务样本和真实标签。" },
  { id: "lwf", learn: "✓", preserve: "目标", withoutOldData: "✓", note: "用 Teacher 在 Xₙ 上的响应作旧任务目标。" },
];

export function Section00Problem({ onOpenReference, onNavigateChapter }: { onOpenReference: (termId: string) => void; onNavigateChapter: (chapterId: LwfChapterId) => void }) {
  return <section className="v3-stage v3-problem" id="chapter-00" aria-labelledby="v3-problem-title">
    <header className="v3-stage-heading">
      <span className="v3-stage-number">00</span>
      <div><p className="v3-eyebrow">CHAPTER 00 / 08 · PROBLEM SETTING</p><h2 id="v3-problem-title">旧模型还在，旧数据不在</h2><p>新任务到来时，要学习当前标签，同时尽量保留旧任务的输出行为。</p></div>
    </header>

    <div className="v3-constraint-strip" aria-label="问题设定中的模型与数据状态">
      {availability.map((item, index) => {
        const fact = problemFacts.find((entry) => entry.id === item.id)!;
        return <div className={`v3-constraint-item ${fact.available ? "is-available" : "is-unavailable"}`} key={item.id}>
          <span className="v3-constraint-label">{item.label}</span>
          <span className="v3-constraint-state"><i aria-hidden="true">{fact.available ? "●" : "×"}</i>{item.state}</span>
          <span className="v3-constraint-note">{item.note}</span>
          {index < availability.length - 1 ? <span className="v3-constraint-divider" aria-hidden="true" /> : null}
        </div>;
      })}
    </div>

    <div className="v3-baseline-block">
      <div className="v3-subheading"><div><p className="v3-eyebrow">SAME INFORMATION CONSTRAINT</p><h3>常见路线的取舍</h3></div><span>快速比较，不展开实验细节</span></div>
      <div className="v3-matrix-wrap">
        <table className="v3-baseline-matrix">
          <thead><tr><th scope="col">方法</th><th scope="col">学新任务</th><th scope="col">保旧能力</th><th scope="col">不用旧数据</th></tr></thead>
          <tbody>{matrix.map((row) => {
              const refId = row.id === "finetuning" ? "fine-tuning" : row.id === "lwf" ? "lwf" : row.id;
            return <tr key={row.id} className={row.id === "lwf" ? "is-lwf" : ""}>
              <th scope="row"><TermRef term={termsById[refId]} onOpenReference={onOpenReference} /><small>{row.note}</small></th>
              <td>{row.learn}</td><td>{row.preserve}</td><td className={row.withoutOldData === "✕" ? "is-no" : ""}>{row.withoutOldData}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>

    <p className="v3-one-line-method"><span>LwF 的关键动作</span>用旧模型对 Xₙ 的旧任务响应，替代不可访问的旧训练监督。</p>
    <ChapterNavigation chapterId="00" onNavigate={onNavigateChapter} />
  </section>;
}
