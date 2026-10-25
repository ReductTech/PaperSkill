import { useState } from "react";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import "../styles/page7.css";
import { MathFormula } from "../shared/teaching/Math";

type Stage = {
  id: string;
  title: string;
  shortTitle: string;
  kind: "train" | "boundary";
  mode: "normal" | "consolidate" | "ewc";
  summary: string;
  steps: string[];
  params: string;
  optimizer: string;
  data: string;
  anchor: string;
  fisher: string;
};

const STAGES: Stage[] = [
  {
    id: "train-a", title: "训练 Task A", shortTitle: "Train A", kind: "train", mode: "normal",
    summary: "模型用 D_A 完成普通任务训练，参数逐步移动。",
    steps: ["读取 Task A batch", "计算 Task-A loss 与梯度", "optimizer.step() 更新 θ"],
    params: "更新中", optimizer: "执行", data: "D_A 正在使用", anchor: "尚未保存", fisher: "尚未估计",
  },
  {
    id: "boundary-a", title: "Task A 边界", shortTitle: "Boundary A", kind: "boundary", mode: "consolidate",
    summary: "Task A 结束后，先固定 θ_A*，再趁 D_A 仍可用时估计 F_A 并存下状态 S_A。",
    steps: ["复制并固定 θ_A*", "用 D_A 估计 F_A", "保存 S_A = {θ_A*, F_A}"],
    params: "固定在 θ_A*", optimizer: "停止更新", data: "D_A 仍需可用", anchor: "保存 θ_A*", fisher: "估计 F_A",
  },
  {
    id: "train-b", title: "训练 Task B", shortTitle: "Train B", kind: "train", mode: "ewc",
    summary: "同一个模型从 θ_A* 接着训练。当前 batch 来自 D_B；旧任务约束读取 S_A。",
    steps: ["从 θ_A* 继续当前模型", "计算 L_B + Ω_A", "合并梯度并更新 θ"],
    params: "继续更新", optimizer: "执行", data: "D_B 正在使用", anchor: "读取 θ_A*", fisher: "读取 F_A",
  },
  {
    id: "boundary-b", title: "Task B 边界", shortTitle: "Boundary B", kind: "boundary", mode: "consolidate",
    summary: "Task B 完成后先复制当前 θ_B* 并停止更新，再用仍可用的 D_B 在该位置估计 F_B。S_A 保持固定，新增 S_B。",
    steps: ["固定 θ_B*", "用 D_B 估计 F_B", "保留旧状态并存下 S_B"],
    params: "固定在 θ_B*", optimizer: "停止更新", data: "D_B 仍需可用", anchor: "保存 θ_B*", fisher: "估计 F_B",
  },
  {
    id: "train-c", title: "训练 Task C", shortTitle: "Train C", kind: "train", mode: "ewc",
    summary: "同一个模型从 θ_B* 开始训练 C。D_C 提供新 Loss；S_A 与 S_B 的 Anchor、Fisher 保持固定，只读取、不随当前 θ 更新。",
    steps: ["从 θ_B* 继续，读取 D_C batch", "计算 L_C + Ω_A + Ω_B", "optimizer.step() 只更新当前 θ"],
    params: "继续更新", optimizer: "执行", data: "D_C 正在使用", anchor: "读取 θ_A*、θ_B*", fisher: "读取 F_A、F_B",
  },
];

const MODES = [
  { id: "normal", label: "普通训练", target: 0, detail: "当前任务 Loss 产生梯度，优化器更新共享参数。" },
  { id: "consolidate", label: "Consolidation", target: 1, detail: "在当前 Task 数据仍可用时估计 Fisher；计算梯度，但不执行 optimizer.step()。" },
  { id: "ewc", label: "新 Task + EWC", target: 2, detail: "新任务数据驱动学习，旧任务的 Anchor 与 Fisher 提供参数约束。" },
] as const;

const PAGE7_ROWS = STAGES;

export function PageLifecycle() {
  const [activeIndex, setActiveIndex] = useState(0);
  const api = useReferenceApi();
  const active = STAGES[activeIndex];
  const currentMode = MODES.find((mode) => mode.id === active.mode)!;

  return (
    <article className="p07-page">
      <header className="p07-header ewc-page-header">
        <span className="p07-eyebrow">PAGE 07 · SEQUENTIAL TRAINING</span>
        <h1>EWC 的顺序训练生命周期</h1>
        <p className="ewc-page-header__dek">公式之后，追踪每个 Task、边界与参数状态如何衔接。</p>
      </header>

      <section className="p07-opening" aria-labelledby="p07-opening-title">
        <div>
          <span className="p07-overline">ONE MODEL · A SEQUENCE OF TASKS</span>
          <h2 id="p07-opening-title">边界处保存长期约束，下一任务继续使用同一个模型</h2>
        </div>
        <p>训练 Task A 得到当前解。Task A 结束后保存固定 Anchor，并在数据仍可用时估计 Fisher。Task B 从这个参数位置继续学习，每次更新都读取旧任务约束。</p>
      </section>

      <section className="p07-lifecycle" id="task-boundary" aria-labelledby="p07-lifecycle-title">
        <div className="p07-section-heading">
          <div><span className="p07-overline">TRAIN · CONSOLIDATE · CONTINUE</span><h2 id="p07-lifecycle-title">沿时间轴选择一个阶段</h2></div>
          <span className="p07-sequence-tag">A → B → C · 同一个模型</span>
        </div>

        <div className="p07-modes" role="group" aria-label="三种运行模式">
          <span className="p07-modes__label">运行模式</span>
          {MODES.map((mode) => (
            <button key={mode.id} type="button" className={currentMode.id === mode.id ? "is-active" : ""} aria-pressed={currentMode.id === mode.id} onClick={() => setActiveIndex(mode.target)}>
              {mode.label}
            </button>
          ))}
        </div>

        <ol className="p07-timeline" aria-label="Task A 到 Task C 的生命周期">
          {STAGES.map((stage, index) => (
            <li key={stage.id} className={`p07-timeline__item p07-timeline__item--${stage.kind} ${activeIndex === index ? "is-active" : ""}`}>
              <button type="button" aria-pressed={activeIndex === index} aria-label={`${index + 1}. ${stage.title}`} onClick={() => setActiveIndex(index)}>
                <span className="p07-timeline__index">{String(index + 1).padStart(2, "0")}</span>
                <b>{stage.shortTitle}</b>
                <small>{stage.kind === "boundary" ? "冻结参数 · 估计 Fisher" : stage.id === "train-a" ? "普通任务训练" : "当前任务 loss + 旧约束"}</small>
              </button>
            </li>
          ))}
        </ol>

        <div className="p07-active-stage" aria-live="polite">
          <div className="p07-active-stage__copy">
            <span className="p07-overline">{currentMode.label}</span>
            <h3>{active.title}</h3>
            <p>{active.summary}</p>
            <ol>{active.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
          <div className="p07-switches" aria-label="当前阶段的运行状态">
            <div><span>Gradient</span><b>计算</b></div>
            <div><span>optimizer.step()</span><b>{active.mode === "consolidate" ? "不执行" : "执行"}</b></div>
            <div><span>参数 θ</span><b>{active.mode === "consolidate" ? "保持固定" : "继续更新"}</b></div>
            <div><span>旧任务状态</span><b>{active.mode === "ewc" ? "读取 Anchor 与 Fisher" : active.mode === "consolidate" ? "保存新状态" : "尚未建立"}</b></div>
          </div>
        </div>
      </section>

      <section className="p07-state-section" id="active-state-table" aria-labelledby="p07-state-title">
        <div className="p07-section-heading p07-section-heading--compact">
          <div><span className="p07-overline">THE STATE AT EACH STEP</span><h2 id="p07-state-title">训练、估计与数据状态</h2></div>
          <p>选中时间轴阶段后，表格同步标出当时的状态。</p>
        </div>
        <div className="p07-table-wrap">
          <table className="p07-state-table">
            <thead><tr><th scope="col">阶段</th><th scope="col">当前参数 θ</th><th scope="col">optimizer.step()</th><th scope="col">当前 Task 数据</th><th scope="col">Anchor</th><th scope="col">Fisher</th></tr></thead>
            <tbody>{PAGE7_ROWS.map((row, index) => (
              <tr key={row.id} className={`${row.kind === "boundary" ? "p07-state-table__boundary" : ""} ${activeIndex === index ? "is-active" : ""}`} aria-current={activeIndex === index ? "step" : undefined}>
                <th scope="row" data-label="阶段">{row.title}</th>
                <td data-label="当前参数 θ">{row.params}</td>
                <td data-label="optimizer.step()">{row.optimizer}</td>
                <td data-label="当前 Task 数据">{row.data}</td>
                <td data-label="Anchor">{row.anchor}</td>
                <td data-label="Fisher">{row.fisher}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="p07-clarifiers" aria-label="生命周期中的关键区分">
        <article>
          <span className="p07-overline">ANCHOR · FIXED REFERENCE</span>
          <h3><ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger> 与当前参数分开保存</h3>
          <p>Anchor 保持在 Task A 结束的位置。当前 θ 仍然可训练；二者之间的距离才表示后续学习偏移了多少。</p>
        </article>
        <article>
          <span className="p07-overline">FISHER · AT THE TASK BOUNDARY</span>
          <h3>先完成 <ReferenceTrigger id="task_boundary">Task Boundary</ReferenceTrigger>，再离开 D<sub>A</sub></h3>
          <p>Fisher 估计读取 Task A 的数据和已训练参数。估计时参数保持固定，不运行 optimizer.step()。</p>
        </article>
        <article>
          <span className="p07-overline">NEXT TASK · READ STORED STATE</span>
          <h3>EWC 约束不依赖把旧样本混入当前 batch</h3>
          <p>EWC penalty 本身不要求把 Task A 样本混入当前 Task-B batch；旧任务约束由保存的 Anchor 与 Fisher 提供。论文的 Atari 系统另有 Replay 机制，见 Page 9。Task C 的多任务约束形式见下方展开项。</p>
        </article>
      </section>

      <aside className="p07-cycle-note" aria-label="Task C 状态累积">
        <span className="p07-overline">AFTER TASK B</span>
        <div className="p07-cycle-note__content">
          <p>保存 θ<sub>B</sub>* 并估计 F<sub>B</sub> 后，C 从 θ<sub>B</sub>* 开始，并读取固定的 S<sub>A</sub>、S<sub>B</sub>。边界估计时必须仍能读取刚结束任务的数据；进入新任务后，惩罚只读取已保存状态。</p>
          <details className="p07-cycle-detail">
            <summary>查看 Task C 如何同时读取两项历史惩罚</summary>
            <div><MathFormula block tex={String.raw`\textstyle L_C(\theta)+\frac{\lambda_A}{2}\sum_iF_{A,i}(\theta_i-\theta_{A,i}^*)^2+\frac{\lambda_B}{2}\sum_iF_{B,i}(\theta_i-\theta_{B,i}^*)^2`} /><p>这是双惩罚实现映射（C07 / M01），不是论文规定的 checkpoint 格式；λ<sub>A</sub>、λ<sub>B</sub> 分别权衡，S<sub>A</sub>、S<sub>B</sub> 是教学记号。</p></div>
          </details>
        </div>
        <button type="button" onClick={() => api.openHub("task_boundary")}>在 Reference Hub 查看 Task Boundary</button>
      </aside>

      <footer className="p07-handoff">
        <div><span className="p07-overline">NEXT · CONTROLLED EVIDENCE</span><h2>生命周期已经闭合。现在看这个约束在顺序分类中是否缓解了干扰。</h2><p>Page 8 从 MNIST 数据、任务构造与训练协议开始，再逐层阅读论文结果。</p></div>
        <button type="button" onClick={() => api.navigatePage("page-08-mnist")}>前往 Page 8 · Permuted MNIST</button>
      </footer>
    </article>
  );
}
