import { TermRef } from "../../shared/core/reference";
import { ChapterNavigation } from "../components/ChapterNavigation";
import { NarrativeStep } from "../components/NarrativeStep";
import { ReplayControl } from "../components/ReplayControl";
import type { LwfChapterId } from "../data/chapters";
import { trainingSteps } from "../data/process";
import { termsById } from "../data/references";

export function Section03TrainingCycle({ activeStepId, onOpenReference, onSelectStep, onNavigateChapter }: {
  activeStepId: string | null;
  onOpenReference: (termId: string) => void;
  onSelectStep: (stepId: string) => void;
  onNavigateChapter: (chapterId: LwfChapterId) => void;
}) {
  return <section className="v3-narrative-chapter v3-training-cycle" id="chapter-03" aria-labelledby="v3-training-title">
    <header className="v3-chapter-heading">
      <span className="v3-stage-number">03</span>
      <div><p className="v3-eyebrow">CHAPTER 03 / 08 · ONE TRAINING CYCLE</p><h2 id="v3-training-title">两项损失，更新同一个 Student</h2><p>目标提供梯度；Optimizer Step 才真正改变参数。</p></div>
    </header>
    <div className="v3-narrative-list">
      {trainingSteps.map((step, index) => <NarrativeStep key={step.id} id={step.id} index={index + 5} title={step.title} description={step.description} active={activeStepId === step.id} onSelect={onSelectStep}>
        {step.id === "cycle-warmup" ? <p className="v3-parameter-state"><span>θₛ <b>冻结</b></span><span>θₒ <b>冻结</b></span><span>θₙ <b>可训练</b></span></p> : null}
        {step.id === "cycle-forward" ? <p className="v3-narrative-note">Teacher: Xₙ → Yₒ。Student: Xₙ → θₛ，再分成旧、新任务输出。</p> : null}
        {step.id === "cycle-old-loss" ? <p className="v3-narrative-note"><TermRef term={termsById.yo} onOpenReference={onOpenReference} /> 与 <TermRef term={termsById["yhat-o"]} onOpenReference={onOpenReference} /> 比较，形成旧响应保持项。</p> : null}
        {step.id === "cycle-new-loss" ? <p className="v3-narrative-note"><TermRef term={termsById.yn} onOpenReference={onOpenReference} /> 只监督 Student 的新任务输出 <TermRef term={termsById["yhat-n"]} onOpenReference={onOpenReference} />。</p> : null}
        {step.id === "cycle-backward" ? <p className="v3-gradient-note">L_old → θₒ → θₛ <span>·</span> L_new → θₙ → θₛ</p> : null}
        {step.id === "cycle-update" ? <>
          <div className="v3-objective-line"><span>联合目标</span><strong>L = λₒ L_old + L_new + R</strong></div>
          <p className="v3-narrative-note"><TermRef term={termsById["lambda-o"]} onOpenReference={onOpenReference} /> 调整旧响应项权重；R 是常规正则项。Teacher 始终固定。</p>
          <ReplayControl onSelectStep={onSelectStep} />
        </> : null}
      </NarrativeStep>)}
    </div>
    <ChapterNavigation chapterId="03" onNavigate={onNavigateChapter} />
  </section>;
}
