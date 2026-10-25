import { useState } from "react";
import { PaperFigure } from "../shared/core/paper-figure/PaperFigure";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import "../styles/page9.css";

const COMPONENTS = [
  {
    id: "dqn", label: "DQN-like Network", sublabel: "action-value model",
    title: "网络估计当前状态下各动作的价值",
    description: "网络输入游戏 observation，输出一组 Q 值；agent 根据这些值选择 action。奖励和下一帧 observation 又进入后续交互。",
    source: "通用 DQN 背景",
  },
  {
    id: "replay", label: "Replay", sublabel: "per-game transitions",
    title: "Replay 支持当前游戏内的强化学习训练",
    description: "Atari 系统为各任务保存 transition，并从对应 Replay buffer 抽取经验。重复使用历史经验、打散连续交互的强相关性，支持当前游戏的 Q 学习；EWC penalty 提供跨任务的参数偏移代价，两者互补。",
    source: "论文 Atari 系统 · C08",
  },
  {
    id: "recognition", label: "Task Recognition", sublabel: "game context",
    title: "单独判断当前处于哪个游戏任务",
    description: "游戏画面不直接附带监督任务标签，系统以额外的 task-recognition 模块推断上下文，用于选择相应 Replay 与 task-specific 调制。EWC 依赖系统提供的切换信号，不能独自发现 Task Boundary。",
    source: "论文 Atari 系统 · C08",
  },
  {
    id: "modulation", label: "Task-specific gain / bias", sublabel: "per-task modulation",
    title: "不同游戏还使用 task-specific 参数调制",
    description: "Atari 实验为不同任务使用 layer-specific gains 与 biases。它们属于完整系统的其他机制，不是 EWC penalty。",
    source: "论文 Atari 系统 · C08",
  },
  {
    id: "ewc", label: "EWC", sublabel: "across-task constraint",
    title: "EWC 在边界处建立跨任务参数约束",
    description: "任务切换时，系统保存当前解并估计 Fisher；训练后续游戏时，旧任务状态进入新的参数约束。",
    source: "论文机制与 Atari 配置 · C02, C09",
  },
] as const;

const RL_STEPS = [
  { id: "observation", label: "游戏 Observation", symbol: "sₜ", detail: "环境给 agent 一帧游戏画面或由近期观测组成的 state。" },
  { id: "values", label: "DQN-like Network", symbol: "Qθ(sₜ, a)", detail: "网络估计当前 state 下不同 action 的价值。" },
  { id: "action", label: "选择 Action", symbol: "aₜ", detail: "Agent 根据 action-value 选择一个动作，并作用于环境。" },
  { id: "feedback", label: "环境反馈", symbol: "rₜ, sₜ₊₁", detail: "环境返回 reward 和下一 observation，交互循环继续。" },
] as const;

export function PageAtari() {
  const [componentIndex, setComponentIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [timeScale, setTimeScale] = useState<"within" | "boundary">("within");
  const api = useReferenceApi();
  const component = COMPONENTS[componentIndex];
  const step = RL_STEPS[stepIndex];

  return (
    <article className="p09-page">
      <header className="p09-header ewc-page-header">
        <span className="p09-eyebrow">PAGE 09 · CONTINUAL REINFORCEMENT LEARNING</span>
        <h1>Atari：EWC 在强化学习系统中的位置与边界</h1>
        <p className="ewc-page-header__dek">先看 agent 怎样与环境交互，再区分系统机制、实验结果和近似局限。</p>
      </header>

      <section className="p09-intro" aria-labelledby="p09-intro-title">
        <div><span className="p09-overline">A DIFFERENT TRAINING SETTING</span><h2 id="p09-intro-title">Atari 改变的是训练过程</h2></div>
        <p><ReferenceTrigger id="atari">Atari</ReferenceTrigger> 和 P8 的固定监督分类不同：没有直接提供正确动作标签，训练信号来自 agent 与环境交互。Agent 的动作会改变环境，也会改变之后收集到的经验。</p>
      </section>

      <section className="p09-comparison" aria-label="Permuted MNIST 与 Atari 的训练环境对比">
        <div className="p09-comparison__side">
          <span className="p09-overline">PAGE 8 · PERMUTED MNIST</span>
          <h2>固定监督数据</h2>
          <ul><li>图像与类别标签已给定</li><li>输入任务边界清楚</li><li>模型按顺序读取数据集</li></ul>
        </div>
        <div className="p09-comparison__divider" aria-hidden="true"><i /></div>
        <div className="p09-comparison__side p09-comparison__side--atari">
          <span className="p09-overline">PAGE 9 · ATARI</span>
          <h2>由行为产生经验</h2>
          <ul><li>Agent 自己选择动作</li><li>环境状态随动作变化</li><li>后续经验依赖交互历史</li></ul>
        </div>
        <p className="p09-comparison__caption">这改变了训练信号的来源：分类标签来自数据集，强化学习反馈来自环境。</p>
      </section>


      <section className="p09-rl-section" id="atari-rl-loop" aria-labelledby="p09-rl-title">
        <div className="p09-section-heading">
          <div><span className="p09-overline">ENVIRONMENT ↔ AGENT</span><h2 id="p09-rl-title">一个最小的 Atari 强化学习循环</h2></div>
          <p>这里只追踪 Observation、Action、Reward 与下一状态。</p>
        </div>
        <ol className="p09-rl-loop" aria-label="选择一步查看 Atari 强化学习循环">
          {RL_STEPS.map((item, index) => <li key={item.id} className={stepIndex === index ? "is-active" : ""}>
            <button type="button" aria-pressed={stepIndex === index} onClick={() => setStepIndex(index)}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{item.label}</b><strong>{item.symbol}</strong>
            </button>
          </li>)}
        </ol>
        <div className="p09-rl-step-detail" aria-live="polite"><b>{step.label}</b><p>{step.detail}</p><span>sₜ → Q<sub>θ</sub>(sₜ, a) → aₜ → rₜ, sₜ₊₁</span></div>
        <p className="p09-rl-return">交互产生 (sₜ, aₜ, rₜ, sₜ₊₁) transition。没有直接给出“正确动作”标签；通用 DQN 用即时 Reward 加折扣后的下一状态价值构造训练目标，让当前 Q 预测靠近这个目标。改变参数会改变动作选择，进而改变以后访问的状态与训练经验；这与 P2 的固定标签分类数据不同。</p>
      </section>

      <section className="p09-responsibilities" id="system-responsibilities" aria-labelledby="p09-system-title">
        <div className="p09-section-heading">
          <div><span className="p09-overline">SYSTEM RESPONSIBILITY MAP</span><h2 id="p09-system-title">Atari 表现来自多个协作部件</h2></div>
          <p>选择部件查看职责。只有跨 Task 的参数约束属于 EWC。</p>
        </div>
        <div className="p09-control-loop" aria-label="Atari 的观察、网络、动作与环境反馈">
          <div><span>ENVIRONMENT</span><b>游戏画面</b></div><i aria-hidden="true" />
          <div><span>OBSERVATION</span><b>s<sub>t</sub></b></div><i aria-hidden="true" />
          <button type="button" className={component.id === "dqn" ? "is-active" : ""} onClick={() => setComponentIndex(0)}><span>SHARED TASK MODEL</span><b>DQN-like Network</b><small>Q<sub>θ</sub>(s<sub>t</sub>, a)</small></button><i aria-hidden="true" />
          <div><span>ACTION</span><b>a<sub>t</sub></b></div>
        </div>
        <div className="p09-loop-feedback"><span>ENVIRONMENT RETURNS</span><b>reward r<sub>t</sub> + next observation s<sub>t+1</sub></b></div>

        <div className="p09-component-map">
          <span className="p09-component-map__label">TRAINING SYSTEM · SELECT A RESPONSIBILITY</span>
          <div className="p09-component-map__items" role="group" aria-label="Atari 训练系统部件">
            {COMPONENTS.slice(1).map((item, index) => <button key={item.id} type="button" className={`${component.id === item.id ? "is-active" : ""} p09-component-map__item--${item.id}`} aria-pressed={component.id === item.id} onClick={() => setComponentIndex(index + 1)}>
              <span>{item.sublabel}</span><b>{item.label}</b>
            </button>)}
          </div>
          <div className={`p09-component-detail p09-component-detail--${component.id}`} aria-live="polite">
            <div><span className="p09-overline">{component.source}</span><h3>{component.title}</h3></div>
            <p>{component.description}</p>
          </div>
          <p className="p09-system-boundary">以上交互选择会更新职责说明。Replay 在任务内部复用经验；EWC 在任务之间约束参数偏移。</p>
        </div>
      </section>

      <section className="p09-timescale" id="replay-timescale" aria-labelledby="p09-timescale-title">
        <div className="p09-section-heading">
          <div><span className="p09-overline">TWO TIME SCALES</span><h2 id="p09-timescale-title">Replay 与 EWC 工作在不同时间尺度</h2></div>
        </div>
        <div className="p09-timescale-tabs" role="group" aria-label="选择时间尺度">
          <button type="button" aria-pressed={timeScale === "within"} className={timeScale === "within" ? "is-active" : ""} onClick={() => setTimeScale("within")}>一个游戏任务内部</button>
          <button type="button" aria-pressed={timeScale === "boundary"} className={timeScale === "boundary" ? "is-active" : ""} onClick={() => setTimeScale("boundary")}>跨过 Task Boundary</button>
        </div>
        <div className={`p09-timescale-track p09-timescale-track--${timeScale}`} aria-label="Replay 在任务内部反复使用，EWC 在任务边界建立长期约束">
          <div className="p09-timescale-track__task"><span>GAME A · FRAMES / TRANSITIONS</span><div className="p09-replay-cycle"><b>Replay</b><i /><i /><i /><i /><i /><small>当前游戏经验反复进入训练</small></div></div>
          <div className="p09-timescale-track__boundary"><span>TASK BOUNDARY</span><b>EWC</b><small>Anchor + Fisher</small></div>
          <div className="p09-timescale-track__task"><span>GAME B · NEXT TASK</span><div className="p09-replay-cycle"><b>Replay</b><i /><i /><i /><small>新经验继续训练</small></div></div>
        </div>
        <p className="p09-timescale-explanation" aria-live="polite">{timeScale === "within"
          ? <>在游戏任务内部，<ReferenceTrigger id="replay">Replay</ReferenceTrigger> 保存并抽取 transition，支持当前任务的强化学习更新。EWC 不提供这些训练经验。</>
          : <>在 Task Boundary，系统整理已训练任务的参数约束；后续任务读取 EWC 状态。Atari 的任务识别由单独机制提供。</>}</p>
      </section>

      <section className="p09-lifecycle" aria-labelledby="p09-lifecycle-title">
        <div className="p09-section-heading">
          <div><span className="p09-overline">EWC INSIDE THE ATARI RUN</span><h2 id="p09-lifecycle-title">把第 7 页的生命周期放回游戏序列</h2></div>
          <button type="button" className="p09-page-link" onClick={() => api.openReference({ pageId: "page-07-lifecycle", anchorId: "task-boundary" })}>回到 Page 7 · 通用生命周期</button>
        </div>
        <ol className="p09-atari-lifecycle">
          <li><b>Play game A</b><span>收集 observation、action、reward 与 next observation</span></li>
          <li><b>Replay and learn</b><span>用游戏 A 的经验训练 action-value network</span></li>
          <li><b>Task switch</b><span>保存当前解并估计 Fisher</span></li>
          <li><b>Train game B + EWC</b><span>新游戏经验继续训练，旧状态约束参数偏移</span></li>
        </ol>
        <details className="p09-experiment-details">
          <summary>展开 Atari 实验设置</summary>
          <div><p>在论文报告的配置中，某个游戏至少经历 20 million frames 后才启用 EWC 保护；任务切换时重新估计 Fisher。</p><p>Appendix 使用 Replay buffer 中的 100 个 mini-batches 计算 Fisher，并将 Fisher 乘以 400 形成 EWC penalty。</p><small>这些是论文实验设置，不是所有 Atari 或 EWC 系统的默认参数。</small></div>
        </details>
      </section>

      <section className="p09-evidence" aria-labelledby="p09-evidence-title">
        <div className="p09-section-heading">
          <div><span className="p09-overline">EVIDENCE · FULL SYSTEM</span><h2 id="p09-evidence-title">先读跨游戏表现，再读 Fisher 诊断</h2></div>
        </div>
        <p className="p09-evidence-intro">该对照从 19 款游戏池中抽取 10 款并反复顺序训练（R03，§2.2）。Figure 3A 展示训练安排；3B 汇总 human-normalized score，它将游戏得分相对于随机与人类基准归一化后求和，不是分类 Accuracy，也不能保证每款游戏都提高。3C 单独检验 Breakout 参数扰动。</p>
        <div className="p09-figure-wrap">
          <PaperFigure
            src={new URL("images/figure-3.png", document.baseURI).toString()}
            mode="crop"
            figureLabel="论文 Figure 3A–C"
            alt="论文 Figure 3 的三个面板：A 为十款 Atari 游戏的顺序训练安排；B 为包含 EWC、任务识别与任务专属机制的系统在多游戏序列上的总 human-normalized score；C 为 Breakout DQN 在 uniform、inverse-Fisher 与 Fisher-nullspace 权重扰动下的分数。"
            caption="A 给出游戏顺序与 EWC 开始保护的时点。B 显示完整 Atari 系统的跨游戏表现。C 是单游戏 Breakout 网络的参数扰动诊断。三个面板来自不同层次的实验问题。"
            source="Kirkpatrick et al., PNAS 2017, Figure 3, PDF pp. 5–6. Reproduced unchanged for noncommercial educational use."
          />
        </div>

        <div className="p09-evidence-reading">
          <article className="p09-evidence-reading__performance">
            <span className="p09-overline">1 · CONTINUAL RL PERFORMANCE</span>
            <h3>多游戏分数属于完整 Atari 系统</h3>
            <p>Figure 3B 的绝对多游戏成绩属于完整 Atari 系统：DQN、Replay、Task Recognition、task-specific gains / biases 与 EWC。保留其余系统机制、对比有无 EWC penalty 后，EWC 与 no-EWC 曲线在重玩已保护游戏时分开，支持 EWC 在该设置下有助于任务保持。</p>
            <p className="p09-evidence-caveat">对照十个分别训练的 DQN 时，Atari EWC agent 没有达到独立网络的分数。</p>
          </article>
          <article className="p09-evidence-reading__perturbation">
            <span className="p09-overline">2 · FISHER PERTURBATION</span>
            <h3><ReferenceTrigger id="fisher_perturbation">参数扰动实验</ReferenceTrigger> 检查局部敏感性线索</h3>
            <p>在 Figure 3C 中，inverse-Fisher-shaped perturbation 比 uniform perturbation 更稳健。这支持对角 Fisher 捕捉到部分参数敏感性结构。</p>
            <p className="p09-evidence-caveat">Fisher-nullspace 扰动的影响与 inverse-Fisher 扰动相近，而近似本应预期 nullspace 方向不影响输出。作者据此认为方法可能低估了一些参数的不确定性。</p>
          </article>
        </div>
        <details className="p09-perturbation-detail">
          <summary>查看 Fisher 扰动实验如何检验 Page 5 的直觉</summary>
          <div>
            <p>设网络位于 θ*。Uniform noise 对各参数施加同尺度随机扰动；inverse-Fisher covariance 会在 Fisher 较小的方向允许较大扰动；nullspace 条件则测试对角 Fisher 估为零影响的方向。</p>
            <p><ReferenceTrigger id="diagonal_fisher_limit">对角 Fisher</ReferenceTrigger> 忽略参数耦合，局部方差点估计也存在误差。被判为低敏感的方向仍可能影响表现；这项诊断没有单独证明误差只来自忽略 off-diagonal coupling。</p>
            <button type="button" onClick={() => api.openHub("fisher_information")}>回顾 Page 5 · Fisher 局部敏感性</button>
          </div>
        </details>
        <details className="p09-perturbation-detail p09-perturbation-detail--settings">
          <summary>查看单游戏扰动实验设置</summary>
          <div><p>诊断训练了单游戏 Breakout DQN，使用十个完整游戏 episode 评估；每个时间步都会重新采样参数扰动。</p><button type="button" onClick={() => api.openHub("fisher_perturbation")}>在 Reference Hub 查看证据记录</button></div>
        </details>
      </section>

      <section className="p09-limits" id="atari-evidence-limits" aria-labelledby="p09-limits-title">
        <div className="p09-section-heading">
          <div><span className="p09-overline">EVIDENCE BOUNDARY</span><h2 id="p09-limits-title">实验支持了机制，也显示了它的边界</h2></div>
        </div>
        <dl className="p09-limit-list">
          <div><dt>有限模型容量</dt><dd>旧任务约束可能减少后续任务可自由调整的参数方向。作者将与十个独立网络的分数差距和不确定性近似联系起来，但这只是可能解释。</dd></div>
          <div><dt>结果范围</dt><dd>这些结果来自本文 Atari 游戏序列与系统设置；它们支持 EWC 在该对照条件下的贡献，但不能直接推广到所有 continual RL 场景。</dd></div>
          <div><dt>对角 Fisher</dt><dd>它是可计算的近似，忽略参数之间的耦合。Nullspace 扰动结果显示，被估作低敏感的变化仍可能影响表现。</dd></div>
        </dl>
        <p className="p09-capacity-note">有关容量与任务数的关系属于方法边界解释，不是论文测得的固定任务上限。</p>
      </section>

      <footer className="p09-closing">
        <div><span className="p09-overline">THE EVIDENCE CHAIN IS COMPLETE</span><h2>现在把问题、推导、生命周期和两组实验放进同一条执行链。</h2><p>最终 Grand Animation 负责整合已学对象，不再引入新的核心知识。</p></div>
        <button type="button" onClick={() => api.navigatePage("page-10-grand-animation")}>进入 Final · Grand Animation</button>
      </footer>
    </article>
  );
}
