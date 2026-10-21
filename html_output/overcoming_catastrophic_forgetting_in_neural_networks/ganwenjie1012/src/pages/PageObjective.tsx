import { useState } from "react";
import type { ReactNode } from "react";
import { FlowStepper, type FlowStep } from "../shared/core/flow-stepper/FlowStepper";
import { PaperFigure } from "../shared/core/paper-figure/PaperFigure";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import type { CanonicalReferenceId, RuntimeObjectId } from "../contracts/ids";
import { MathFormula } from "../shared/teaching/Math";

const UPDATE_EXAMPLE = {
  anchor: 0,
  current: 0.2,
  lambda: 1,
  learningRate: 1,
  taskBMinimum: 0.6,
  taskBCurvature: 0.25,
  fisherHigh: 0.8,
  fisherLow: 0.05,
};
const exampleOffset = UPDATE_EXAMPLE.current - UPDATE_EXAMPLE.anchor;
const exampleTaskBLoss = UPDATE_EXAMPLE.taskBCurvature * (UPDATE_EXAMPLE.current - UPDATE_EXAMPLE.taskBMinimum) ** 2;
const exampleTaskBGradient = 2 * UPDATE_EXAMPLE.taskBCurvature * (UPDATE_EXAMPLE.current - UPDATE_EXAMPLE.taskBMinimum);
const updateByFisher = (fisher: number) => {
  const penalty = (UPDATE_EXAMPLE.lambda / 2) * fisher * exampleOffset ** 2;
  const ewcGradient = UPDATE_EXAMPLE.lambda * fisher * exampleOffset;
  const totalGradient = exampleTaskBGradient + ewcGradient;
  const nextTheta = UPDATE_EXAMPLE.current - UPDATE_EXAMPLE.learningRate * totalGradient;
  return { fisher, penalty, ewcGradient, totalGradient, nextTheta, movement: nextTheta - UPDATE_EXAMPLE.current };
};
const HIGH_FISHER_UPDATE = updateByFisher(UPDATE_EXAMPLE.fisherHigh);
const LOW_FISHER_UPDATE = updateByFisher(UPDATE_EXAMPLE.fisherLow);

function signedValue(value: number, digits = 2) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}`;
}

const PENALTY_STEPS: FlowStep[] = [
  { id: "displacement", title: "当前参数减去旧锚点", description: "逐参数比较现在的 θ_i 与 Task A 训练结束时保存的 θ_A,i*。先问：当前参数已经离旧位置多远？", statusText: "θ 可训练 · θ_A* 是固定参考快照" },
  { id: "square", title: "平方偏移", description: "平方只记录偏离大小，使正负方向不会相互抵消；形式也与前面的局部 Gaussian 二次约束一致。", statusText: "正负方向都按偏移幅度计价" },
  { id: "fisher", title: "乘以该参数的 Fisher", description: "同样的偏移在高 Fisher 参数上代价更高，在低 Fisher 参数上代价更低。F_A,i 区分参数，λ 还没有加入。", statusText: "F_A,i = 参数级相对敏感性" },
  { id: "sum", title: "对全部参数求和", description: "整个网络的每个参数坐标都贡献自己的加权偏移代价。", statusText: "Σ_i 汇总逐参数约束" },
  { id: "global-scale", title: "加入整体强度 λ / 2", description: "λ 调整整条 EWC 约束的整体强度；它和逐参数变化的 F_A,i 不是同一个角色。", statusText: "λ = 全局约束强度 · F_A,i = 参数间相对强度" },
];

function RuntimeReference({ id, objectId, children }: { id: CanonicalReferenceId; objectId: RuntimeObjectId; children: ReactNode }) {
  const api = useReferenceApi();
  return <ReferenceTrigger id={id} onActivate={() => api.setActiveRuntimeObject(objectId)}>{children}</ReferenceTrigger>;
}

function RuntimeNode({ objectId, eyebrow, title, detail }: {
  objectId: RuntimeObjectId;
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  const api = useReferenceApi();
  const active = api.activeRuntimeObject === objectId;
  return (
    <button type="button" className={"p06-runtime-node " + (active ? "is-highlighted" : "")} aria-pressed={active} onClick={() => api.setActiveRuntimeObject(active ? undefined : objectId)}>
      <span>{eyebrow}</span>
      <b>{title}</b>
      {detail ? <small>{detail}</small> : null}
    </button>
  );
}

function PenaltyBuildFormula({ step }: { step: number }) {
  const formulas = [
    String.raw`\textstyle \theta_i-\theta_{A,i}^*`,
    String.raw`\textstyle (\theta_i-\theta_{A,i}^*)^2`,
    String.raw`\textstyle F_{A,i}(\theta_i-\theta_{A,i}^*)^2`,
    String.raw`\textstyle \sum_i F_{A,i}(\theta_i-\theta_{A,i}^*)^2`,
    String.raw`\textstyle \frac{\lambda}{2}\sum_iF_{A,i}(\theta_i-\theta_{A,i}^*)^2`,
  ];
  return <MathFormula block tex={formulas[step]} />;
}

const PENALTY_MOTION_LABELS = [
  "当前参数 θ_i 与固定的 Task A 锚点 θ_A,i* 之间的距离，记作有方向的偏移 Δθ_i。",
  "同一锚点两侧的正负偏移，平方后得到相同的偏移代价。",
  "保持参数偏移相同，只改变 Fisher 权重；高 Fisher 对应更大的定性代价。",
  "每个参数坐标产生一项加权偏移代价，所有项都汇入求和。",
  "λ / 2 缩放整段 Task A 约束，再与 Task B Loss 相加组成 EWC Objective。",
];

function PenaltyMotion({ step }: { step: number }) {
  return (
    <div className={`p06-penalty-motion p06-penalty-motion--${step + 1}`} role="img" aria-label={PENALTY_MOTION_LABELS[step]}>
      <div className="p06-motion-heading"><span>这一步在表达什么</span><b>{PENALTY_STEPS[step].title}</b></div>
      {step === 0 ? (
        <div className="p06-offset-visual">
          <div className="p06-offset-track" aria-hidden="true">
            <div className="p06-offset-axis"/>
            <div className="p06-offset-distance"><i/><b>Δθ<sub>i</sub></b></div>
            <div className="p06-offset-point p06-offset-point--anchor"><i/><b>θ<sub>A,i</sub>*</b><small>Task A · 固定</small></div>
            <div className="p06-offset-point p06-offset-point--current"><i/><b>θ<sub>i</sub></b><small>当前 · 可训练</small></div>
          </div>
          <p>读出当前值相对旧锚点的偏移；锚点不随 Task B 更新。</p>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="p06-square-visual">
          <div className="p06-signed-axis" aria-hidden="true">
            <span className="p06-signed-point p06-signed-point--minus"><i/><b>−Δθ<sub>i</sub></b></span>
            <span className="p06-signed-point p06-signed-point--anchor"><i/><b>θ<sub>A,i</sub>*</b></span>
            <span className="p06-signed-point p06-signed-point--plus"><i/><b>+Δθ<sub>i</sub></b></span>
          </div>
          <div className="p06-square-results">
            <div><span>左侧偏移</span><b>(−Δθ<sub>i</sub>)<sup>2</sup> = Δθ<sub>i</sub><sup>2</sup></b></div>
            <div><span>右侧偏移</span><b>(+Δθ<sub>i</sub>)<sup>2</sup> = Δθ<sub>i</sub><sup>2</sup></b></div>
          </div>
          <p>偏移方向可以不同，平方后的大小相同。</p>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="p06-fisher-visual">
          <div className="p06-fisher-lane p06-fisher-lane--high">
            <div className="p06-fisher-lane__title"><b>High F<sub>A,i</sub></b><span>同样的 Δθ<sub>i</sub></span></div>
            <div className="p06-fisher-lane__track" aria-hidden="true"><i/><b/></div>
            <div className="p06-fisher-cost"><span>F × Δθ<sup>2</sup></span><i><b/></i><strong>代价较高</strong></div>
          </div>
          <div className="p06-fisher-lane p06-fisher-lane--low">
            <div className="p06-fisher-lane__title"><b>Low F<sub>A,j</sub></b><span>同样的 Δθ<sub>j</sub></span></div>
            <div className="p06-fisher-lane__track" aria-hidden="true"><i/><b/></div>
            <div className="p06-fisher-cost"><span>F × Δθ<sup>2</sup></span><i><b/></i><strong>代价较低</strong></div>
          </div>
          <p>柱长只作相对大小示意，不代表测量数据。</p>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="p06-sum-visual">
          <div className="p06-sum-terms">
            <div><span>参数坐标 i = 1</span><b>F<sub>A,1</sub> Δθ<sub>1</sub>²</b><i aria-hidden="true">↓</i></div>
            <div><span>参数坐标 i = 2</span><b>F<sub>A,2</sub> Δθ<sub>2</sub>²</b><i aria-hidden="true">↓</i></div>
            <div><span>… i = P</span><b>F<sub>A,P</sub> Δθ<sub>P</sub>²</b><i aria-hidden="true">↓</i></div>
          </div>
          <div className="p06-sum-accumulator"><b>Σ<sub>i</sub></b><span>把每个参数的代价汇总</span></div>
          <p>每一项对应一个参数坐标；网络参数逐项累加。</p>
        </div>
      ) : null}
      {step === 4 ? (
        <div className="p06-scale-visual">
          <div className="p06-scaled-penalty">
            <span className="p06-scale-factor">λ / 2</span><span className="p06-scale-times">×</span>
            <div className="p06-scale-bracket"><small>整段旧任务约束</small><b>Σ<sub>i</sub> F<sub>A,i</sub>(θ<sub>i</sub> − θ<sub>A,i</sub>*)²</b></div>
          </div>
          <div className="p06-scale-down" aria-hidden="true">↓</div>
          <div className="p06-objective-join">
            <div className="p06-objective-chip p06-objective-chip--task"><b>L<sub>B</sub>(θ)</b><span>Task B Loss</span></div>
            <strong>+</strong><div className="p06-objective-chip p06-objective-chip--constraint"><b>Ω<sub>A</sub>(θ)</b><span>λ/2 × 整段约束</span></div>
            <strong>→</strong><div className="p06-objective-chip p06-objective-chip--total"><b>L<sub>EWC</sub>(θ)</b><span>合并后的目标</span></div>
          </div>
          <p>λ 是全局强度；F<sub>A,i</sub> 仍负责区分各个参数。</p>
        </div>
      ) : null}
    </div>
  );
}

function SequentialBayes() {
  return (
    <section className="p06-bayes" aria-labelledby="p06-bayes-title">
      <span className="p06-overline">FROM ONE TASK POSTERIOR TO THE NEXT</span>
      <h2 id="p06-bayes-title">先把 Task A 的 Posterior 带到 Task B</h2>
      <p className="p06-section-lead">Task B 的新数据提供当前 Loss，Task A 的 Posterior 携带旧任务信息。下面两路分别追踪它们的来源。</p>
      <details className="p06-bayes-derivation">
        <summary>为何得到加法目标？展开 Sequential Bayes 推导</summary>
        <div>
          <p>假设给定 θ 后两批任务数据条件独立，Task A Posterior 作为 Task B 更新的先验贡献：</p>
          <MathFormula block tex={String.raw`p(\theta\mid D_A,D_B)\propto p(D_B\mid\theta)p(\theta\mid D_A)`} />
          <p>取负对数后，乘积变为相加；C 与当前 θ 无关，优化时可忽略。第二项保留 Task A 信息，其局部二次近似稍后由 Anchor 与 Fisher 装配。</p>
          <MathFormula block tex={String.raw`-\log p(\theta\mid D_A,D_B)=-\log p(D_B\mid\theta)-\log p(\theta\mid D_A)+C`} />
        </div>
      </details>
      <div className="p06-bayes-branches">
        <article className="p06-source-card p06-source-card--new">
          <span className="p06-source-label">TASK B · LEARN THE NEW TASK</span>
          <RuntimeNode objectId="task-b-data" eyebrow="NEW DATA" title="Task B Data" detail="D_B"/>
          <i aria-hidden="true">↓</i>
          <p className="p06-branch-math" aria-label="Task B Loss 等于 Task B 数据似然的负对数">
            <span>−log</span><ReferenceTrigger id="p_D_given_theta">p(D<sub>B</sub> | θ)</ReferenceTrigger>
            <span>=</span><RuntimeReference id="task_b_loss" objectId="task-b-loss">L<sub>B</sub>(θ)</RuntimeReference>
          </p>
          <p className="p06-source-copy">沿用 P2 的计算方式，换成 Task B 的输入与标签，得到新数据 Loss。</p>
        </article>
        <article className="p06-source-card p06-source-card--old">
          <span className="p06-source-label">TASK A · PRESERVE LOCAL CONSTRAINTS</span>
          <div className="p06-posterior-reference"><ReferenceTrigger id="task_a_posterior">p(θ | D<sub>A</sub>)</ReferenceTrigger><span>旧任务 Posterior</span></div>
          <i aria-hidden="true">↓</i>
          <p className="p06-source-copy">P4 将负对数后验的局部变化写成二次代价，P5 用对角 Fisher 近似局部精度。现在读出这两个已保存对象：</p>
          <div className="p06-old-objects">
            <RuntimeNode objectId="task-a-anchor" eyebrow="TASK A · ANCHOR" title="θ_A*" detail="固定参数快照"/>
            <RuntimeNode objectId="task-a-fisher" eyebrow="TASK A · DIAGONAL FISHER" title="F_A" detail="参数级敏感性近似"/>
          </div>
          <p className="p06-source-copy">Anchor 指定从哪里量偏移，Fisher 指定各坐标的代价权重；缺少任意一个都无法定义旧任务约束。下面按这一来源逐项构造。</p>
        </article>
      </div>
    </section>
  );
}

function PenaltyBuilder({ step, onStepChange }: { step: number; onStepChange: (index: number) => void }) {
  return (
    <section className="p06-builder" id="penalty-components" aria-labelledby="p06-builder-title">
      <div className="p06-section-heading">
        <div><span className="p06-overline">BUILD THE CONSTRAINT · ONE PIECE AT A TIME</span><h2 id="p06-builder-title">逐项装配 EWC Penalty</h2></div>
        <p>从一个参数的偏移开始；点选步骤，看旧任务约束怎样完整组成。</p>
      </div>
      <div className="p06-builder-context">
        <RuntimeNode objectId="current-parameters" eyebrow="CURRENT · TRAINABLE" title="当前参数 θ" detail="Task B 训练中继续更新"/>
        <span className="p06-builder-context__compare">与旧位置比较</span>
        <RuntimeNode objectId="task-a-anchor" eyebrow="SAVED · FIXED" title="Task A Anchor θ_A*" detail="旧任务训练结束时的快照"/>
      </div>
      <FlowStepper
        label="EWC 惩罚项装配步骤"
        steps={PENALTY_STEPS}
        step={step}
        onStepChange={(_selected, index) => onStepChange(index)}
        labels={{ step: "步骤", of: "/", previous: "上一步", next: "下一步" }}
      />
      <div className="p06-builder-stage" aria-live="polite">
        <PenaltyMotion key={step} step={step}/>
        <div className="p06-builder-equation">
          <span>步骤 {step + 1} / {PENALTY_STEPS.length}</span>
          <strong role="math" aria-label={"EWC penalty 装配第 " + (step + 1) + " 步"}><PenaltyBuildFormula step={step}/></strong>
        </div>
      </div>
      {step < PENALTY_STEPS.length - 1
        ? <p className="p06-builder-hint">继续到第 5 步后，完整 EWC Objective 与梯度路径会展开。</p>
        : <p className="p06-builder-hint is-complete">五个组成部分已连起来；下面给出论文 Equation (3) 与实际更新路径。</p>}
    </section>
  );
}

function CompleteObjective() {
  const api = useReferenceApi();
  return (
    <>
      <section className="p06-objective" id="ewc-objective" aria-labelledby="p06-objective-title">
        <span className="p06-overline">EQUATION (3) · TASK-B TRAINING OBJECTIVE</span>
        <h2 id="p06-objective-title">把新任务 Loss 与旧任务约束相加</h2>
        <MathFormula block tex={String.raw`L_{\mathrm{EWC}}(\theta)=L_B(\theta)+\frac{\lambda}{2}\sum_iF_{A,i}(\theta_i-\theta_{A,i}^*)^2`} />
        <p className="p06-objective-note">Equation (3) 把 Task B 的负 Log Likelihood 与以 θ_A* 为中心、由对角 F_A 加权的二次惩罚相加。λ 是实践中的整体权衡系数；Likelihood 的求和或平均方式、Fisher 估计尺度都会影响其取值，任意 λ 不自动对应未经调整的精确 Bayesian 后验。参数仍参与优化，惩罚改变的是偏移代价。</p>
        <div className="p06-symbol-legend" aria-label="公式符号说明">
          <div><b><RuntimeReference id="task_b_loss" objectId="task-b-loss">L<sub>B</sub></RuntimeReference></b><span>Task B 的新任务 Loss</span></div>
          <div><b><RuntimeReference id="theta" objectId="current-parameters">θ</RuntimeReference></b><span>当前可训练参数</span></div>
          <div><b><RuntimeReference id="theta_a_star" objectId="task-a-anchor">θ<sub>A</sub>*</RuntimeReference></b><span>旧任务固定 Anchor</span></div>
          <div><b><RuntimeReference id="fisher_a_i" objectId="task-a-fisher">F<sub>A,i</sub></RuntimeReference></b><span>参数级相对敏感性</span></div>
          <div><b><RuntimeReference id="lambda_ewc" objectId="ewc-penalty">λ</RuntimeReference></b><span>整体约束强度</span></div>
        </div>
      </section>

      <section className="p06-paper-context" aria-labelledby="p06-figure-title">
        <div className="p06-figure-reading">
          <span className="p06-overline">THE PAPER'S ORIGINAL VISUAL</span>
          <h2 id="p06-figure-title">回到论文 Figure 1</h2>
          <p className="p06-figure-reading__lead">先看两个任务各自的低误差区域，再沿三种颜色的箭头比较学习 Task B 时的参数移动。</p>
          <div className="p06-figure-key">
            <div className="p06-figure-key__regions">
              <div><i className="p06-key-swatch p06-key-swatch--task-b"/><span><b>浅黄色区域</b><small>Task B 低误差区域</small></span></div>
              <div><i className="p06-key-swatch p06-key-swatch--task-a"/><span><b>灰色区域</b><small>Task A 低误差区域</small></span></div>
            </div>
            <div className="p06-figure-key__updates" aria-label="图中参数移动方向图例">
              <span><i className="p06-key-line p06-key-line--ewc"/>EWC</span>
              <span><i className="p06-key-line p06-key-line--l2"/>L2</span>
              <span><i className="p06-key-line p06-key-line--none"/>无惩罚</span>
            </div>
          </div>
          <p className="p06-figure-reading__boundary">这是论文中的参数区域与更新方向示意；本页后面的梯度数值是独立教学示例。</p>
        </div>
        <div className="p06-figure-preview">
          <PaperFigure
            src={new URL("images/figure-1.png", document.baseURI).toString()}
            alt="Kirkpatrick 等人在 EWC 论文 Figure 1 中展示的连续任务参数区域与 EWC 约束示意。"
            figureLabel="Figure 1"
            caption="图中对比了学习新任务时不同参数约束对旧任务低误差区域的影响。此处重看论文原图，不把后面的教学梯度示例当作论文实验数值。"
            source="Kirkpatrick et al., PNAS 2017, Fig. 1"
            mode="original"
          />
        </div>
      </section>

      <section className="p06-method-comparison" aria-labelledby="p06-comparison-title">
        <div className="p06-section-heading">
          <div><span className="p06-overline">THREE WAYS TO TRAIN ON TASK B</span><h2 id="p06-comparison-title">从普通微调到参数级约束</h2></div>
          <p>关键差别是旧任务信息怎样改变每个参数偏移的代价。</p>
        </div>
        <div className="p06-method-grid">
          <article className="p06-method-card">
            <span>PLAIN FINE-TUNING</span><h3>只优化新任务</h3>
            <p>更新只由 Task B Loss 决定。</p>
          </article>
          <article className="p06-method-card p06-method-card--uniform">
            <span>UNIFORM L2 · A CONCEPTUAL COMPARISON</span><h3>所有坐标同等加权</h3>
            <p>以旧参数为中心，但不给不同坐标区分 Fisher 权重。</p>
          </article>
          <article className="p06-method-card p06-method-card--ewc">
            <span>EWC</span><h3>按旧任务敏感性加权</h3>
            <p>每个参数使用自己的 Fisher 相对敏感度，偏移代价各不相同。</p>
          </article>
        </div>
      </section>

      <section className="p06-gradient-section" id="gradient-junction" aria-labelledby="p06-gradient-title">
        <div className="p06-section-heading">
          <div><span className="p06-overline">FROM OBJECTIVE TO UPDATE</span><h2 id="p06-gradient-title">两路梯度在优化器前汇合</h2></div>
          <p>EWC 改变送入优化器的总梯度；优化器仍然更新同一个模型参数 θ。</p>
        </div>
        <details className="p06-gradient-derivation">
          <summary>展开导数式：验证两路梯度的来源</summary>
          <div>
            <div className="p06-derivative" role="math" aria-label="EWC objective derivative with respect to parameter theta i">
              <span className="p06-derivative__label">对 Equation (3) 求导</span>
              <MathFormula block tex={String.raw`\frac{\partial L_{\mathrm{EWC}}}{\partial\theta_i}=\frac{\partial L_B}{\partial\theta_i}+\lambda F_{A,i}(\theta_i-\theta_{A,i}^*)`} />
            </div>
            <p className="p06-derivative-note">这是 Equation (3) 的梯度实现展开；论文没有将其另列为独立公式。</p>
          </div>
        </details>

        <div className="p06-gradient-junction">
          <div className="p06-junction-inputs">
            <article className="p06-junction-branch p06-junction-branch--task">
              <span className="p06-source-label">TASK B · LEARN NEW DATA</span>
              <RuntimeNode objectId="task-b-data" eyebrow="DATA" title="Task B Data"/>
              <i aria-hidden="true">↓</i>
              <RuntimeNode objectId="task-b-loss" eyebrow="LOSS" title="L_B(θ)"/>
              <i aria-hidden="true">↓</i>
              <RuntimeNode objectId="task-b-gradient" eyebrow="TASK-B GRADIENT" title="g_B"/>
            </article>
            <article className="p06-junction-branch p06-junction-branch--constraint">
              <span className="p06-source-label">TASK A · CONSTRAIN OLD-TASK MOVEMENT</span>
              <div className="p06-junction-objects">
                <RuntimeNode objectId="current-parameters" eyebrow="CURRENT θ" title="可训练参数"/>
                <RuntimeNode objectId="task-a-anchor" eyebrow="FIXED ANCHOR" title="θ_A*"/>
                <RuntimeNode objectId="task-a-fisher" eyebrow="FISHER WEIGHTS" title="F_A"/>
              </div>
              <i aria-hidden="true">↓</i>
              <RuntimeNode objectId="ewc-penalty" eyebrow="QUADRATIC PENALTY" title="EWC Penalty"/>
              <i aria-hidden="true">↓</i>
              <RuntimeNode objectId="ewc-gradient" eyebrow="EWC GRADIENT" title="g_EWC"/>
            </article>
          </div>
          <div className="p06-gradient-merge">
            <div className="p06-gradient-sum">
              <RuntimeNode objectId="task-b-gradient" eyebrow="NEW-TASK SIGNAL" title="g_B"/>
              <span>+</span>
              <RuntimeNode objectId="ewc-gradient" eyebrow="OLD-TASK CONSTRAINT" title="g_EWC"/>
              <i aria-hidden="true">→</i>
              <RuntimeNode objectId="total-gradient" eyebrow="COMBINED GRADIENT" title="g_total"/>
            </div>
            <div className="p06-optimizer-flow">
              <i aria-hidden="true">↓</i>
              <RuntimeNode objectId="optimizer" eyebrow="UPDATE STEP" title="optimizer.step()" detail="接收总梯度并执行更新"/>
              <i aria-hidden="true">↓</i>
              <RuntimeNode objectId="current-parameters" eyebrow="SAME MODEL · PARAMETERS MOVE" title="θ → θ′" detail="参数仍可更新；高 Fisher 方向代价更高"/>
            </div>
          </div>
        </div>
        <div className="p06-lambda-note">
          <div><b><RuntimeReference id="fisher_a_i" objectId="task-a-fisher">F<sub>A,i</sub></RuntimeReference></b><span>区分不同参数的相对约束强度</span></div>
          <i aria-hidden="true">×</i>
          <div><b><RuntimeReference id="lambda_ewc" objectId="ewc-penalty">λ</RuntimeReference></b><span>调整整条 EWC 约束的整体强度</span></div>
        </div>
      </section>

      <section className="p06-update-example" aria-labelledby="p06-update-title">
        <div className="p06-section-heading">
          <div><span className="p06-overline">ILLUSTRATIVE GRADIENTS · NOT PAPER DATA</span><h2 id="p06-update-title">高 Fisher 参数仍会动，只是受到更强约束</h2></div>
          <p>Task B 的局部示例损失为 <MathFormula tex={String.raw`L_B(\theta)=0.25(\theta-0.60)^2`} />。在 θ=0.20 时，它的 Loss 是 {exampleTaskBLoss.toFixed(2)}，梯度是 {signedValue(exampleTaskBGradient)}。两种情况使用相同的旧 Anchor、当前参数、λ、学习率和 Task-B 梯度；只改变 Fisher。</p>
        </div>
        <div className="p06-update-context">
          <span>共同起点：θ<sub>A</sub>* = {UPDATE_EXAMPLE.anchor.toFixed(2)}</span>
          <span>当前参数：θ = {UPDATE_EXAMPLE.current.toFixed(2)}</span>
          <span>偏移：Δθ = {exampleOffset.toFixed(2)}</span>
          <span>约束强度：λ = {UPDATE_EXAMPLE.lambda.toFixed(1)}</span>
          <span>学习率：η = {UPDATE_EXAMPLE.learningRate.toFixed(1)}</span>
        </div>
        <div className="p06-update-grid">
          <article className="p06-update-card p06-update-card--high">
            <span>HIGH FISHER · LARGER OFFSET COST</span>
            <div><span>Fisher weight</span><b>{HIGH_FISHER_UPDATE.fisher.toFixed(2)}</b></div>
            <div><span>Task-B loss</span><b>{exampleTaskBLoss.toFixed(2)}</b></div>
            <div><span>EWC penalty</span><b>{HIGH_FISHER_UPDATE.penalty.toFixed(3)}</b></div>
            <div><span>Task-B gradient</span><b>{signedValue(exampleTaskBGradient)}</b></div>
            <div><span>EWC gradient</span><b>{signedValue(HIGH_FISHER_UPDATE.ewcGradient)}</b></div>
            <div className="p06-update-total"><span>Total gradient</span><b>{signedValue(HIGH_FISHER_UPDATE.totalGradient)}</b></div>
            <MathFormula block tex={String.raw`\theta'=\theta-\eta g_{\mathrm{total}}=${UPDATE_EXAMPLE.current.toFixed(2)}-\left(${HIGH_FISHER_UPDATE.totalGradient.toFixed(2)}\right)=${HIGH_FISHER_UPDATE.nextTheta.toFixed(2)}`} />
            <p>更新后移动 {signedValue(HIGH_FISHER_UPDATE.movement)}。参数仍在 optimizer 中更新；较大的 EWC 梯度抵消了更多远离 Anchor 的任务梯度。</p>
          </article>
          <article className="p06-update-card p06-update-card--low">
            <span>LOW FISHER · SMALLER OFFSET COST</span>
            <div><span>Fisher weight</span><b>{LOW_FISHER_UPDATE.fisher.toFixed(2)}</b></div>
            <div><span>Task-B loss</span><b>{exampleTaskBLoss.toFixed(2)}</b></div>
            <div><span>EWC penalty</span><b>{LOW_FISHER_UPDATE.penalty.toFixed(3)}</b></div>
            <div><span>Task-B gradient</span><b>{signedValue(exampleTaskBGradient)}</b></div>
            <div><span>EWC gradient</span><b>{signedValue(LOW_FISHER_UPDATE.ewcGradient)}</b></div>
            <div className="p06-update-total"><span>Total gradient</span><b>{signedValue(LOW_FISHER_UPDATE.totalGradient)}</b></div>
            <MathFormula block tex={String.raw`\theta'=\theta-\eta g_{\mathrm{total}}=${UPDATE_EXAMPLE.current.toFixed(2)}-\left(${LOW_FISHER_UPDATE.totalGradient.toFixed(2)}\right)=${LOW_FISHER_UPDATE.nextTheta.toFixed(2)}`} />
            <p>更新后移动 {signedValue(LOW_FISHER_UPDATE.movement)}。Fisher 权重较小，Task B 的梯度更大程度决定参数移动。</p>
          </article>
        </div>
        <p className="p06-update-rule">本例中，约束梯度与 Task B 梯度相反，较高 Fisher 抵消更多向外移动，所以本次移动较小。一般更新还取决于任务梯度、当前偏移、λ 和优化器，不能保证高 Fisher 坐标每一步移动都更小。特别是在旧 Anchor 上偏移为零时，约束梯度也为零；参数仍可更新。</p>
      </section>

      <section className="p06-closing" aria-labelledby="p06-closing-title">
        <span className="p06-overline">THE OBJECTIVE IS CLOSED · THE LIFECYCLE IS NEXT</span>
        <h2 id="p06-closing-title">一个 Task-B update 已经能从公式追到参数变化</h2>
        <p>现在，EWC 的损失、两路梯度与 optimizer.step() 已经接起来。完整训练还要按任务边界管理旧参数快照与 Fisher：</p>
        <ul>
          <li>Task A 结束时，什么时候保存 θ_A*？</li>
          <li>Fisher 什么时候计算，计算时参数是否继续更新？</li>
          <li>Task B 从哪个参数状态开始？</li>
        </ul>
        <button type="button" onClick={() => api.navigatePage("page-07-lifecycle")}>接下来：Page 7 · Task Boundary 生命周期 <span aria-hidden="true">→</span></button>
      </section>
    </>
  );
}

export function PageObjective() {
  const [step, setStep] = useState(0);
  const api = useReferenceApi();
  return (
    <article className="ewc-page p06-page" aria-labelledby="p06-title">
      <header className="ewc-page-header p06-header">
        <div className="ewc-page-header__kicker"><span>06</span> FROM OLD POSTERIOR TO EWC OBJECTIVE</div>
        <h1 id="p06-title">旧任务留下的信息，怎样改变 Task B 的参数更新？</h1>
        <p className="ewc-page-header__dek">现在已经有 Task A 的参数锚点 θ_A* 和局部敏感性 F_A。本页从 Sequential Bayes 出发，把它们逐步放入 Task B 的训练目标，再追到反向传播与 optimizer。</p>
      </header>

      <SequentialBayes/>
      <PenaltyBuilder step={step} onStepChange={setStep}/>
      {step === PENALTY_STEPS.length - 1
        ? <CompleteObjective/>
        : <div className="p06-locked-note" role="status">完整的 EWC Objective 将在逐项装配到第 5 步后显示。</div>}
      <nav className="p06-page-nav" aria-label="学习页面导航">
        <button type="button" onClick={() => api.navigatePage("page-05-fisher")}>← Page 5 · Fisher Information</button>
        <button type="button" onClick={() => api.navigatePage("page-07-lifecycle")}>Page 7 · Task Boundary Lifecycle →</button>
      </nav>
    </article>
  );
}
