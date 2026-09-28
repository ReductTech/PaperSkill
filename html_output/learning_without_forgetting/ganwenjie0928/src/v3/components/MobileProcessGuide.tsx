import { LwfProcessView } from "./LwfProcessView";
import { ReplayControl } from "./ReplayControl";
import { ChapterNavigation } from "./ChapterNavigation";
import { keyMoveSteps, trainingSteps } from "../data/process";
import type { LwfChapterId } from "../data/chapters";

const allSteps = [...keyMoveSteps, ...trainingSteps];

export function MobileProcessGuide({ activeStepId, onSelectStep, onNavigateChapter }: { activeStepId: string; onSelectStep: (stepId: string) => void; onNavigateChapter: (chapterId: LwfChapterId) => void }) {
  const index = Math.max(0, allSteps.findIndex((step) => step.id === activeStepId));
  const step = allSteps[index];
  const isKeyMove = index < keyMoveSteps.length;
  const chapterId = isKeyMove ? "02" : "03";

  return <section className="v3-mobile-process" id="v3-mobile-process" aria-label="02–03 持续训练图与逐步说明">
    <header className="v3-mobile-step-heading"><p className="v3-eyebrow">CHAPTER {chapterId} / 08 · {isKeyMove ? "KEY MOVE" : "ONE TRAINING CYCLE"} <span>STEP {index + 1} / 10</span></p><h2>{step.title}</h2></header>
    <LwfProcessView activeStepId={step.id} />
    <div className="v3-mobile-step-copy" aria-live="polite">
      <p>{step.description}</p>
      {step.id === "key-generate-response" ? <p className="v3-narrative-note">Yₒ 是 Teacher 对当前 Xₙ 的输出；不是旧任务真值标签或回放样本。</p> : null}
      {step.id === "key-expand-student" ? <p className="v3-narrative-note">共享 θₛ 保持主体；旧 head θₒ 保留旧输出；新 head θₙ 学习当前任务。</p> : null}
      {step.id === "cycle-warmup" ? <p className="v3-parameter-state"><span>θₛ <b>冻结</b></span><span>θₒ <b>冻结</b></span><span>θₙ <b>可训练</b></span></p> : null}
      {step.id === "cycle-forward" ? <p className="v3-narrative-note">Teacher: Xₙ → Yₒ。Student: Xₙ → θₛ → Ŷₒ / Ŷₙ。</p> : null}
      {step.id === "cycle-backward" ? <p className="v3-gradient-note">L_old → θₒ → θₛ <span>·</span> L_new → θₙ → θₛ</p> : null}
      {step.id === "cycle-update" ? <><p className="v3-objective-line"><span>联合目标</span><strong>L = λₒ L_old + L_new + R</strong></p><p className="v3-narrative-note">Backward 计算梯度；Optimizer Step 才更新 Student。</p><ReplayControl onSelectStep={onSelectStep} /></> : null}
    </div>
    <nav className="v3-mobile-step-controls" aria-label="切换流程步骤">
      <button type="button" onClick={() => onSelectStep(allSteps[index - 1].id)} disabled={index === 0}>← 上一步</button>
      <span>{String(index + 1).padStart(2, "0")} / 10</span>
      <button type="button" onClick={() => onSelectStep(allSteps[index + 1].id)} disabled={index === allSteps.length - 1}>下一步 →</button>
    </nav>
    <ChapterNavigation chapterId={chapterId} onNavigate={onNavigateChapter} />
  </section>;
}
