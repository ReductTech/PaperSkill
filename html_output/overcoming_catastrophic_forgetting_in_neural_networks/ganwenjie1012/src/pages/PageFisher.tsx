import { useState } from "react";
import type { ReactNode } from "react";
import { FlowStepper, type FlowStep } from "../shared/core/flow-stepper";
import { EWCNetworkDiagram } from "../shared/teaching/EWCNetworkDiagram";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import type { CanonicalReferenceId, RuntimeObjectId } from "../contracts/ids";
import { MathFormula } from "../shared/teaching/Math";

const FISHER_STEPS: FlowStep[] = [
  { id: "anchor", title: "固定 Task A 参数", description: "Task A 普通训练已结束；本轮计算以 θ_A* 为中心，参数不再更新。", statusText: "Parameters FIXED · Gradient ENABLED · Optimizer OFF" },
  { id: "sample", title: "取一个 Task A 样本", description: "取一条旧任务样本 (xₙ, yₙ)，继续使用已见过的同一个网络。", statusText: "当前只看一个样本，随后再扩展到整批数据。" },
  { id: "probability", title: "得到预测概率", description: "前向计算产生 pθ(yₙ | xₙ)；模型输出没有换成新的 Fisher 网络。", statusText: "同一个模型 · θ = θ_A*" },
  { id: "log-probability", title: "看真实标签的 Log Probability", description: "固定 (xₙ, yₙ)，观察 log probability 对参数变化有多敏感。", statusText: "这是已有概率对象的对数，不是新模型输出。" },
  { id: "score-gradient", title: "对参数求 Score Gradient", description: "对 θᵢ 求导，读出该样本的 log probability 随参数小幅变化的局部变化率。", statusText: "求梯度，但暂不执行参数更新。" },
  { id: "square", title: "平方，保留敏感程度大小", description: "平方去掉正负方向，避免不同样本的正负梯度在汇总时抵消。", statusText: "+0.8 与 −0.8 都贡献 0.64。" },
  { id: "aggregate", title: "跨样本累计并平均", description: "对多个 Task A 样本重复前向、求梯度、平方，再按参数坐标汇总，得到所选的对角估计示例。", statusText: "输出 F_A；示例估计配方与论文事实分开标注。" },
];

function RuntimeReference({ id, objectId, children }: { id: CanonicalReferenceId; objectId: RuntimeObjectId; children: ReactNode }) {
  const api = useReferenceApi();
  return <ReferenceTrigger id={id} onActivate={() => api.setActiveRuntimeObject(objectId)}>{children}</ReferenceTrigger>;
}

function FisherStepEquation({ step }: { step: number }) {
  const equations = [
    String.raw`\textstyle \theta=\theta_A^*`,
    String.raw`\textstyle (x_n,y_n)\in D_A`,
    String.raw`\textstyle p_\theta(y_n\mid x_n)`,
    String.raw`\textstyle \log p_\theta(y_n\mid x_n)`,
    String.raw`\textstyle g_{n,i}=\frac{\partial}{\partial\theta_i}\log p_\theta(y_n\mid x_n)`,
    String.raw`\textstyle g_{n,i}^2=\left[\frac{\partial}{\partial\theta_i}\log p_\theta(y_n\mid x_n)\right]^2`,
    String.raw`\textstyle \widehat F^{\mathrm{emp}}_{A,i}=\left.\frac1N\sum_{n=1}^N g_{n,i}^2\right|_{\theta=\theta_A^*}`,
  ];
  return <MathFormula block tex={equations[step]} />;
}

function SamplePath() {
  return (
    <div className="p05-sample-path" aria-label="Task A 样本经过同一个网络，得到真实标签的预测概率">
      <div className="p05-sample-path__input"><span>ONE TASK-A SAMPLE</span><b>(x<sub>n</sub>, y<sub>n</sub>)</b><small>输入与已知标签</small></div>
      <i aria-hidden="true" />
      <div className="p05-sample-path__network"><span>FIXED MODEL · θ = θ<sub>A</sub>*</span><EWCNetworkDiagram compact idPrefix="page5-fisher-network" /><b>同一个共享网络</b></div>
      <i aria-hidden="true" />
      <div className="p05-sample-path__output"><span>ALREADY INTRODUCED ON PAGE 2</span><b><RuntimeReference id="p_theta_y_given_x" objectId="prediction-probabilities">p<sub>θ</sub>(y<sub>n</sub> | x<sub>n</sub>)</RuntimeReference></b><small>真实标签 y<sub>n</sub> 的预测概率</small></div>
    </div>
  );
}

function FisherWorkbench() {
  const [step, setStep] = useState(0);
  return (
    <section className="p05-section p05-workbench" id="fisher-estimation" aria-labelledby="p05-workbench-title">
      <div className="p05-section-heading">
        <div><span className="p05-overline">ONE SAMPLE → MANY SAMPLES</span><h2 id="p05-workbench-title">从 Log Probability 的局部梯度，得到 Fisher 估计</h2></div>
        <p>选择步骤，逐项追踪它从哪里来；不需要重讲导数。</p>
      </div>
      <SamplePath />
      <div className="p05-runtime-status" aria-label="Fisher estimation 运行状态">
        <strong>Mode · Fisher Estimation</strong><span><i className="is-fixed" />Parameters · FIXED</span><span><i className="is-enabled" />Gradient · ENABLED</span><span><i className="is-off" />Optimizer · OFF</span>
      </div>
      <FlowStepper
        label="Fisher 估计的计算步骤"
        steps={FISHER_STEPS}
        step={step}
        onStepChange={(_selected, index) => setStep(index)}
        labels={{ step: "步骤", of: "/", previous: "上一步", next: "下一步" }}
      />
      <div className="p05-step-equation" id="score-gradient" aria-live="polite">
        <span>{FISHER_STEPS[step].title}</span>
        <strong role="math" aria-label={`Fisher 逐步推导，第 ${step + 1} 步`}><FisherStepEquation step={step} /></strong>
      </div>
      <div className="p05-square-examples" id="square-and-aggregate">
        <div><span>+0.8</span><b>→ 0.64</b><small>平方后保留大小</small></div>
        <div><span>−0.8</span><b>→ 0.64</b><small>正负不会相互抵消</small></div>
        <div><span>+0.1</span><b>→ 0.01</b><small>小敏感度贡献较小</small></div>
      </div>
      <div className="p05-sample-accumulator" aria-label="多个 Task A 样本各自计算梯度平方，再按参数坐标汇总平均">
        <div><span>样本 1</span><b>score²</b></div><i aria-hidden="true">+</i><div><span>样本 2</span><b>score²</b></div><i aria-hidden="true">+</i><div><span>…</span><b>score²</b></div><i aria-hidden="true">→</i><div className="p05-sample-accumulator__result"><span>按坐标汇总 / 平均</span><b><ReferenceTrigger id="fisher_a">F<sub>A</sub></ReferenceTrigger></b></div>
      </div>
      <p className="p05-small-note">上面的 +0.8 / −0.8 / +0.1 只是说明平方的示例值，不是论文数据。</p>
    </section>
  );
}

function TrainingModeComparison() {
  return (
    <section className="p05-section p05-modes" id="training-vs-estimation" aria-labelledby="p05-modes-title">
      <div className="p05-section-heading">
        <div><span className="p05-overline">GRADIENT ENABLED · UPDATE DISABLED</span><h2 id="p05-modes-title">Fisher Estimation 要算梯度，但不继续训练</h2></div>
        <p>同一个 Task A 解，计算目的不同，运行状态也不同。</p>
      </div>
      <div className="p05-mode-grid">
        <article className="p05-mode-card p05-mode-card--train">
          <span className="p05-mode-label">NORMAL TRAINING</span><h3>普通训练 Task A</h3>
          <ol><li>前向计算 <b>p<sub>θ</sub>(y | x)</b></li><li>计算 <b>Loss</b></li><li>Backward 得到 Gradient</li><li className="is-active">执行 <code>optimizer.step()</code></li></ol>
          <div className="p05-mode-outcome"><b>θ changes</b><span>参数沿普通训练目标继续更新</span></div>
        </article>
        <div className="p05-mode-divider" aria-hidden="true"><span>目的不同</span><i /></div>
        <article className="p05-mode-card p05-mode-card--estimate">
          <span className="p05-mode-label">FISHER ESTIMATION</span><h3>固定在 θ<sub>A</sub>* 估计局部敏感度</h3>
          <ol><li>前向得到 <b>p<sub>θ</sub>(y | x)</b></li><li>计算 Log Probability</li><li>Backward 得到 Gradient</li><li>梯度平方并累计</li></ol>
          <div className="p05-mode-status"><span>Gradient <b>ENABLED</b></span><span>Optimizer <b>OFF</b></span></div>
          <div className="p05-mode-outcome"><b>θ stays fixed</b><span>得到 F<sub>A</sub>；不执行参数更新</span></div>
        </article>
      </div>
    </section>
  );
}

const PARAMETER_GROUPS = [
  { layer: "Layer 1 · 视觉分组", parameters: [{ theta: "θ₁", fisherIndex: 1 }, { theta: "θ₂", fisherIndex: 2 }, { theta: "θ₃", fisherIndex: 3 }] },
  { layer: "Layer 2 · 视觉分组", parameters: [{ theta: "θ₄", fisherIndex: 4 }, { theta: "θ₅", fisherIndex: 5 }, { theta: "θ₆", fisherIndex: 6 }] },
  { layer: "Layer 3 · 视觉分组", parameters: [{ theta: "θ₇", fisherIndex: 7 }, { theta: "θ₈", fisherIndex: 8 }, { theta: "θ₉", fisherIndex: 9 }] },
];

function ParameterFisherMap() {
  return (
    <div className="p05-parameter-map" role="img" aria-label="每一个参数坐标都对应一个 Fisher 对角值；Layer 仅作视觉分组">
      {PARAMETER_GROUPS.map((group) => <div className="p05-parameter-map__layer" key={group.layer}><span>{group.layer}</span><div>{group.parameters.map(({ theta, fisherIndex }) => <div className="p05-parameter-map__pair" key={theta}><b>{theta}</b><i aria-hidden="true">↔</i><strong>F<sub>A,{fisherIndex}</sub></strong></div>)}</div></div>)}
    </div>
  );
}

function FisherRole() {
  const baseline = [0.60, 0.30, 0.10];
  const highFisher = [0.45, 0.40, 0.15];
  const lowFisher = [0.57, 0.31, 0.12];
  const renderDistribution = (label: string, probabilities: number[]) => <div className="p05-prediction-row" key={label}>
    <b>{label}</b>{probabilities.map((probability, index) => <span className="p05-prediction-cell" key={`${label}-${index}`}><small>{["A", "B", "C"][index]}</small><i aria-hidden="true"><em style={{ width: `${probability * 100}%` }} /></i><strong>{probability.toFixed(2)}</strong></span>)}
  </div>;
  return (
    <section className="p05-section p05-role" id="fisher-role" aria-labelledby="p05-role-title">
      <div className="p05-section-heading">
        <div><span className="p05-overline">PARAMETER-WISE LOCAL SENSITIVITY</span><h2 id="p05-role-title">每个参数坐标都有对应的 Fisher 权重</h2></div>
        <p>图中按网络层分组只是为了阅读；数学上的对角 Fisher 仍然逐个参数对应。</p>
      </div>
      <ParameterFisherMap />
      <div className="p05-sensitivity-compare">
        <article className="p05-sensitivity-card p05-sensitivity-card--high"><span>SAME INPUT · SAME SMALL PERTURBATION</span><h3><ReferenceTrigger id="fisher_a_i">F<sub>A,i</sub></ReferenceTrigger> 较大</h3><div className="p05-prediction-matrix" role="img" aria-label="同一输入下，参数发生相同小幅移动前的概率为 A 0.60、B 0.30、C 0.10；高 Fisher 参数移动后为 A 0.45、B 0.40、C 0.15，变化较大">{renderDistribution("Before", baseline)}{renderDistribution("After Δθ", highFisher)}</div><p>预测分布变化更大，表示 Task A 对该局部方向更敏感。</p></article>
        <article className="p05-sensitivity-card p05-sensitivity-card--low"><span>SAME INPUT · SAME SMALL PERTURBATION</span><h3><ReferenceTrigger id="fisher_a_i">F<sub>A,j</sub></ReferenceTrigger> 较小</h3><div className="p05-prediction-matrix" role="img" aria-label="同一输入下，参数发生相同小幅移动前的概率为 A 0.60、B 0.30、C 0.10；低 Fisher 参数移动后为 A 0.57、B 0.31、C 0.12，变化较小">{renderDistribution("Before", baseline)}{renderDistribution("After Δθ", lowFisher)}</div><p>相同幅度的移动，对旧任务预测的影响较小。</p></article>
      </div>
      <p className="p05-teaching-note">概率条共用 0–1 尺度且各行合计为 1；数值是教学示意，不是模型测量结果或论文实验数据。</p>

      <div className="p05-laplace-bridge">
        <div className="p05-laplace-bridge__source"><span>FROM PAGE 4 · LAPLACE</span><b>局部宽度 / 精度</b></div><i aria-hidden="true">→</i><span>需要一个可计算的近似</span><i aria-hidden="true">→</i><b><ReferenceTrigger id="fisher_information">Fisher Information</ReferenceTrigger></b><small>参数级局部敏感性近似；不等于精确 Hessian。</small>
      </div>


      <div className="p05-result-objects">
        <div><span>TASK A · FIXED REFERENCE</span><b><ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger></b><p>Task A 普通训练最终停下来的参数位置。</p></div>
        <i aria-hidden="true">+</i>
        <div><span>LOCAL SENSITIVITY · DIAGONAL APPROXIMATION</span><b><ReferenceTrigger id="fisher_a">F<sub>A</sub></ReferenceTrigger></b><p>在该位置附近，各参数对 Task A 的相对敏感程度近似。</p></div>
      </div>
    </section>
  );
}

export function PageFisher() {
  const api = useReferenceApi();
  return (
    <article className="ewc-page p05-page" aria-labelledby="p05-title">
      <header className="ewc-page-header p05-header">
        <div className="ewc-page-header__kicker"><span>05</span> FROM SCORE GRADIENT TO FISHER</div>
        <h1 id="p05-title">怎样估计 Task A 附近的参数敏感性？</h1>
        <p className="ewc-page-header__dek">Page 4 给出了局部 Gaussian 的宽 / 窄方向。现在回到真实网络：从它对旧任务样本的概率输出出发，逐步得到一个可计算的局部敏感性近似。</p>
      </header>

      <section className="p05-opening" aria-labelledby="p05-opening-title">
        <div><span className="p05-overline">WHAT IS STILL MISSING?</span><h2 id="p05-opening-title">局部约束需要一个能从模型计算的量</h2><p>P4 的完整曲率矩阵需要 P² 个量。我们需要更便宜的近似，但先要解释它为何与偏移代价有关：从预测概率对参数的局部响应开始，再决定保留哪些项。</p></div>
        <div className="p05-opening__handoff"><b><ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger></b><i aria-hidden="true">→</i><span>固定参数<br />读取旧样本</span><i aria-hidden="true">→</i><b><ReferenceTrigger id="fisher_information">F<sub>A</sub></ReferenceTrigger></b></div>
      </section>

      <section className="p05-section p05-curvature-bridge" aria-labelledby="p05-definition-title">
        <div className="p05-section-heading">
          <div><span className="p05-overline">FROM FULL CURVATURE TO A COMPUTABLE SIGNAL</span><h2 id="p05-definition-title">为什么用 Fisher 近似，而不保存完整 Hessian？</h2></div>
          <p>旧解附近的曲率有用，但完整高维矩阵很难存取；EWC 保留一个可计算的参数级近似。</p>
        </div>
        <div className="p05-curvature-cost" aria-label="完整 Hessian 和对角 Fisher 存储规模比较">
          <div><span>FULL HESSIAN</span><b>P × P entries</b><small>保留参数间的交叉曲率，存储为 O(P²)。</small></div>
          <i aria-hidden="true">→</i>
          <div><span>DIAGONAL FISHER</span><b>P entries</b><small>只保存逐坐标平方的期望，存储为 O(P)；省略交叉项，也失去参数间的耦合信息。</small></div>
        </div>
        <details className="p05-theory-detail">
          <summary>展开数学背景：Fisher 为何能提示局部预测变化？</summary>
          <div className="p05-fisher-mechanism">
            <div><span>THEORETICAL FISHER · SCORE SECOND MOMENT</span><MathFormula block tex={String.raw`\textstyle g=\nabla_\theta\log p_\theta(y\mid x),\quad F(\theta)=\mathbb{E}_{x\sim\mu_A,\,y\sim p_\theta(\cdot\mid x)}[gg^\mathsf{T}]`} /><p>理论 Fisher 对固定的 Task A 输入分布 μ<sub>A</sub> 与模型标签分布取期望；对角项为 <MathFormula tex={String.raw`F_{ii}=\mathbb E[g_i^2]`} />。在适当正则条件下，它等于模型期望下负 log-likelihood 的 Hessian；Posterior Hessian 还可能包含 Prior 曲率。</p></div>
            <div><span>LOCAL CHANGE · SECOND-ORDER APPROXIMATION</span><MathFormula block tex={String.raw`\textstyle\mathbb{E}_{x\sim\mu_A}D_{\mathrm{KL}}(p_\theta(\cdot\mid x)\parallel p_{\theta+\Delta\theta}(\cdot\mid x))\approx\tfrac12\Delta\theta^\mathsf{T}F\Delta\theta`} /><p>在可微、可交换求导与积分、分布支撑不随参数变化等条件下，零偏移的一阶项消失，二阶项近似局部预测分布的变化。有限偏移、模型失配和对角化都会限制这一关系。</p></div>
            <p className="p05-curvature-boundary">本页工作台采用 observed-label empirical-Fisher 教学配方：对观测标签的逐样本 score 求平方并平均。理论 Fisher 则对模型标签分布取期望；两者不无条件等价，且论文未规定本页这套配方为唯一估计器。</p>
          </div>
        </details>
        <p className="p05-estimator-lead">工作台固定 θ<sub>A</sub>*，对 Task A 观测标签的 log probability 求逐样本梯度、平方并平均，得到一个可执行的敏感性近似；参数保持不变。</p>
      </section>
      <FisherWorkbench />
      <TrainingModeComparison />
      <FisherRole />

      <section className="p05-handoff" aria-labelledby="p05-handoff-title">
        <div><span className="p05-overline">NEXT · PUT BOTH OBJECTS INTO TASK B</span><h2 id="p05-handoff-title">旧任务留下位置与敏感性信息</h2><p><ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger> 说明 Task A 学到哪里；<ReferenceTrigger id="fisher_a">F<sub>A</sub></ReferenceTrigger> 近似说明各参数在局部有多敏感。下一页把它们和 Task B 的新任务 Loss 组合起来。</p></div>
        <button type="button" onClick={() => api.navigatePage("page-06-ewc-objective")}>继续到 Page 6 · EWC Objective <span aria-hidden="true">→</span></button>
      </section>
      <nav className="p05-page-nav" aria-label="学习页面导航"><button type="button" onClick={() => api.navigatePage("page-04-laplace")}>← Page 4 · Laplace</button><button type="button" onClick={() => api.navigatePage("page-06-ewc-objective")}>Page 6 · Objective →</button></nav>
    </article>
  );
}
