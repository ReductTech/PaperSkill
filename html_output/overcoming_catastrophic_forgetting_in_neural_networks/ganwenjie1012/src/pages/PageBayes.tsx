import { useState } from "react";
import { FlowStepper, type FlowStep } from "../shared/core/flow-stepper";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import { PARAMETER_STATES, datasetLikelihood, EXAMPLE_EVIDENCE, type ParameterState } from "../data/probabilityExample";
import { MathFormula } from "../shared/teaching/Math";

type Candidate = { id: string; index: number; prior: number; likelihood: number; posterior: number; state: ParameterState };
type DistributionView = "before" | "after";

const CANDIDATES: Candidate[] = PARAMETER_STATES.map((state) => {
  const likelihood = datasetLikelihood(state);
  const posterior = (state.prior * likelihood) / EXAMPLE_EVIDENCE;
  return { id: state.id, index: state.index, prior: state.prior, likelihood, posterior, state };
});

const BAYES_STEPS: FlowStep[] = [
  {
    id: "task-a-update",
    title: "Task A 更新之前",
    description: "先明确数据到来前的 Prior；下一步再结合 Task A Likelihood 得到 Posterior。",
    statusText: "初态只显示 Prior；尚未吸收 Task A 的数据。",
  },
  {
    id: "task-boundary",
    title: "保留 Task A 的 Posterior",
    description: "Task A 学完后，p(θ | D_A) 汇总了旧任务数据对参数配置的约束。",
    statusText: "它是数学上的旧任务信息，不是另一套网络参数。",
  },
  {
    id: "task-b-update",
    title: "用 Task B 数据继续更新",
    description: "Task A 的 Posterior 作为新的先验贡献，再与 Task B 的 Likelihood 结合。",
    statusText: "旧任务的信息由此进入后续更新。",
  },
];

function ProbabilityOriginTable() {
  return (
    <div className="p03-origin-wrap">
      <table className="p03-origin-table">
        <thead>
          <tr><th scope="col">概率对象</th><th scope="col">当前状态</th><th scope="col">来源</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row"><ReferenceTrigger id="p_theta_y_given_x">p<sub>θ</sub>(y | x)</ReferenceTrigger></th><td>已解释</td><td>神经网络的前向计算</td></tr>
          <tr><th scope="row"><ReferenceTrigger id="p_D_given_theta">p(D<sub>A</sub> | θ)</ReferenceTrigger></th><td>已解释</td><td>各样本真实标签的预测概率组合</td></tr>
          <tr className="is-current"><th scope="row"><ReferenceTrigger id="p_theta">p(θ)</ReferenceTrigger></th><td>本页解释</td><td>数据到来前对参数配置的先验建模</td></tr>
          <tr className="is-current"><th scope="row"><ReferenceTrigger id="p_theta_given_D">p(θ | D<sub>A</sub>)</ReferenceTrigger></th><td>本页解释</td><td>结合 Task A 数据之后对参数配置的重新评价</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function ParameterPerspectives() {
  return (
    <section className="p03-section p03-perspectives" aria-labelledby="p03-perspectives-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">TWO WAYS TO DESCRIBE θ</span><h2 id="p03-perspectives-title">从一组数值，到参数配置的概率分布</h2></div>
        <p>Bayesian 视角描述的是我们对不同参数配置的相信程度，不表示程序同时保存了无数个模型。</p>
      </div>
      <div className="p03-perspective-compare">
        <div className="p03-perspective p03-perspective--ordinary">
          <span className="p03-perspective__label">ORDINARY PARAMETER VIEW</span>
          <h3>θ 是当前的一组具体数值</h3>
          <div className="p03-vector" role="img" aria-label="θ 由网络中的权重和偏置组成，是一组具体参数值">
            <MathFormula tex={String.raw`\theta=(W^{(1)},b^{(1)},W^{(2)},\ldots)`} />
          </div>
          <p>训练会不断调整这些参数，让模型更好地解释当前数据。</p>
        </div>
        <div className="p03-perspective__divider" aria-hidden="true"><span>换一个描述角度</span><i /></div>
        <div className="p03-perspective p03-perspective--bayesian">
          <span className="p03-perspective__label">BAYESIAN PARAMETER VIEW</span>
          <h3><MathFormula tex={String.raw`p(\theta)`} /> 描述数据到来前的参数知识</h3>
          <div className="p03-prior-points" role="img" aria-label="三个候选参数配置具有不同的先验权重">
            {CANDIDATES.map((candidate) => <span key={candidate.id}><span className="p03-prior-track"><i style={{ height: `${candidate.prior * 100}%` }} /></span><MathFormula tex={String.raw`\theta^{(${candidate.index})}`} /><span>{candidate.prior.toFixed(2)}</span></span>)}
            <small>Prior · 0–1 共同尺度<br />教学假设</small>
          </div>
          <p>要将新数据与已有信息结合，必须先说明数据到来前怎样看待完整参数配置。<ReferenceTrigger id="prior">Prior</ReferenceTrigger> 表达这个分布假设，可来自建模选择或此前任务；它不是本次 Forward 的输出，也不能看完数据后为迎合结果任意改数。</p>
        </div>
      </div>
      <details className="p03-background-detail" id="gaussian-prior-l2-link">
        <summary>展开背景：Gaussian Prior 与 L2 正则</summary>
        <div>
          <p>一个常见背景示例是 <MathFormula tex={String.raw`p(\theta)=\mathcal{N}(0,\sigma^2 I)`} />。它会降低极端参数值的先验权重。在相应设定下，负对数先验会产生二次惩罚，因此与 L2 正则有形式上的联系。</p>
          <p className="p03-boundary">这是一般背景示例。EWC 论文没有为一般 Bayes 公式指定这种 Gaussian Prior。</p>
        </div>
      </details>
    </section>
  );
}

function BayesBox() {
  return (
    <section className="p03-section p03-bayes-section" id="prior-likelihood-posterior" aria-labelledby="p03-bayes-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">PRIOR × LIKELIHOOD · BAYES UPDATE</span><h2 id="p03-bayes-title">Bayes Rule 把数据和参数先验接起来</h2></div>
        <p>从联合概率的两种分解得到更新式；数据、Prior 与 Posterior 的来源各不相同。</p>
      </div>
      <details className="p03-full-bayes">
        <summary>展开：从联合概率的两种分解得到 Bayes Rule</summary>
        <div className="p03-joint-derivation" aria-label="联合概率 p(theta, D A) 的两种分解">
          <div><span>同一联合概率，从 Likelihood 与 Prior 分解</span><MathFormula block tex={String.raw`p(\theta,D_A)=p(D_A\mid\theta)p(\theta)`} /></div>
          <div><span>从 Posterior 与 Evidence 分解</span><MathFormula block tex={String.raw`p(\theta,D_A)=p(\theta\mid D_A)p(D_A)`} /></div>
        </div>
      </details>
      <div className="p03-bayes-result" role="group" aria-label="由联合概率分解得到 Bayes 更新公式">
        <span>令两种分解相等，整理得到 Bayes Rule</span>
        <MathFormula block tex={String.raw`p(\theta\mid D_A)=\frac{p(D_A\mid\theta)p(\theta)}{p(D_A)}`} />
      </div>
      <div className="p03-bayes-box" aria-label="Bayes 更新示意：Likelihood 与 Prior 相乘，Evidence 归一化后得到 Posterior">
        <a className="p03-bayes-node p03-bayes-node--prior" href="#prior-explanation">
          <span>BEFORE TASK A DATA</span><b>Prior</b><strong><MathFormula tex={String.raw`p(\theta)`} /></strong><small>观察当前 D<sub>A</sub> 之前的参数权重</small>
        </a>
        <span className="p03-bayes-operator" aria-hidden="true">×</span>
        <a className="p03-bayes-node p03-bayes-node--likelihood" href="#likelihood-explanation">
          <span>FIXED TASK A DATA</span><b>Likelihood</b><strong><MathFormula tex={String.raw`p(D_A\mid\theta)`} /></strong><small>这组参数怎样解释同一份 D<sub>A</sub></small>
        </a>
        <span className="p03-bayes-combine" aria-hidden="true"><i /><b>重新加权</b><i /></span>
        <a className="p03-bayes-node p03-bayes-node--posterior" href="#posterior-explanation">
          <span>AFTER TASK A DATA</span><b>Posterior</b><strong><MathFormula tex={String.raw`p(\theta\mid D_A)`} /></strong><small>数据之后对参数配置的评价</small>
        </a>
        <div className="p03-bayes-normalizer" id="bayes-evidence-normalizer">
          <span>Evidence · p(D<sub>A</sub>)</span><p>对所有候选权重求和，得到归一化分母；后面用同一组示例数值核对。</p>
        </div>
      </div>
      <div className="p03-bayes-explanations">
        <div id="prior-explanation"><span>01 · PRIOR</span><h3><ReferenceTrigger id="prior">p(θ)</ReferenceTrigger> 在当前数据之前设定</h3><p>Prior 是观察这份 D<sub>A</sub> 之前对参数配置的建模分布。它须非负且归一化；已有知识可影响它，但不能看完 D<sub>A</sub> 后为了预设结果任意改数。</p></div>
        <div id="likelihood-explanation"><span>02 · LIKELIHOOD</span><h3><ReferenceTrigger id="likelihood">p(D<sub>A</sub> | θ)</ReferenceTrigger> 对固定数据评价 θ</h3><p>Page 2 已从 logits、Softmax 与真实标签概率算出它。Likelihood 是固定 D<sub>A</sub> 下关于 θ 的函数，不是参数空间上的归一化分布。</p></div>
        <div id="posterior-explanation"><span>03 · POSTERIOR</span><h3><ReferenceTrigger id="posterior">p(θ | D<sub>A</sub>)</ReferenceTrigger> 结合两种来源</h3><p>Likelihood 按旧数据支持度重加权 Prior，Evidence 统一归一化。Posterior 中心回答哪组配置权重最高，不等于告诉我们哪个单一坐标最重要。</p></div>
      </div>
      <details className="p03-full-bayes" id="bayes-evidence-normalizer-detail">
        <summary>连续参数空间：Evidence 是 Prior 加权 Likelihood 的积分</summary>
        <div className="p03-continuous-evidence"><MathFormula block tex={String.raw`p(D_A)=\int p(D_A\mid\theta)p(\theta)\,d\theta`} /><p>这里的 θ 是连续网络参数，p(θ) 表示概率密度；单个精确参数点的概率质量为 0，某个参数区域的概率由密度积分得到。上面的三候选交互则是离散教学例子，用求和而非积分。</p></div>
      </details>
    </section>
  );
}

function CandidateUpdate() {
  const [view, setView] = useState<DistributionView>("before");
  const [selectedId, setSelectedId] = useState(CANDIDATES[1].id);
  const selected = CANDIDATES.find((candidate) => candidate.id === selectedId) ?? CANDIDATES[1];
  const reference = CANDIDATES[0];
  const before = view === "before";
  const score = (candidate: Candidate) => before ? candidate.prior : candidate.posterior;
  const relativeLikelihood = selected.likelihood / reference.likelihood;
  const relativePrior = selected.prior / reference.prior;
  const relativePosterior = selected.posterior / reference.posterior;
  const oddsEquation = String.raw`\begin{aligned}\frac{p(\theta^{(${selected.index})}\mid D_A)}{p(\theta^{(1)}\mid D_A)}&=\frac{p(D_A\mid\theta^{(${selected.index})})}{p(D_A\mid\theta^{(1)})}\cdot\frac{p(\theta^{(${selected.index})})}{p(\theta^{(1)})}\\&\approx ${relativeLikelihood.toFixed(2)}\times ${relativePrior.toFixed(2)}\approx ${relativePosterior.toFixed(2)}\end{aligned}`;
  return (
    <section className="p03-section p03-candidates" id="parameter-belief-update" aria-labelledby="p03-candidates-title">
      <div className="p03-section-heading"><div><span className="p03-overline">THE SAME THREE CONFIGURATIONS · BEFORE AND AFTER D_A</span><h2 id="p03-candidates-title">Task A 数据怎样改变三组配置的权重？</h2></div><p>沿用 P2 的完整候选参数配置和同一份数据。看 Prior 如何经 Likelihood 重新加权为 Posterior。</p></div>
      <div className="p03-distribution-controls" role="group" aria-label="切换观察 Task A 数据前后的参数权重">
        <button type="button" aria-pressed={before} className={before ? "is-active" : ""} onClick={() => setView("before")}>观察数据前 · Prior</button>
        <button type="button" aria-pressed={!before} className={!before ? "is-active" : ""} onClick={() => setView("after")}>观察数据后 · Posterior</button>
      </div>
      <div className="p03-view-note" aria-live="polite"><b>{before ? "Prior · 数据到来前" : "Posterior · 数据到来后"}</b><span>{before ? "先验配置权重合计为 1。" : "旧数据 Likelihood 重加权并归一化，后验配置权重合计为 1。"} 所有条形共用 0–1 线性尺度。</span></div>
      <div className="p03-candidate-list" role="group" aria-label="选择一个完整参数配置查看它的更新">
        {CANDIDATES.map(candidate => {
          const value = score(candidate);
          const active = candidate.id === selected.id;
          return <button className={`p03-candidate-row ${active ? "is-selected" : ""}`} key={candidate.id} type="button" aria-pressed={active} aria-label={`完整参数配置 ${candidate.index}，${before ? "Prior" : "Posterior"} ${value.toFixed(4)}`} onClick={() => setSelectedId(candidate.id)}>
            <span className="p03-candidate-config"><MathFormula tex={String.raw`\theta^{(${candidate.index})}`} /><small>完整参数配置</small></span>
            <span className="p03-candidate-weight"><span className="p03-candidate-weight__label"><span>{before ? "Prior 权重" : "Posterior 权重"}</span><b>{value.toFixed(4)}</b></span><span className="p03-candidate-weight__track" aria-hidden="true"><i className={before ? "p03-candidate-weight__bar--prior" : "p03-candidate-weight__bar--posterior"} style={{width: `${value * 100}%`}} /></span></span>
          </button>;
        })}
      </div>
      <div className="p03-selected-explanation" aria-live="polite"><div><span>所选完整配置 {selected.index} · 更新来源</span><p>Prior <b>{selected.prior.toFixed(4)}</b> × Likelihood <b>{selected.likelihood.toFixed(6)}</b>，再除以 Evidence <b>{EXAMPLE_EVIDENCE.toFixed(6)}</b>，得到 Posterior <b>{selected.posterior.toFixed(4)}</b>。<b>权重描述完整配置，不等于单一坐标的重要性。</b></p></div>
        <details className="p03-ratio-detail"><summary>为什么配置间的相对权重会这样改变？</summary>{selected.id === reference.id ? <p>这是相对比较的基准配置。请选择配置 2 或 3 查看计算。</p> : <><p>以下按完整配置 {selected.index} 相对配置 1 的比值比较；共同 Evidence 在比值中抵消。</p><div className="p03-ratio-bars">{[["Prior 比值", relativePrior], ["Likelihood 比值", relativeLikelihood], ["Posterior 比值", relativePosterior]].map(([label,value]) => <div key={String(label)}><span>{label}</span><span className="p03-ratio-track"><i style={{width:`${Math.min(Number(value)/5*100,100)}%`}} /></span><b>{Number(value).toFixed(2)}</b></div>)}</div><MathFormula block tex={oddsEquation} /></>}</details>
      </div>
      <details className="p03-full-bayes p03-evidence-detail"><summary>核对三候选示例的 Evidence</summary><div className="p03-evidence-check"><div><span>离散候选 · Prior 加权求和</span><MathFormula block tex={String.raw`p(D_A)=\sum_k p(D_A\mid\theta^{(k)})p(\theta^{(k)})`} /></div><p><b>本例 p(D<sub>A</sub>) = {EXAMPLE_EVIDENCE.toFixed(6)}</b>，是三项候选共同的归一化分母。Prior (0.50, 0.35, 0.15) 是教学假设。</p></div></details>
      <p className="p03-teaching-boundary">前后柱高共用 0–1 尺度；Prior 与 Likelihood 数值复用 P2 数据链。这组 Prior 是离散教学假设，并非论文报告的网络参数后验。</p>
    </section>
  );
}

function SequentialUpdate() {
  const [step, setStep] = useState(0);
  const equations = [
    { expression: String.raw`p(\theta)`, note: "Task A 数据到来前的参数 Prior" },
    { expression: String.raw`p(\theta\mid D_A)\propto p(D_A\mid\theta)p(\theta)`, note: "Task A Posterior 汇总旧任务数据带来的更新" },
    { expression: String.raw`p(\theta\mid D_A,D_B)\propto p(D_B\mid\theta)p(\theta\mid D_A)`, note: "Task A Posterior 成为 Task B 更新中的先验贡献" },
  ];
  const current = equations[step];

  return (
    <section className="p03-section p03-sequential" id="sequential-update" aria-labelledby="p03-sequential-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">CONTINUAL LEARNING · SEQUENTIAL BAYES</span><h2 id="p03-sequential-title">Task A 学完后，旧 Posterior 怎样进入 Task B？</h2></div>
        <p>假设给定 θ 后，Task A 与 Task B 数据条件独立。于是联合数据 Likelihood 可分解为两项，Task A Posterior 就能作为 Task B 更新的先验贡献。</p>
      </div>
      <div className="p03-sequential-flow" aria-label="Task A posterior 延续到 Task B 的更新关系">
        <div><span>START</span><b>Prior</b><strong><MathFormula tex={String.raw`p(\theta)`} /></strong></div><i aria-hidden="true" />
        <div><span>AFTER TASK A</span><b>Task A Posterior</b><strong><ReferenceTrigger id="task_a_posterior"><MathFormula tex={String.raw`p(\theta\mid D_A)`} /></ReferenceTrigger></strong></div><i aria-hidden="true" />
        <div><span>AFTER TASK B</span><b>Updated Posterior</b><strong><ReferenceTrigger id="task_b_posterior"><MathFormula tex={String.raw`p(\theta\mid D_A,D_B)`} /></ReferenceTrigger></strong></div>
      </div>
      <FlowStepper
        label="Task A 到 Task B 的 Bayes 更新步骤"
        steps={BAYES_STEPS}
        step={step}
        onStepChange={(_selected, selectedIndex) => setStep(selectedIndex)}
        labels={{ step: "步骤", of: "/", previous: "上一步", next: "下一步" }}
      />
      <div className="p03-sequential-equation" aria-live="polite">
        <span>{current.note}</span>
        <MathFormula block tex={current.expression} />
      </div>
      <details className="p03-full-bayes p03-sequential-detail"><summary>查看任务条件独立假设</summary><div className="p03-sequential-boundary"><MathFormula block tex={String.raw`p(D_A,D_B\mid\theta)=p(D_A\mid\theta)p(D_B\mid\theta)`} /><p>给定 θ 后两批任务数据条件独立时，Task A Posterior 可作为 Task B 更新的先验来源。实际网络如何保存和近似它留给 P4–P6。</p></div></details>
    </section>
  );
}

export function PageBayes() {
  const api = useReferenceApi();

  return (
    <article className="ewc-page p03-page" aria-labelledby="p03-title">
      <header className="ewc-page-header p03-header">
        <div className="ewc-page-header__kicker"><span>03</span> BAYESIAN VIEW · PRIOR TO POSTERIOR</div>
        <h1 id="p03-title">参数的 Prior 与 Posterior</h1>
        <p className="ewc-page-header__dek">第 2 页已比较三组参数配置对同一份 Task A 数据 D<sub>A</sub> 的解释力。Likelihood 是固定数据下关于 θ 的函数，不是参数空间上的概率分布；本页用 Prior 与 Bayes 更新把旧数据支持度转为 Posterior。</p>
      </header>

      <section className="p03-entry" aria-labelledby="p03-entry-title">
        <div className="p03-section-heading">
          <div><span className="p03-overline">CONTINUE FROM PAGE 02</span><h2 id="p03-entry-title">旧数据不再参与训练，怎样留下它的影响？</h2></div>
        </div>
        <p className="p03-entry-question">P2 能算旧数据对不同参数配置的拟合程度，但 Task B 到来后，我们不希望每次都重新拿完整 Task A 数据计算旧 Loss。怎样让已观察的旧数据先改变对参数配置的支持程度，再把这份信息带进下一任务？</p>
        <p>Bayesian 更新把已有参数知识与当前数据证据结合，形成新的参数分布；Task B 可接着把它作为先验贡献继续更新。Posterior 描述完整配置的相对支持与局部形状，<strong>还没有直接给出逐参数的重要性。</strong> EWC 实际保存的是后面构造的近似摘要。</p>
        <details className="p03-background-detail"><summary>回顾 P2：类别概率、Likelihood 与参数分布的区别</summary><ProbabilityOriginTable /></details>
      </section>

      <ParameterPerspectives />
      <BayesBox />
      <CandidateUpdate />
      <SequentialUpdate />

      <section className="p03-handoff" aria-labelledby="p03-handoff-title">
        <div>
          <span className="p03-overline">NEXT · LOCAL POSTERIOR APPROXIMATION</span>
          <h2 id="p03-handoff-title">完整的 Task A Posterior 太复杂，难以直接带到 Task B</h2>
          <p>旧 Posterior 记录了不同参数配置的支持度；但在连续参数空间里，EWC 还需要知道旧解附近的支持度如何随偏移变化。下一页从 <ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger> 附近的负对数 Posterior 开始，用局部曲率描述这个变化。</p>
        </div>
        <button type="button" onClick={() => api.navigatePage("page-04-laplace")}>继续到 Page 4 · Laplace 局部近似 <span aria-hidden="true">→</span></button>
      </section>

      <nav className="p03-page-nav" aria-label="学习页面导航">
        <button type="button" onClick={() => api.navigatePage("page-02-probability")}>← Page 2 · Likelihood 与 Loss</button>
        <button type="button" onClick={() => api.navigatePage("page-04-laplace")}>Page 4 · Laplace →</button>
      </nav>
    </article>
  );
}
