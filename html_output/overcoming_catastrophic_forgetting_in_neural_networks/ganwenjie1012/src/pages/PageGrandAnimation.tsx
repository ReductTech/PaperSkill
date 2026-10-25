import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import type { AnchorId, CanonicalReferenceId, GrandAnimationStateId, RuntimeObjectId } from "../contracts/ids";
import { MathFormula } from "../shared/teaching/Math";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import "../styles/page10.css";

type PhaseId = "task-a" | "consolidation" | "task-b" | "continual";
type SceneId = "overview" | "data" | "forward" | "probability" | "backward" | "update" | "compression" | "boundary" | "posterior" | "laplace" | "return" | "anchor" | "fisher" | "memory" | "task-b" | "objective" | "gradient" | "loop";
type MathId = "probability" | "posterior" | "laplace" | "fisher" | "objective" | "gradient";
type ReviewLink = { page: "page-03-bayes" | "page-04-laplace" | "page-05-fisher" | "page-06-ewc-objective" | "page-07-lifecycle"; anchor: AnchorId; label: string };
type AnimationState = {
  id: GrandAnimationStateId;
  title: string;
  short: string;
  phase: PhaseId;
  task: string;
  camera: string;
  annotation: string;
  why: string;
  scene: SceneId;
  focus: RuntimeObjectId[];
  math?: MathId;
  checkpoint?: boolean;
  review?: ReviewLink;
};

const STATES: AnimationState[] = [
  { id: "overview", title: "从一套模型开始", short: "全局视图", phase: "task-a", task: "TASK A → B → C", camera: "WORLD VIEW", annotation: "跟随同一个模型从 Task A 开始训练，观察旧任务信息怎样被保存，并在 Task B 中继续影响参数更新。", why: "先建立全局坐标：训练时间始终从左向右推进，旧任务状态留在下方的 Memory Rail。", scene: "overview", focus: [], checkpoint: true },
  { id: "task-a-data", title: "Task A 数据进入模型", short: "数据到达", phase: "task-a", task: "TASK A", camera: "RUNTIME VIEW", annotation: "Task A 的数据被分成 batch 与 sample，送入当前模型；此时模型仍使用同一组可训练参数 θ。", why: "输入样本进入网络，才开始一次普通的训练计算。", scene: "data", focus: ["task-a-data", "neural-network"], checkpoint: false },
  { id: "first-forward", title: "Forward 计算输出", short: "Forward", phase: "task-a", task: "TASK A", camera: "NETWORK FOCUS", annotation: "Forward 使用当前参数计算输出；参数参与计算，但此时还没有被更新。", why: "网络逐层把输入转换为 logits，层参数在这一步只参与运算。", scene: "forward", focus: ["neural-network", "model-logits"] },
  { id: "probability-loss", title: "概率连接到 Task Loss", short: "Probability / Loss", phase: "task-a", task: "TASK A", camera: "OUTPUT NODE FOCUS", annotation: "Softmax 把 logits 转成类别概率。正确类别的概率进入负对数损失，再汇总为 Task A 的 Loss。", why: "这一条概率链提供了后续反向传播所需的训练目标。", scene: "probability", focus: ["model-logits", "prediction-probabilities", "task-a-loss"], math: "probability", checkpoint: true },
  { id: "backward", title: "Backward 计算梯度", short: "Backward", phase: "task-a", task: "TASK A", camera: "RUNTIME VIEW", annotation: "梯度从 Loss 沿网络向回传播，并为每个有参数的层产生对应的参数梯度。", why: "Backward 计算每个参数应该怎样改变；它本身还不执行参数更新。", scene: "backward", focus: ["task-a-loss", "task-a-gradient", "neural-network"] },
  { id: "optimizer-update", title: "Optimizer 更新参数", short: "Update", phase: "task-a", task: "TASK A", camera: "PARAMETER FOCUS", annotation: "Backward 已得到梯度。真正让当前参数发生变化的是 optimizer.step()。", why: "梯度提供更新方向，Optimizer 根据它移动当前参数 θ。", scene: "update", focus: ["task-a-gradient", "optimizer", "current-parameters"] },
  { id: "task-a-compression", title: "重复训练直到 Task A 完成", short: "训练压缩", phase: "task-a", task: "TASK A", camera: "WORLD VIEW", annotation: "熟悉的 batch → loss → backward → update 循环被压缩展示，模型逐步到达 Task A 的训练结果 θ_A*。", why: "真实训练包含许多 iteration；整合动画只保留一次循环的结构，再压缩重复过程。", scene: "compression", focus: ["task-a-data", "task-a-loss", "optimizer", "current-parameters"] },
  { id: "task-a-boundary", title: "Task A 到达边界", short: "Task A Boundary", phase: "consolidation", task: "TASK A · BOUNDARY", camera: "RUNTIME VIEW", annotation: "Task A 已经训练完成。接下来不再降低 Task A Loss，而要记录后续训练可能破坏哪些参数状态。", why: "θ_A* 告诉我们 Task A 在哪里结束，却没有告诉我们附近哪些参数方向敏感。", scene: "boundary", focus: ["current-parameters", "task-a-data"], checkpoint: true, review: { page: "page-07-lifecycle", anchor: "task-boundary", label: "回顾 Page 7 · Task Boundary" } },
  { id: "posterior-view", title: "从参数点转向 Posterior", short: "Posterior", phase: "consolidation", task: "MATHEMATICAL VIEW", camera: "SEMANTIC ZOOM", annotation: "θ_A* 是一个参数点；Posterior 描述观察 Task A 数据之后，附近哪些参数状态仍然合理。", why: "先理解旧任务解附近的可能状态，再用 Laplace 构造可计算的局部近似。", scene: "posterior", focus: ["task-a-data", "current-parameters"], math: "posterior", checkpoint: true, review: { page: "page-03-bayes", anchor: "prior-likelihood-posterior", label: "回顾 Page 3 · Posterior" } },
  { id: "laplace-view", title: "在解附近做局部近似", short: "Laplace", phase: "consolidation", task: "MATHEMATICAL VIEW", camera: "SEMANTIC ZOOM · LOCAL", annotation: "Laplace Approximation 用 θ_A* 附近的局部 Gaussian 描述复杂 Posterior 的形状。", why: "局部曲率把参数偏移与敏感性联系起来，为下一步的可计算近似提供依据。", scene: "laplace", focus: ["current-parameters", "task-a-anchor"], math: "laplace", checkpoint: true, review: { page: "page-04-laplace", anchor: "laplace-local-view", label: "回顾 Page 4 · Laplace" } },
  { id: "return-runtime", title: "回到真实 Runtime", short: "返回 Runtime", phase: "consolidation", task: "TASK A · CONSOLIDATION", camera: "RUNTIME VIEW", annotation: "Posterior 与 Gaussian 是解释层。现在回到实际执行：EWC 需要可计算、可保存的局部敏感性近似。", why: "Mathematical View 收起后，同一个模型和参数对象仍在原来的训练流程中。", scene: "return", focus: ["neural-network", "current-parameters", "task-a-data"], review: { page: "page-05-fisher", anchor: "fisher-estimation", label: "前往 Page 5 · Fisher" } },
  { id: "save-anchor", title: "保存固定 Anchor", short: "Save Anchor", phase: "consolidation", task: "TASK A · CONSOLIDATION", camera: "PARAMETER + MEMORY FOCUS", annotation: "Anchor 是 Task A 结束时参数的固定快照。后续 Current Parameters 会变化，快照保持不变。", why: "比较当前 θ 与固定的 θ_A*，才能表示后续学习偏离旧任务解的距离。", scene: "anchor", focus: ["current-parameters", "task-a-anchor", "persistent-memory"], review: { page: "page-07-lifecycle", anchor: "task-boundary", label: "回顾 Page 7 · 保存时点" } },
  { id: "fisher-estimation", title: "固定参数，估计对角 Fisher", short: "Diagonal Fisher", phase: "consolidation", task: "TASK A · FISHER ESTIMATION", camera: "RUNTIME VIEW", annotation: "固定 θ_A*，逐样本计算观测标签 log probability 的梯度平方并汇总。", why: "汇总得到对角 F_A，以近似旧解附近的局部精度；此步骤只估计敏感性，不更新参数。", scene: "fisher", focus: ["task-a-data", "neural-network", "task-a-fisher", "persistent-memory"], math: "fisher", checkpoint: true, review: { page: "page-05-fisher", anchor: "fisher-estimation", label: "回顾 Page 5 · Fisher 估计" } },
  { id: "task-a-consolidated", title: "Task A 状态进入 Memory Rail", short: "Store S_A", phase: "consolidation", task: "PERSISTENT MEMORY", camera: "MEMORY FOCUS", annotation: "Task A 留下两类长期信息：结束时的参数位置 θ_A*，以及各参数附近的 Fisher 敏感性近似 F_A。", why: "S_A=(θ_A*,F_A) 为后续旧任务约束保留参数位置与敏感性；原始样本不属于这组状态。", scene: "memory", focus: ["task-a-anchor", "task-a-fisher", "task-state-a", "persistent-memory"], checkpoint: true, review: { page: "page-07-lifecycle", anchor: "task-a-to-b-to-c", label: "回顾 Page 7 · A → B → C" } },
  { id: "task-b-arrives", title: "Task B 从旧参数继续", short: "Task B arrives", phase: "task-b", task: "TASK B", camera: "TRACK → TASK B", annotation: "Task B 使用新的数据 D_B，但同一个模型从 Task A 训练得到的参数状态继续学习。", why: "Task B 用新数据产生当前 Loss，并由 Memory Rail 中的 S_A 提供旧任务约束。", scene: "task-b", focus: ["task-b-data", "neural-network", "task-b-loss", "persistent-memory"] },
  { id: "ewc-objective", title: "组装 Task B 的 EWC 目标", short: "EWC Objective", phase: "task-b", task: "TASK B · EWC OBJECTIVE", camera: "RUNTIME + MEMORY FOCUS", annotation: "Task B Loss 与 Fisher 加权的旧任务参数约束合并。F_A,i 逐参数变化，λ 缩放整体约束。", why: "新任务目标来自 L_B；旧任务的 Anchor 与 Fisher 来自 Memory Rail 中的 S_A。", scene: "objective", focus: ["task-b-loss", "current-parameters", "task-a-anchor", "task-a-fisher", "ewc-penalty", "persistent-memory"], math: "objective", checkpoint: true, review: { page: "page-06-ewc-objective", anchor: "ewc-objective", label: "回顾 Page 6 · EWC Objective" } },
  { id: "combined-gradient", title: "两路梯度在 Junction 汇合", short: "Gradient Junction", phase: "task-b", task: "TASK B · OPTIMIZATION", camera: "GRADIENT JUNCTION FOCUS", annotation: "EWC 不冻结参数。Task B Gradient 与 EWC Gradient 汇合成 Total Gradient，再交给 Optimizer 更新当前 θ。", why: "EWC 改变 Optimizer 接收的 Total Gradient，而不是替换 Optimizer。", scene: "gradient", focus: ["task-b-gradient", "ewc-gradient", "total-gradient", "optimizer", "current-parameters"], math: "gradient", checkpoint: true, review: { page: "page-06-ewc-objective", anchor: "gradient-junction", label: "回顾 Page 6 · Gradient Junction" } },
  { id: "continual-loop", title: "Task B 结束，Task C 到达", short: "Continual Loop", phase: "continual", task: "TASK B → C", camera: "WORLD VIEW", annotation: "Task B 结束后保存 θ_B*、估计对角 Fisher F_B，并形成 S_B=(θ_B*,F_B)；随后 Task C 数据到达，同一模型在旧任务约束下继续学习。", why: "B Boundary → Store S_B → Task C data → 同一模型继续；目标式是概念性延续，不增加训练数值。", scene: "loop", focus: ["task-c-data", "task-state-a", "task-state-b", "persistent-memory", "current-parameters"], checkpoint: true, review: { page: "page-07-lifecycle", anchor: "task-a-to-b-to-c", label: "回顾 Page 7 · 生命周期" } },
];

const PHASES: { id: PhaseId; title: string; sub: string; first: number; last: number }[] = [
  { id: "task-a", title: "TASK A", sub: "Training", first: 0, last: 6 },
  { id: "consolidation", title: "CONSOLIDATION", sub: "Boundary · Math · Memory", first: 7, last: 13 },
  { id: "task-b", title: "TASK B", sub: "With EWC", first: 14, last: 16 },
  { id: "continual", title: "CONTINUAL LOOP", sub: "Repeat", first: 17, last: 17 },
];

const TIMELINE_PHASES = [
  { title: "阶段 1 · Task A 训练", range: "States 1–7", first: 0, last: 6, tone: "task-a" },
  { title: "阶段 2 · 边界与数学视图", range: "States 8–11", first: 7, last: 10, tone: "boundary" },
  { title: "阶段 3 · Task A Consolidation", range: "States 12–14", first: 11, last: 13, tone: "consolidation" },
  { title: "阶段 4 · Task B + EWC", range: "States 15–17", first: 14, last: 16, tone: "task-b" },
  { title: "阶段 5 · Continual Loop", range: "State 18", first: 17, last: 17, tone: "loop" },
];
const NORMAL_STATE_HOLD_MS = 5200;
const READING_STATE_HOLD_MS = 6500;
const READING_STATE_IDS = new Set<GrandAnimationStateId>([
  "probability-loss",
  "posterior-view",
  "laplace-view",
  "fisher-estimation",
  "ewc-objective",
  "combined-gradient",
]);
const FLOWING_BOARD_EDGES: Partial<Record<GrandAnimationStateId, string[]>> = {
  "task-a-data": ["data-input"],
  "save-anchor": ["save-anchor"],
  "fisher-estimation": ["data-input", "save-fisher"],
  "task-a-consolidated": ["save-task-state-a"],
  "task-b-arrives": ["data-input", "read-task-state-a"],
  "ewc-objective": ["read-task-state-a"],
  "combined-gradient": ["read-task-state-a"],
  "continual-loop": ["data-input-task-c", "save-task-state-b"],
};
const FLOWING_NETWORK_SCENES = new Set<SceneId>(["data", "forward", "probability", "backward", "update", "compression", "fisher", "task-b", "objective", "gradient", "loop"]);

const OBJECT_INFO: Record<RuntimeObjectId, { title: string; badge: string; body: string; detail: string }> = {
  "task-a-data": { title: "Task A data · D_A", badge: "CURRENT DATA", body: "Task A 的样本和 batch 进入当前网络。", detail: "数据由输入 x 与目标 y 组成。Task A 结束前，数据仍用于任务训练，也在设计规定的 Fisher 估计路径中提供样本。" },
  "task-c-data": { title: "Task C data · D_C", badge: "CURRENT DATA", body: "Task C 的新示意样本到达同一个共享模型。", detail: "本页用合成示例说明后续任务输入；类别仍为 A / B / C，旧任务状态 S_A 与 S_B 可继续提供约束。" },
  "task-a-batch": { title: "Task A batch", badge: "BATCH", body: "一个 batch 含有多个训练样本。", detail: "Batch 用于一次前向、Loss 与梯度计算。图中只展示代表性样本，不代表固定 batch size。" },
  "neural-network": { title: "共享模型 · f_θ", badge: "RUNTIME OBJECT", body: "Task A 与后续任务继续使用同一个模型。", detail: "CNN-like 网络只是展示数据流、参数和梯度的教学载体。EWC 不依赖 CNN；参数按层分组呈现，数学粒度仍是逐参数。" },
  "model-logits": { title: "Logits · z", badge: "NETWORK OUTPUT", body: "最后一层输出的未归一化类别分数。", detail: "Softmax 把 logits 转换为类别概率 p_θ(y|x)。" },
  "prediction-probabilities": { title: "类别概率 · p_θ(y|x)", badge: "PROBABILITY", body: "模型对给定输入 x 的类别预测概率。", detail: "正确类别概率进入负对数似然，形成当前任务的训练 Loss。" },
  "task-a-loss": { title: "Task A Loss · L_A", badge: "TASK OBJECTIVE", body: "Task A 的数据与模型预测共同产生当前任务 Loss。", detail: "Loss 的梯度随后通过 Backward 传回模型参数。" },
  "task-a-gradient": { title: "Task A Gradient", badge: "BACKWARD SIGNAL", body: "Loss 对模型参数的导数。", detail: "梯度指示局部更新方向。参数更新要等 Optimizer 执行 step。" },
  optimizer: { title: "Optimizer", badge: "UPDATE RULE", body: "读取 Total Gradient 并更新当前参数。", detail: "普通训练时它使用 Task Loss Gradient；EWC 训练时接收 Task B 与 EWC 合并后的 Total Gradient。Fisher 估计期间 optimizer.step() 关闭。" },
  "current-parameters": { title: "当前参数 · θ", badge: "TRAINABLE STATE", body: "当前网络实际使用、并在训练中继续变化的参数。", detail: "Task A 结束时得到 θ_A*。进入 Task B 后，当前参数从这个位置继续优化；θ_A* 的固定快照留在 Memory Rail。" },
  "task-a-anchor": { title: "固定 Anchor · θ_A*", badge: "STORED SNAPSHOT", body: "Task A 完成时复制并保留的参数快照。", detail: "Anchor 后续保持固定。EWC 比较当前 θ 与 θ_A*，形成旧任务约束中的参数偏移。" },
  "task-a-fisher": { title: "Diagonal Fisher · F_A", badge: "LOCAL SENSITIVITY APPROXIMATION", body: "EWC 使用对角 Fisher 近似 Task A 解附近的局部精度。", detail: "这里展示 observed-label empirical-Fisher 教学示例：固定 θ_A*，按样本累计观测标签 log probability 梯度的逐坐标平方。它与理论 Fisher（对模型预测分布取期望）的定义不同；EWC 论文未规定这套通用逐样本估计配方。对角 Fisher 是局部精度近似，不是精确参数重要性真值或完整 Posterior Hessian。" },
  "fisher-estimator": { title: "Diagonal Fisher estimation", badge: "TEACHING ESTIMATOR", body: "本教程用 observed-label empirical-Fisher 示例演示逐坐标梯度平方的汇总。", detail: "Parameters FIXED at θ_A* · Gradient ENABLED · Optimizer OFF。每个样本的逐坐标梯度平方加入对应 Fisher 累积项。" },
  "persistent-memory": { title: "Persistent Memory Rail", badge: "STORED TASK STATE", body: "旧任务的 Anchor 与 Fisher 跨越时间轴持续保留。", detail: "Task A 后保存 S_A=(θ_A*,F_A)。Task B 读取它构造约束；Task B 边界再加入 S_B。S_A 是教学状态表示。" },
  "task-state-a": { title: "Task A state · S_A", badge: "θ_A* + F_A", body: "由固定 Anchor 与 Fisher 组成的教学状态。", detail: "S_A=(θ_A*,F_A) 将 Task A 结束位置和参数局部敏感性近似带入后续任务。" },
  "task-state-b": { title: "Task B state · S_B", badge: "θ_B* + F_B", body: "Task B 结束时保存的 Anchor 与 Fisher 状态，供后续任务继续读取。", detail: "State 18 示意 Task B 结束后形成 S_B=(θ_B*,F_B)，供 Task C 等后续任务读取；此前状态中它仍待形成。这里是生命周期延续示意，Task B 当前 EWC 目标仍由 S_A=(θ_A*,F_A) 约束。" },
  "task-b-data": { title: "Task B data · D_B", badge: "CURRENT DATA", body: "Task B 的新 batch 驱动当前任务 Loss。", detail: "本页的通用 EWC 路径由 Anchor 与 Fisher 提供旧任务约束；Task B 当前 batch 提供新任务数据。" },
  "task-b-loss": { title: "Task B Loss · L_B", badge: "NEW TASK OBJECTIVE", body: "由 Task B 数据与当前预测产生。", detail: "L_B 与旧任务 EWC penalty 相加，组成 L_total。" },
  "ewc-penalty": { title: "EWC penalty · Ω_A", badge: "OLD TASK CONSTRAINT", body: "对偏离 Task A Anchor 的变化施加 Fisher 加权代价。", detail: "逐参数项由 F_A,i(θ_i−θ_A,i*)² 构成，λ 缩放整体约束。它限制更新方向，不冻结参数。" },
  "task-b-gradient": { title: "Task B Gradient · g_B", badge: "NEW TASK SIGNAL", body: "Task B Loss 对当前参数产生的梯度。", detail: "它推动参数改善新任务目标。" },
  "ewc-gradient": { title: "EWC Gradient · g_EWC", badge: "RESTORING SIGNAL", body: "EWC penalty 对偏离旧任务 Anchor 的变化产生梯度。", detail: "其强度逐参数受 F_A,i 和全局 λ 调节，并与 g_B 汇合。" },
  "total-gradient": { title: "Total Gradient", badge: "JUNCTION OUTPUT", body: "Task B Gradient 与 EWC Gradient 的和。", detail: "Optimizer 根据 Total Gradient 更新当前参数 θ。EWC 改变其输入梯度，不替换优化器。" },
  "replay-buffer": { title: "Replay buffer", badge: "ATARI SYSTEM DETAIL", body: "Replay buffer 属于 Page 9 的 Atari 系统。", detail: "Page 10 只整合 EWC 的通用顺序训练机制，不展开 Atari 实验设置。" },
  "task-recognition": { title: "Task recognition", badge: "ATARI SYSTEM DETAIL", body: "任务识别属于 Page 9 的 Atari 系统。", detail: "Page 10 不重新展示 Atari 结果或系统扩展。" },
  "task-specific-modulation": { title: "Task-specific modulation", badge: "ATARI SYSTEM DETAIL", body: "任务专属参数机制属于 Page 9 的 Atari 系统。", detail: "Grand Animation 保持为一般的 EWC 生命周期整合，不混入实验机制。" },
};

const STATE_INDEX = new Map(STATES.map((state, index) => [state.id, index]));
const LAST_STATE_INDEX = STATES.length - 1;

function getPlaybackEndIndex(activeIndex: number) {
  const phaseIndex = TIMELINE_PHASES.findIndex((phase) => activeIndex >= phase.first && activeIndex <= phase.last);
  if (phaseIndex < 0) return LAST_STATE_INDEX;

  const currentPhase = TIMELINE_PHASES[phaseIndex];
  if (activeIndex < currentPhase.last) return currentPhase.last;
  return TIMELINE_PHASES[phaseIndex + 1]?.last ?? LAST_STATE_INDEX;
}

function getStateHoldMs(stateId: GrandAnimationStateId) {
  return READING_STATE_IDS.has(stateId) ? READING_STATE_HOLD_MS : NORMAL_STATE_HOLD_MS;
}

function getStateViewLabel(state: AnimationState) {
  if (state.scene === "posterior") return "MATHEMATICAL VIEW";
  if (state.scene === "laplace") return "LOCAL APPROXIMATION";
  return state.camera;
}

function useFirstVisitHelp() {
  const [open, setOpen] = useState(() => {
    try { return typeof window !== "undefined" && window.localStorage.getItem("ewc-grand-animation-help-seen") !== "1"; }
    catch { return true; }
  });
  const close = () => {
    try { window.localStorage.setItem("ewc-grand-animation-help-seen", "1"); } catch { /* storage may be unavailable */ }
    setOpen(false);
  };
  return { open, close };
}

function FormulaToken({ objectId, children, onSelect }: { objectId: RuntimeObjectId; children: ReactNode; onSelect: (id: RuntimeObjectId) => void }) {
  return <button type="button" data-p10-transition-id={objectId} className="p10-formula-token" onClick={() => onSelect(objectId)}>{children}</button>;
}

function MathReference({ id, children, className = "" }: { id: CanonicalReferenceId; children: ReactNode; className?: string }) {
  return <ReferenceTrigger id={id} className={`p10-math-reference ${className}`.trim()}>{children}</ReferenceTrigger>;
}

function Formula({ kind, expanded, onSelect }: { kind: MathId; expanded: boolean; onSelect: (id: RuntimeObjectId) => void }) {
  const token = (id: RuntimeObjectId, label: ReactNode) => <FormulaToken key={`${id}-${String(label)}`} objectId={id} onSelect={onSelect}>{label}</FormulaToken>;
  if (kind === "probability") return <div className="p10-formula-line" aria-label="类别概率转化为任务损失">{token("prediction-probabilities", <>p<sub>θ</sub>(y | x)</>)} <span>→</span> {token("task-a-loss", expanded ? <>−log p<sub>θ</sub>(y | x) → L<sub>A</sub>(θ)</> : <>−log p<sub>θ</sub>(y | x)</>)}</div>;
  if (kind === "posterior") return <div className="p10-formula-line" aria-label="Task A 参数后验：似然乘以先验再归一化"><MathReference id="task_a_posterior">p(θ | D<sub>A</sub>)</MathReference> <span>∝</span> <MathReference id="p_D_given_theta">p(D<sub>A</sub> | θ)</MathReference> <span>·</span> <MathReference id="p_theta">p(θ)</MathReference>{expanded && <span className="p10-formula-tail"> / p(D<sub>A</sub>)</span>}</div>;
  if (kind === "laplace") return <div className="p10-formula-line" aria-label="Task A Posterior 的 Laplace 局部 Gaussian 近似"><MathReference id="laplace_approximation">p(θ | D<sub>A</sub>) ≈ 𝒩(</MathReference>{token("task-a-anchor", <>θ<sub>A</sub>*</>)}<span className="p10-formula-static">, Σ<sub>A</sub>)</span>{expanded && <span className="p10-formula-tail"> · <MathReference id="local_precision">Σ<sub>A</sub><sup>−1</sup> ≈ H<sub>A</sub></MathReference></span>}</div>;
  if (kind === "fisher") return <div className="p10-formula-line" aria-label="Diagonal Fisher 的逐坐标 observed-label empirical-Fisher 教学示例">{token("task-a-fisher", <>F<sub>A,i</sub></>)} <span>≈</span> <span className="p10-formula-static">{expanded ? <>1/N Σ<sub>n</sub> [ ∂ log p<sub>θA*</sub>(y<sub>n</sub>|x<sub>n</sub>) / ∂θ<sub>i</sub> ]<sup>2</sup></> : <>1/N Σ<sub>n</sub> g<sub>i,n</sub><sup>2</sup></>}</span></div>;
  if (kind === "objective") return <div className="p10-formula-line" aria-label="EWC total objective"><span className="p10-formula-static">L<sub>total</sub> =</span> {token("task-b-loss", <>L<sub>B</sub></>)} <span>+</span> {expanded ? <span className="p10-expanded-penalty">{token("ewc-penalty", "λ")}<span>/2 Σ<sub>i</sub></span> {token("task-a-fisher", <>F<sub>A,i</sub></>)} <span>(</span>{token("current-parameters", <>θ<sub>i</sub></>)}<span>−</span>{token("task-a-anchor", <>θ<sub>A,i</sub>*</>)}<span>)<sup>2</sup></span></span> : token("ewc-penalty", <>λ Ω<sub>A</sub></>)}</div>;
  return <div className="p10-formula-line" aria-label="EWC combined gradient">{token("total-gradient", <>∇L<sub>total</sub></>)} <span>=</span> {token("task-b-gradient", <>g<sub>B</sub></>)} <span>+</span> {token("ewc-gradient", expanded ? <>λ F<sub>A</sub> ⊙ (θ − θ<sub>A</sub>*)</> : <>g<sub>EWC</sub></>)}</div>;
}

function WorkbenchNode({ id, label, eyebrow, active, selected, onSelect, shape = "node" }: { id: RuntimeObjectId; label: ReactNode; eyebrow?: string; active: boolean; selected: boolean; onSelect: (id: RuntimeObjectId) => void; shape?: "node" | "data" | "parameter" }) {
  return <button type="button" data-p10-transition-id={id} className={`p10-node p10-node--${shape} ${active ? "is-active" : ""} ${selected ? "is-linked" : ""}`} onClick={() => onSelect(id)} aria-pressed={selected}>
    {eyebrow && <span className="p10-node__eyebrow">{eyebrow}</span>}<b>{label}</b><span className="p10-node__inspect">Inspect</span>
  </button>;
}

function LayerBlocks({ focus, selected, onSelect, includeFisher = false, includeAnchor = false }: { focus: RuntimeObjectId[]; selected?: RuntimeObjectId; onSelect: (id: RuntimeObjectId) => void; includeFisher?: boolean; includeAnchor?: boolean }) {
  const layers = [
    { layer: "Conv 1 weights", id: "task-a-anchor" as const, param: "θ¹ · W¹", fisher: "F¹" },
    { layer: "Conv 2 weights", id: "task-a-anchor" as const, param: "θ² · W²", fisher: "F²" },
    { layer: "FC hidden weights", id: "task-a-anchor" as const, param: "θ³ · W³", fisher: "F³" },
    { layer: "Output weights", id: "task-a-anchor" as const, param: "θ⁴ · W⁴", fisher: "F⁴" },
  ];
  const transitionIds = ["current-parameters", includeAnchor ? "task-a-anchor" : "", includeFisher ? "task-a-fisher" : ""].filter(Boolean).join(" ");
  return <div data-p10-transition-id={transitionIds} className="p10-layer-grid" aria-label="按网络层分组的代表性参数与 Fisher">
    {layers.map((layer, index) => <div className={`p10-layer-card ${focus.includes("current-parameters") ? "is-current" : ""}`} key={layer.layer}>
      <div className="p10-layer-card__heading"><span>{layer.layer}</span><small>θ<sup>{index + 1}</sup></small></div>
      <button type="button" className={`p10-parameter-cells ${selected === "current-parameters" ? "is-linked" : ""}`} onClick={() => onSelect("current-parameters")} aria-label={`${layer.param}，查看当前参数`}>
        <span>░</span><span>▒</span><span>▓</span><span>▒</span><span>░</span><span>▓</span><span>▒</span><span>░</span><span>▒</span><span>▓</span><span>░</span><span>▒</span>
      </button>
      <div className="p10-layer-card__shape">{layer.param} <span>parameter block</span></div>
      {includeAnchor && <button type="button" className={`p10-layer-card__anchor ${selected === "task-a-anchor" ? "is-linked" : ""}`} onClick={() => onSelect("task-a-anchor")} aria-label="Task A 固定 Anchor θ_A^* snapshot"><span><MathFormula tex={String.raw`\theta_{A}^{*}`} /> snapshot</span></button>}
      {includeFisher && <button type="button" className={`p10-layer-card__fisher ${selected === "task-a-fisher" ? "is-linked" : ""}`} onClick={() => onSelect("task-a-fisher")}><span>{layer.fisher}</span><small>aligned Fisher</small></button>}
    </div>)}
  </div>;
}

function RuntimeTrack({ state, selected, onSelect }: { state: AnimationState; selected?: RuntimeObjectId; onSelect: (id: RuntimeObjectId) => void }) {
  const taskIsB = state.phase === "task-b" || state.phase === "continual";
  const active = (id: RuntimeObjectId) => state.focus.includes(id);
  const nodes: { id: RuntimeObjectId; label: ReactNode; eyebrow: string; shape?: "node" | "data" | "parameter" }[] = [
    { id: taskIsB ? "task-b-data" : "task-a-data", label: <>D<sub>{taskIsB ? "B" : "A"}</sub> · Batch</>, eyebrow: "CURRENT TASK", shape: "data" },
    { id: "neural-network", label: <>Network f<sub>θ</sub></>, eyebrow: "SHARED MODEL" },
    { id: "model-logits", label: <>logits z</>, eyebrow: "OUTPUT" },
    { id: "prediction-probabilities", label: <>p<sub>θ</sub>(y | x)</>, eyebrow: "SOFTMAX" },
    { id: taskIsB ? "task-b-loss" : "task-a-loss", label: <>L<sub>{taskIsB ? "B" : "A"}</sub></>, eyebrow: "TASK LOSS" },
    { id: taskIsB ? "task-b-gradient" : "task-a-gradient", label: <>∇L<sub>{taskIsB ? "B" : "A"}</sub></>, eyebrow: "BACKWARD" },
    { id: "optimizer", label: "Optimizer", eyebrow: "UPDATE" },
    { id: "current-parameters", label: <>θ<sub>current</sub></>, eyebrow: "PARAMETERS", shape: "parameter" },
  ];
  return <div className={`p10-runtime-track ${state.scene === "backward" || state.scene === "gradient" ? "is-reverse" : ""}`} aria-label="同一套模型的运行时数据流">
    {nodes.map((node, index) => <div className="p10-runtime-track__step" key={`${node.id}-${index}`}>
      <WorkbenchNode {...node} active={active(node.id)} selected={selected === node.id} onSelect={onSelect} />
      {index < nodes.length - 1 && <span className={`p10-flow-arrow ${state.scene === "backward" || state.scene === "gradient" ? "is-reverse" : ""}`} aria-hidden="true">{state.scene === "backward" || state.scene === "gradient" ? "←" : "→"}</span>}
    </div>)}
    {state.scene === "fisher" && <div className="p10-fisher-pass"><b>FISHER ESTIMATION</b><span>Backward ✓</span><span>optimizer.step() OFF</span><span>θ FIXED</span></div>}
  </div>;
}

function GaussianSketch() {
  return <div className="p10-gaussian" role="img" aria-label="参数空间中的局部 Gaussian 等高线，中心是 θA 星号">
    <svg viewBox="0 0 320 170" aria-hidden="true"><ellipse cx="160" cy="86" rx="126" ry="61" /><ellipse cx="160" cy="86" rx="91" ry="43" /><ellipse cx="160" cy="86" rx="55" ry="25" /><path d="M160 13V151M25 86H295" /><circle cx="160" cy="86" r="5" /></svg>
    <span className="p10-gaussian__center">θ<sub>A</sub>*</span><span className="p10-gaussian__label">local region · Mathematical View</span>
  </div>;
}

function MemoryFormula({ children }: { children: ReactNode }) {
  return <span className="p10-memory-chip__formula">{children}</span>;
}

function SceneVisual({ state, selected, onSelect, onComplete, summaryTriggerRef }: { state: AnimationState; selected?: RuntimeObjectId; onSelect: (id: RuntimeObjectId) => void; onComplete?: () => void; summaryTriggerRef?: RefObject<HTMLButtonElement> }) {
  const focus = state.focus;
  if (state.scene === "overview" || state.scene === "loop") {
    const isCompleted = state.scene === "loop";
    return <div className={`p10-scene p10-scene--overview ${isCompleted ? "p10-scene--completed" : ""}`}>
    <div className="p10-world-ribbon"><span>{isCompleted ? "STATE 18 · BOUNDARY → STORE → CONTINUE" : "WORLD VIEW · TRAINING TIME MOVES LEFT → RIGHT"}</span><small>one shared model · persistent task memory</small></div>
    <div className="p10-task-world">
      <div className="p10-task-world__task is-task-a"><span>01</span><b>Task A</b><small>ordinary training</small><i>D<sub>A</sub> → θ<sub>A</sub>*</i></div>
      <div className="p10-task-world__boundary"><span>CONSOLIDATE A</span><b>Anchor + Fisher</b><i>S<sub>A</sub></i></div>
      <div className="p10-task-world__task is-task-b"><span>02</span><b>Task B</b><small>new loss + old constraint</small><i>L<sub>B</sub> + Ω<sub>A</sub></i></div>
      <div className="p10-task-world__boundary"><span>{isCompleted ? "TASK B ENDED" : "CONSOLIDATE B"}</span><b>{isCompleted ? <>save θ<sub>B</sub>* → estimate diag F<sub>B</sub></> : "Anchor + Fisher"}</b><i>{isCompleted ? <>S<sub>B</sub> = (θ<sub>B</sub>*, F<sub>B</sub>)</> : <>S<sub>B</sub></>}</i></div>
      <div className="p10-task-world__task is-task-c" data-flow-node={isCompleted ? undefined : "task-data-c"}><span>03</span><b>Task C</b><small>{isCompleted ? <>D<sub>C</sub> arrives · same model continues</> : "continual loop"}</small><i>L<sub>C</sub>(θ) + Ω<sub>A</sub>(θ) + Ω<sub>B</sub>(θ)</i>{isCompleted && <em>conceptual continuation</em>}</div>
    </div>
    <div className="p10-memory-rail"><button type="button" data-flow-node="memory-persistent-memory" className={`p10-memory-rail__label p10-memory-rail__inspect ${selected === "persistent-memory" ? "is-selected" : ""}`} onClick={() => onSelect("persistent-memory")} aria-pressed={selected === "persistent-memory"}>PERSISTENT MEMORY RAIL</button><button type="button" data-flow-node="memory-task-state-a" className={`p10-memory-chip ${isCompleted ? "is-ready" : "is-pending"} ${selected === "task-state-a" ? "is-selected" : ""}`} onClick={() => onSelect("task-state-a")} aria-pressed={selected === "task-state-a"}><MemoryFormula>S<sub>A</sub>{isCompleted && <> · θ<sub>A</sub>* + F<sub>A</sub></>}</MemoryFormula>{!isCompleted && <small>after Task A</small>}</button>{isCompleted ? <button type="button" data-flow-node="memory-task-state-b" className={`p10-memory-chip is-ready is-task-b ${selected === "task-state-b" ? "is-selected" : ""}`} onClick={() => onSelect("task-state-b")} aria-pressed={selected === "task-state-b"}><MemoryFormula>S<sub>B</sub> · θ<sub>B</sub>* + F<sub>B</sub></MemoryFormula></button> : <button type="button" data-flow-node="memory-task-state-b" className={`p10-memory-chip is-pending ${selected === "task-state-b" ? "is-selected" : ""}`} onClick={() => onSelect("task-state-b")} aria-pressed={selected === "task-state-b"}><MemoryFormula>S<sub>B</sub></MemoryFormula><small>after Task B</small></button>}</div>
    {isCompleted && <div className="p10-world-complete"><span>Task C can read S<sub>A</sub> and S<sub>B</sub>; the shared model continues.</span><button ref={summaryTriggerRef} className="p10-world-complete__action" type="button" onClick={onComplete}>完成本次执行 / View Summary</button></div>}
  </div>;
  }
  if (state.scene === "posterior" || state.scene === "laplace") return <div className={`p10-scene p10-scene--math ${state.scene === "posterior" ? "is-posterior" : "is-laplace"}`}>
    <div className="p10-math-view-banner"><b>{state.scene === "laplace" ? "LOCAL APPROXIMATION" : "MATHEMATICAL VIEW"}</b><span>解释旧任务解附近的约束关系 · 不表示运行时储存完整 Posterior</span></div>
    <div className="p10-semantic-transition"><div className="p10-point-object"><b>θ<sub>A</sub>*</b><small>one parameter<br />point</small></div><span className="p10-semantic-arrow">→</span>{state.scene === "posterior" ? <div className="p10-posterior-cloud"><span>附近哪些参数状态<br />仍然合理？</span><b>Posterior</b><i>full local shape</i></div> : <><div className="p10-posterior-cloud is-quiet"><b>full Posterior</b></div><span className="p10-semantic-arrow">→</span><GaussianSketch /></>}</div>
    {state.scene === "laplace" && <div className="p10-math-legend"><span>中心 θ<sub>A</sub>*</span><span>宽度 Σ<sub>A</sub></span><span>局部精度 Σ<sub>A</sub><sup>−1</sup></span></div>}
  </div>;
  if (state.scene === "data") return <div className="p10-scene p10-scene--data">
    <div className="p10-sample-stack"><b>D<sub>A</sub></b><small>Task A Dataset</small><div className="p10-sample-pixels" aria-label="教学用样本像素示意"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span>x<sub>n</sub>, y<sub>n</sub> → batch</span></div><span className="p10-large-arrow">→</span><WorkbenchNode id="neural-network" label={<>Network f<sub>θ</sub></>} eyebrow="SAME MODEL" active selected={selected === "neural-network"} onSelect={onSelect} /><div className="p10-sample-note"><b>Inspect the input</b><span>Dataset → Batch → Sample</span><button type="button" onClick={() => onSelect("task-a-batch")}>View a representative batch</button></div>
  </div>;
  if (state.scene === "forward" || state.scene === "backward" || state.scene === "update" || state.scene === "compression" || state.scene === "return") return <div className={`p10-scene p10-scene--training p10-scene--${state.scene}`}>
    <div className="p10-network-detail"><div className="p10-network-detail__heading"><b>ILLUSTRATIVE CNN-LIKE CLASSIFIER</b><span>example architecture</span></div><div className="p10-network-layers"><span>Input x</span><i>→</i><button onClick={() => onSelect("current-parameters")}>Conv 1<small>θ¹</small></button><i>→</i><span>ReLU</span><i>→</i><button onClick={() => onSelect("current-parameters")}>Conv 2<small>θ²</small></button><i>→</i><span>Pool · Flatten</span><i>→</i><button onClick={() => onSelect("current-parameters")}>FC<small>θ³</small></button><i>→</i><button onClick={() => onSelect("current-parameters")}>Output<small>θ⁴</small></button></div></div>
    <LayerBlocks focus={focus} selected={selected} onSelect={onSelect} />
    <div className="p10-training-status"><span>FORWARD <b>{state.scene === "compression" ? "REPEATED" : state.scene === "forward" ? "COMPUTING" : "DONE"}</b></span><span>BACKWARD <b>{state.scene === "compression" ? "REPEATED" : state.scene === "backward" ? "GRADIENT FLOWS ←" : state.scene === "update" ? "GRADIENT READY" : "—"}</b></span><span>OPTIMIZER <b>{state.scene === "compression" ? "MULTIPLE STEP() UPDATES" : state.scene === "update" ? "STEP() · UPDATE θ" : "WAITING"}</b></span><span>PARAMETERS <b>{state.scene === "compression" ? "θ⁽⁰⁾ → θ_A*" : state.scene === "update" ? "θ 0.412 → 0.420" : "SHAPE HELD FIXED"}</b></span>{state.scene === "compression" && <small>Many mini-batch updates are compressed into this timeline step.</small>}{state.scene === "update" && <small>Representative parameter · illustrative mechanism values</small>}</div>
    {state.scene === "compression" && <div className="p10-iteration-pulse"><b>batch 1 → update</b><span>·</span><b>batch 2 → update</b><span>·</span><b>batch 3 → update</b><span className="p10-pulse-dots">···</span><strong>θ<sup>(0)</sup> → θ<sub>A</sub>*</strong></div>}
  </div>;
  if (state.scene === "probability") return <div className="p10-scene p10-scene--probability"><div className="p10-probability-chain"><div className="p10-score-card"><span>LOGITS</span><b>z = [1.3, 0.4, −0.2]</b><small>un-normalized scores</small></div><span className="p10-large-arrow">→</span><div className="p10-softmax-card"><span>SOFTMAX</span><b>[0.61, 0.25, 0.14]</b><small>class probabilities</small></div><span className="p10-large-arrow">→</span><div className="p10-loss-card"><span>NEGATIVE LOG PROBABILITY</span><b>−log p<sub>θ</sub>(y|x)</b><small>correct label → L<sub>A</sub></small></div></div><div className="p10-probability-note"><b>Optional likelihood expansion</b><span>p(D<sub>A</sub>|θ) = ∏<sub>n</sub> p<sub>θ</sub>(y<sub>n</sub>|x<sub>n</sub>)</span><small>Each correct-label probability contributes to the batch loss.</small></div></div>;
  if (state.scene === "boundary") return <div className="p10-scene p10-scene--boundary"><div className="p10-boundary-stamp"><span>TASK A ENDED</span><b>θ = θ<sub>A</sub>*</b><small>optimizer stopped</small></div><div className="p10-boundary-question"><span className="p10-muted-answer">θ<sub>A</sub>* tells us <b>where Task A ended</b></span><div className="p10-question-divider" /><span>θ<sub>A</sub>* does not tell us <b>which nearby directions are sensitive</b></span></div><div className="p10-boundary-timeline"><span>Task A training</span><i /><b>CONSOLIDATION</b><i /><span>Task B</span></div></div>;
  if (state.scene === "anchor") return <div className="p10-scene p10-scene--anchor"><div className="p10-anchor-clone"><div><span>CURRENT θ</span><b>Trainable</b><small>continues changing</small></div><span className="p10-clone-branch">clone →</span><div className="p10-anchor-copy"><span>STORED θ<sub>A</sub>*</span><b>Fixed snapshot</b><small>remains unchanged</small></div></div><LayerBlocks focus={focus} selected={selected} onSelect={onSelect} includeAnchor /></div>;
  if (state.scene === "fisher") return <div className="p10-scene p10-scene--fisher"><div className="p10-fisher-flow"><div className="p10-fixed-sample"><span>Task A sample</span><b>(x<sub>n</sub>, y<sub>n</sub>)</b></div><span>→</span><div className="p10-fixed-sample"><span>log-likelihood</span><b>log p<sub>θA*</sub>(y|x)</b></div><span>→</span><div className="p10-fisher-square"><span>gradient</span><b>g<sub>i</sub> → g<sub>i</sub><sup>2</sup></b></div><span>→</span><div className="p10-fisher-accumulator"><span>ACCUMULATOR</span><b>Σ g<sub>i</sub><sup>2</sup> / N</b></div></div><LayerBlocks focus={focus} selected={selected} onSelect={onSelect} includeFisher /><div className="p10-fisher-accuracy"><b>PARAMETERS FIXED</b><span>·</span><b>GRADIENT ENABLED</b><span>·</span><b>optimizer.step() OFF</b></div></div>;
  if (state.scene === "memory") return <div className="p10-scene p10-scene--memory"><div className="p10-memory-explain"><span>Task A data leaves the active pipeline</span><b>θ<sub>A</sub>* + F<sub>A</sub> → S<sub>A</sub></b><small>Anchor position + parameter-wise local sensitivity</small></div><div className="p10-memory-rail p10-memory-rail--focused"><button type="button" data-flow-node="memory-persistent-memory" className="p10-memory-rail__label p10-memory-rail__inspect" onClick={() => onSelect("persistent-memory")}>PERSISTENT TASK MEMORY</button><button type="button" data-flow-node="memory-task-state-a" className={`p10-memory-chip is-ready ${selected === "task-state-a" ? "is-selected" : ""}`} onClick={() => onSelect("task-state-a")} aria-pressed={selected === "task-state-a"}><MemoryFormula>S<sub>A</sub></MemoryFormula><small><MemoryFormula>θ<sub>A</sub>* · F<sub>A</sub></MemoryFormula></small></button><button type="button" data-flow-node="memory-task-state-b" className={`p10-memory-chip is-pending ${selected === "task-state-b" ? "is-selected" : ""}`} onClick={() => onSelect("task-state-b")} aria-pressed={selected === "task-state-b"}><MemoryFormula>S<sub>B</sub></MemoryFormula><small>pending</small></button></div></div>;
  if (state.scene === "task-b") return <div className="p10-scene p10-scene--task-b"><div className="p10-task-b-path"><div className="p10-task-b-source"><span>TASK B DATA</span><b>D<sub>B</sub></b><small>new batch</small></div><span className="p10-large-arrow">→</span><div className="p10-task-b-model"><span>SAME MODEL</span><b>θ<sub>start,B</sub> = θ<sub>A</sub>*</b><small>continue, do not reinitialize</small></div><span className="p10-large-arrow">→</span><div className="p10-task-b-loss"><span>TASK B OBJECTIVE</span><b>L<sub>B</sub></b><small>new task data</small></div></div><div className="p10-memory-rail"><span className="p10-memory-rail__label">READ OLD STATE</span><button className="p10-memory-chip is-ready" onClick={() => onSelect("persistent-memory")}><MemoryFormula>S<sub>A</sub> → θ<sub>A</sub>* + F<sub>A</sub></MemoryFormula></button></div></div>;
  if (state.scene === "objective") return <div className="p10-scene p10-scene--objective"><div className="p10-objective-inputs"><button type="button" className="p10-objective-input is-new" onClick={() => onSelect("task-b-loss")}><span>NEW TASK</span><b>L<sub>B</sub></b><small>from D<sub>B</sub></small></button><span className="p10-objective-plus">+</span><button type="button" className="p10-objective-input is-old" onClick={() => onSelect("ewc-penalty")}><span>OLD TASK CONSTRAINT</span><b>λ Ω<sub>A</sub></b><small>from S<sub>A</sub>=(θ<sub>A</sub>*,F<sub>A</sub>)</small></button><span className="p10-objective-equals">=</span><div className="p10-objective-result">L<sub>total</sub></div></div><div className="p10-objective-mapping"><span><b>F<sub>A,i</sub></b> parameter-specific weight</span><span><b>λ</b> global constraint scale</span><span><b>θ<sub>A</sub>*</b> fixed stored anchor</span><span><b>θ</b> current trainable value</span></div><LayerBlocks focus={focus} selected={selected} onSelect={onSelect} includeFisher includeAnchor /></div>;
  if (state.scene === "gradient") return <div className="p10-scene p10-scene--gradient"><div className="p10-gradient-junction"><button type="button" className="p10-gradient-input is-task" onClick={() => onSelect("task-b-gradient")}><span>TASK B</span><b>g<sub>B</sub></b><small>−0.20</small></button><span className="p10-junction-branch">↘</span><div className="p10-junction-core">Σ</div><span className="p10-junction-branch">↗</span><button type="button" className="p10-gradient-input is-ewc" onClick={() => onSelect("ewc-gradient")}><span>EWC</span><b>g<sub>EWC</sub></b><small>+0.16</small></button><span className="p10-junction-arrow">→</span><button type="button" className="p10-gradient-total" onClick={() => onSelect("total-gradient")}><span>TOTAL GRADIENT</span><b>g<sub>total</sub></b><small>−0.04</small></button><span className="p10-junction-arrow">→</span><button type="button" className="p10-gradient-optimizer" onClick={() => onSelect("optimizer")}><span>optimizer.step()</span><b>θ updates</b></button></div><div className="p10-parameter-inspectors"><article><b>High-Fisher parameter · θ<sub>i</sub></b><dl><div><dt>Task-B gradient</dt><dd>−0.20</dd></div><div><dt>Anchor displacement</dt><dd>+0.10</dd></div><div><dt>F<sub>A,i</sub> · λ</dt><dd>8.0 · 0.2</dd></div><div><dt>EWC gradient</dt><dd>+0.16</dd></div><div><dt>Total gradient</dt><dd>−0.04</dd></div></dl></article><article><b>Low-Fisher parameter · θ<sub>j</sub></b><dl><div><dt>Task-B gradient</dt><dd>−0.20</dd></div><div><dt>EWC gradient</dt><dd>+0.01</dd></div><div><dt>Total gradient</dt><dd>−0.19</dd></div></dl></article></div></div>;
  return <div className="p10-scene p10-scene--loop" />;
}

function BoardPanelTitle({ number, title, subtitle, badge }: { number: string; title: string; subtitle: string; badge?: string }) {
  return <div className="p10-panel__title">
    <span className="p10-panel__number">{number}</span>
    <div><h2>{title}</h2><p>{subtitle}</p></div>
    {badge && <span className="p10-panel__badge">{badge}</span>}
  </div>;
}

type IllustrationTask = "a" | "b" | "c";
const CLASS_EXAMPLES: Record<IllustrationTask, { label: string; pixels: string }[]> = {
  a: [{ label: "A", pixels: "0110111111110110" }, { label: "B", pixels: "0100111001001110" }, { label: "C", pixels: "1111001111001111" }],
  b: [{ label: "A", pixels: "1100101010100011" }, { label: "B", pixels: "1111100110011110" }, { label: "C", pixels: "0110100111101011" }],
  c: [{ label: "A", pixels: "1001011001101001" }, { label: "B", pixels: "1010101010101010" }, { label: "C", pixels: "0101010110101010" }],
};

function SampleMatrix({ task }: { task: IllustrationTask }) {
  return <div className={`p10-sample-matrix p10-sample-matrix--${task}`} aria-label="示意样本像素图">
    {Array.from({ length: 32 }, (_, index) => <i className={CLASS_EXAMPLES[task][0].pixels[index % 16] === "1" ? "is-on" : ""} key={index} />)}
  </div>;
}

function TaskExampleGrid({ task }: { task: "a" | "b" }) {
  return <div className={`p10-task-examples p10-task-examples--${task}`} role="img" aria-label={`Task ${task.toUpperCase()} synthetic illustrative samples for output classes A, B and C`}>
    {CLASS_EXAMPLES[task].map((example) => <span key={example.label} aria-hidden="true"><span className="p10-task-example__pixels">{Array.from(example.pixels, (pixel, index) => <i className={pixel === "1" ? "is-on" : ""} key={index} />)}</span><b>Class {example.label}</b></span>)}
  </div>;
}

function TaskDataCard({ task, status, active, selected, onSelect }: {
  task: "a" | "b";
  status: string;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const isA = task === "a";
  return <button type="button" data-flow-node={`task-data-${task}`} data-p10-transition-id={`task-${task}-data`} className={`p10-data-card ${isA ? "is-task-a" : "is-task-b"} ${active ? "is-active" : ""} ${selected ? "is-selected" : ""}`} onClick={onSelect} aria-pressed={selected}>
    <span className="p10-data-card__head"><b>Task {isA ? "A" : "B"} Data</b><i>{isA ? "D_A" : "D_B"}</i></span>
    <span className="p10-data-card__dataset">{isA ? "Illustrative samples · 3 classes" : "New illustrative samples"}</span>
    <small>{isA ? "旧任务样本" : "新任务样本"} · {status}</small>
    <TaskExampleGrid task={task} />
    <ul className="p10-data-card__facts" aria-label={`Task ${isA ? "A" : "B"} illustrative task details`}>
      <li><b>类别</b><span>A / B / C · 3 类</span></li>
      <li><b>任务</b><span>{isA ? "illustrative classification" : "new input patterns · same output space"}</span></li>
    </ul>
    <span className="p10-data-card__inspect">Inspect data ↗</span>
  </button>;
}

function TaskDataPanel({ state, activeIndex, selected, onSelect }: {
  state: AnimationState;
  activeIndex: number;
  selected?: RuntimeObjectId;
  onSelect: (id: RuntimeObjectId) => void;
}) {
  const taskAStatus = activeIndex === 0 ? "预览 · 尚未开始" : state.scene === "fisher" ? "Fisher estimation example" : activeIndex < 7 ? "当前任务数据" : "旧任务来源";
  const taskBStatus = activeIndex < 14 ? "等待 Task B" : activeIndex < 17 ? "当前任务数据" : "训练已完成";
  const showTaskC = activeIndex >= 17;
  return <section className="p10-panel p10-data-panel" aria-label="任务与数据区">
    <BoardPanelTitle number="1" title="任务 / 数据区" subtitle="Illustrative tasks · shared 3-class output space" />
    <div className={`p10-data-cards ${showTaskC ? "p10-data-cards--with-task-c" : ""}`}>
      <TaskDataCard task="a" status={taskAStatus} active={activeIndex > 0 && activeIndex < 7 || state.scene === "fisher"} selected={selected === "task-a-data"} onSelect={() => onSelect("task-a-data")} />
      <TaskDataCard task="b" status={taskBStatus} active={activeIndex >= 14 && activeIndex < 17} selected={selected === "task-b-data"} onSelect={() => onSelect("task-b-data")} />
      {showTaskC && <button type="button" data-flow-node="task-data-c" data-p10-transition-id="task-c-data" className={`p10-task-c-current ${selected === "task-c-data" ? "is-selected" : ""}`} onClick={() => onSelect("task-c-data")} aria-pressed={selected === "task-c-data"}>
        <span>Task C · D<sub>C</sub></span><b>CURRENT INPUT</b><small>数据已到达 · 同一模型可读取 S<sub>A</sub> / S<sub>B</sub> 并继续；未绘制 Task C 数值更新</small>
      </button>}
    </div>
    <p className="p10-panel-note">本页数值与示意网络用于说明 EWC 运行机制，不代表论文实测结果。</p>
  </section>;
}

function MemoryPanel({ activeIndex, selected, onSelect }: {
  activeIndex: number;
  selected?: RuntimeObjectId;
  onSelect: (id: RuntimeObjectId) => void;
}) {
  const items: { id: RuntimeObjectId; symbol: ReactNode; title: string; detail: ReactNode; ready: boolean }[] = [
    { id: "task-a-anchor", symbol: <>θ<sub>A</sub>*</>, title: "Task A 参数锚点", detail: "Task A 结束时复制 · 后续保持固定", ready: activeIndex >= 11 },
    { id: "task-a-fisher", symbol: <>F<sub>A</sub></>, title: "对角 Fisher", detail: "逐参数敏感性近似 · 参数不更新", ready: activeIndex >= 12 },
    { id: "task-state-a", symbol: <>S<sub>A</sub></>, title: "Task A 状态", detail: <><span>θ<sub>A</sub>* + F<sub>A</sub></span> · Task B 读取</>, ready: activeIndex >= 13 },
  ];
  return <section data-p10-transition-id="persistent-memory" className="p10-panel p10-memory-panel" aria-label="持久记忆区">
    <BoardPanelTitle number="3" title="持久记忆区" subtitle="Persistent Memory · Task A 保存，Task B 读取" badge="MEMORY RAIL" />
    <div className="p10-memory-list">
      {items.map((item) => <button key={item.id} type="button" data-flow-node={`memory-${item.id}`} data-p10-transition-id={item.id} className={`p10-memory-item ${item.ready ? "is-ready" : "is-pending"} ${selected === item.id ? "is-selected" : ""}`} onClick={() => onSelect(item.id)} aria-pressed={selected === item.id}>
        <span className="p10-memory-item__symbol">{item.symbol}</span>
        <span className="p10-memory-item__copy"><b>{item.title}</b><small>{item.detail}</small></span>
        <span className="p10-memory-item__status">{item.ready ? "已保存" : "待保存"}</span>
      </button>)}
      <button type="button" data-flow-node="memory-task-state-b" data-p10-transition-id="task-state-b" className={`p10-memory-item p10-memory-item--next ${activeIndex >= 17 ? "is-ready" : "is-pending"} ${selected === "task-state-b" ? "is-selected" : ""}`} onClick={() => onSelect("task-state-b")} aria-pressed={selected === "task-state-b"}>
        <span className="p10-memory-item__symbol">S<sub>B</sub></span>
        <span className="p10-memory-item__copy"><b>Task B 状态</b><small>θ<sub>B</sub>* + F<sub>B</sub> · Task C 可继续读取</small></span>
        <span className="p10-memory-item__status">{activeIndex >= 17 ? "已形成" : "Task B 后"}</span>
      </button>
    </div>
  </section>;
}

function FlowArrow({ reverse = false, flowing = false, motionKey = "flow" }: { reverse?: boolean; flowing?: boolean; motionKey?: string }) {
  const travelPath = reverse ? "M 46 8 H 5" : "M 2 8 H 43";
  return <svg className={`p10-flow-line ${reverse ? "is-reverse" : ""}`} viewBox="0 0 48 16" role="presentation" aria-hidden="true">
    <path d={reverse ? "M46 8H4m8-6L4 8l8 6" : "M2 8h42m-8-6 8 6-8 6"} />
    {flowing && <circle key={motionKey} className="p10-flow-line__traveler" cx={reverse ? 46 : 2} cy="8" r="2.3">
      <animateMotion dur="2480ms" fill="freeze" path={travelPath} />
    </circle>}
  </svg>;
}

type FlowGuideEdge = { id: string; path: string; tone: "data" | "data-task-b" | "data-task-c" | "zoom" | "formula" | "save" | "read"; active: boolean };

function FlowGuideLayer({ state, activeIndex, flowingEdgeIds }: { state: AnimationState; activeIndex: number; flowingEdgeIds: string[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geometry, setGeometry] = useState<{ width: number; height: number; edges: FlowGuideEdge[] }>({ width: 0, height: 0, edges: [] });
  const taskCue = activeIndex < 17 ? `Task ${activeIndex >= 14 ? "B" : "A"} Data → Runtime Input` : "Task B 完成后进入 Task C";
  const memoryCue = activeIndex === 11 ? "保存 Task A 参数锚点" : activeIndex === 12 ? "保存 Fisher 估计" : activeIndex === 13 ? "合并为 Task A 持久状态" : activeIndex >= 14 && activeIndex < 17 ? "读取 Task A 状态用于 EWC" : activeIndex === 17 ? "保存 Task B 状态" : "当前步骤不发生记忆读写";

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const grid = svg?.parentElement;
    if (!grid) return;

    const measure = () => {
      const bounds = grid.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const findNode = (id: string) => grid.querySelector<HTMLElement>(`[data-flow-node="${id}"]`);
      const box = (element: HTMLElement | null) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left - bounds.left,
          right: rect.right - bounds.left,
          top: rect.top - bounds.top,
          bottom: rect.bottom - bounds.top,
          midY: rect.top - bounds.top + rect.height / 2,
          midX: rect.left - bounds.left + rect.width / 2,
        };
      };
      const bridge = (from: NonNullable<ReturnType<typeof box>>, to: NonNullable<ReturnType<typeof box>>, reverse = false, horizontalEnd = false, startYOffset = 0) => {
        const startX = reverse ? from.left : from.right;
        const endX = reverse ? to.right : to.left;
        const direction = Math.sign(endX - startX) || 1;
        const span = Math.abs(endX - startX);
        const endStub = horizontalEnd ? Math.min(26, span * 0.42, Math.max(8, span * 0.34)) : 0;
        const curveEndX = endX - direction * endStub;
        const curveSpan = Math.abs(curveEndX - startX);
        const bend = Math.max(16, Math.min(46, curveSpan * 0.52));
        const startY = from.midY + startYOffset;
        const endY = to.midY;
        const startBend = horizontalEnd ? Math.min(bend, curveSpan * 0.42) : bend;
        const endBend = horizontalEnd ? Math.min(bend, curveSpan * 0.38) : bend;
        const curve = `M ${startX} ${startY} C ${startX + direction * startBend} ${startY}, ${curveEndX - direction * endBend} ${endY}, ${curveEndX} ${endY}`;
        return horizontalEnd ? `${curve} L ${endX} ${endY}` : curve;
      };
      const edges: FlowGuideEdge[] = [];
      const addBridge = (id: string, fromId: string, toId: string, tone: FlowGuideEdge["tone"], active: boolean, reverse = false, horizontalEnd = false, startYOffset = 0) => {
        const from = box(findNode(fromId));
        const to = box(findNode(toId));
        if (from && to) edges.push({ id, path: bridge(from, to, reverse, horizontalEnd, startYOffset), tone, active });
      };

      if (activeIndex < 17) {
        const task = activeIndex >= 14 ? "b" : "a";
        addBridge("data-input", `task-data-${task}`, "runtime-input", task === "b" ? "data-task-b" : "data", ["data", "forward", "probability", "compression", "task-b", "fisher"].includes(state.scene), false, false, task === "a" ? 28 : 0);
      } else {
        addBridge("data-input-task-c", "task-data-c", "runtime-input", "data-task-c", true);
      }

      const zoomSource = box(findNode("zoom-source"));
      const zoomTarget = box(findNode("zoom-target"));
      if (zoomSource && zoomTarget) {
        const startX = zoomSource.right - 2;
        const startY = zoomSource.top + Math.min(9, zoomSource.bottom - zoomSource.top);
        const endX = zoomTarget.left + 2;
        const endY = zoomTarget.top + Math.min(25, zoomTarget.bottom - zoomTarget.top);
        const span = Math.max(20, endX - startX);
        const lift = Math.min(38, Math.max(23, span * 0.12));
        edges.push({
          id: "feature-zoom",
          path: `M ${startX} ${startY} C ${startX + span * 0.28} ${startY - lift}, ${endX - span * 0.24} ${endY - lift * 0.78}, ${endX} ${endY}`,
          tone: "zoom",
          active: true,
        });
      }

      addBridge("runtime-formula", "runtime-step", "math-link", "formula", Boolean(state.math));

      if (activeIndex === 11) addBridge("save-anchor", "runtime-memory-port", "memory-task-a-anchor", "save", true, true, true);
      else if (activeIndex === 12) addBridge("save-fisher", "runtime-memory-port", "memory-task-a-fisher", "save", true, true, true);
      else if (activeIndex === 13) addBridge("save-task-state-a", "runtime-memory-port", "memory-task-state-a", "save", true, true, true);
      else if (activeIndex >= 14 && activeIndex <= 16) addBridge("read-task-state-a", "memory-task-state-a", "runtime-memory-port", "read", true, false, true);
      else if (activeIndex === 17) addBridge("save-task-state-b", "runtime-memory-port", "memory-task-state-b", "save", true, true, true);

      setGeometry((previous) => previous.width === bounds.width && previous.height === bounds.height && JSON.stringify(previous.edges) === JSON.stringify(edges)
        ? previous
        : { width: bounds.width, height: bounds.height, edges });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    grid.querySelectorAll<HTMLElement>("[data-flow-node]").forEach((node) => observer.observe(node));
    window.addEventListener("resize", measure);
    const frame = window.requestAnimationFrame(measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.cancelAnimationFrame(frame);
    };
  }, [activeIndex, state.id, state.scene, state.math]);

  if (!geometry.width || !geometry.height) return <svg ref={svgRef} className="p10-board-flow" aria-hidden="true" />;
  return <svg ref={svgRef} className="p10-board-flow" viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={`流程引导：${taskCue}；Conv 2 特征层关联局部放大视图；当前运行步骤关联公式视图；${memoryCue}`} focusable="false">
    <defs>
      <marker id="p10-flow-arrow-ink" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 7 4 1 7" /></marker>
      <marker id="p10-flow-arrow-orange" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 7 4 1 7" /></marker>
      <marker id="p10-flow-arrow-blue" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 7 4 1 7" /></marker>
      <marker id="p10-flow-arrow-green" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 7 4 1 7" /></marker>
    </defs>
    {geometry.edges.map((edge) => <g key={edge.id}>
      <path className={`p10-board-flow__edge is-${edge.tone} ${edge.active ? "is-active" : "is-muted"}`} d={edge.path} markerEnd={`url(#p10-flow-arrow-${edge.tone === "read" ? "green" : edge.tone === "data-task-c" ? "blue" : edge.tone === "zoom" || edge.tone === "save" || edge.tone === "data-task-b" ? "orange" : "ink"})`} />
      {edge.active && flowingEdgeIds.includes(edge.id) && <circle key={`${state.id}-${edge.id}`} className={`p10-board-flow__traveler is-${edge.tone}`} r="4">
        <animateMotion dur="2800ms" calcMode="spline" keyTimes="0;1" keySplines="0.2 0 0.2 1" fill="freeze" path={edge.path} />
      </circle>}
    </g>)}
  </svg>;
}

function NeuralWorkbench({ state, selected, onSelect }: { state: AnimationState; selected?: RuntimeObjectId; onSelect: (id: RuntimeObjectId) => void }) {
  const hasFocus = (...ids: RuntimeObjectId[]) => ids.some((id) => state.focus.includes(id) || selected === id);
  const reverse = state.scene === "backward" || state.scene === "gradient";
  const flowing = FLOWING_NETWORK_SCENES.has(state.scene);
  const inputTask: IllustrationTask = state.phase === "continual" ? "c" : state.phase === "task-b" ? "b" : "a";
  const dataId: RuntimeObjectId = inputTask === "c" ? "task-c-data" : inputTask === "b" ? "task-b-data" : "task-a-data";
  return <div className={`p10-neural-workbench ${reverse ? "is-backward" : ""}`} aria-label="交互式神经网络工作台">
    <div className="p10-neural-workbench__flow">
      <button type="button" data-flow-node="runtime-input" data-p10-transition-id={dataId} className={`p10-net-node p10-net-node--input ${hasFocus(dataId) ? "is-active" : ""}`} onClick={() => onSelect(dataId)} aria-pressed={selected === dataId}>
        <span className="p10-net-node__eyebrow">INPUT · xₙ</span><SampleMatrix task={inputTask} /><b>图像 / 数据</b><small>Task {inputTask.toUpperCase()} batch</small>
      </button>
      <FlowArrow reverse={reverse} flowing={flowing} motionKey={state.id} />
      <div data-p10-transition-id="neural-network current-parameters" className="p10-feature-group">
        <span className="p10-net-node__eyebrow">CNN FEATURE EXTRACTION</span>
        <button type="button" className={`p10-feature-block ${hasFocus("neural-network", "current-parameters") ? "is-active" : ""}`} onClick={() => onSelect("current-parameters")} aria-pressed={selected === "current-parameters"}>
          <span className="p10-feature-stack"><i /><i /><i /></span><b>Conv 1</b><small>θ¹ · 3×3</small>
        </button>
        <span className="p10-feature-link" aria-hidden="true" />
        <span className="p10-feature-op">ReLU</span>
        <span className="p10-feature-link" aria-hidden="true" />
        <button type="button" data-flow-node="zoom-source" className={`p10-feature-block p10-feature-block--second ${hasFocus("neural-network", "current-parameters") ? "is-active" : ""}`} onClick={() => onSelect("current-parameters")} aria-pressed={selected === "current-parameters"}>
          <span className="p10-feature-stack"><i /><i /><i /></span><b>Conv 2</b><small>θ² · 3×3</small>
        </button>
        <span className="p10-feature-link" aria-hidden="true" />
        <span className="p10-feature-op">Pool</span>
      </div>
      <FlowArrow reverse={reverse} flowing={flowing} motionKey={state.id} />
      <div data-p10-transition-id="neural-network current-parameters" className={`p10-net-node p10-net-node--fc ${hasFocus("neural-network", "current-parameters") ? "is-active" : ""}`}>
        <span className="p10-net-node__eyebrow">CLASSIFICATION</span>
        <button type="button" onClick={() => onSelect("current-parameters")} aria-pressed={selected === "current-parameters"}><span className="p10-fc-bars"><i /><i /><i /></span><b>FC hidden</b><small>θ³</small></button>
        <small>Flatten → logits z</small>
      </div>
      <FlowArrow reverse={reverse} flowing={flowing} motionKey={state.id} />
      <button type="button" data-p10-transition-id="model-logits prediction-probabilities task-a-loss task-b-loss" className={`p10-net-node p10-net-node--output ${hasFocus("model-logits", "prediction-probabilities", "task-a-loss", "task-b-loss") ? "is-active" : ""}`} onClick={() => onSelect("prediction-probabilities")} aria-pressed={selected === "prediction-probabilities"}>
        <span className="p10-net-node__eyebrow">OUTPUT · θ⁴</span>
        <span className="p10-probability-bars" aria-label="Softmax probabilities: A 0.61, B 0.25, C 0.14"><i><b>A</b><em style={{ width: "61%" }} /></i><i><b>B</b><em style={{ width: "25%" }} /></i><i><b>C</b><em style={{ width: "14%" }} /></i></span>
        <small>p<sub>θ</sub>(y|x) · 3-class output</small>
      </button>
    </div>
    <div data-flow-node="zoom-target" className="p10-neural-workbench__zoom" aria-label="卷积层局部放大示意">
      <div className="p10-zoom-heading"><b>层内放大视图</b><span>FEATURE MAP · 示意</span></div>
      <div className="p10-zoom-flow"><span className="p10-zoom-maps"><i /><i /><i /></span><b>Conv 2</b><i className="p10-zoom-arrow">→</i><span className="p10-zoom-op">ReLU</span><i className="p10-zoom-arrow">→</i><span className="p10-zoom-pool" /></div>
      <small>卷积 → 激活 → 池化</small>
    </div>
  </div>;
}

function ParameterStrip({ state, activeIndex, selected, onSelect }: { state: AnimationState; activeIndex: number; selected?: RuntimeObjectId; onSelect: (id: RuntimeObjectId) => void }) {
  const showAnchor = state.focus.includes("task-a-anchor") || state.scene === "fisher" || state.scene === "memory" || state.scene === "objective" || state.scene === "gradient";
  const showFisher = state.focus.includes("task-a-fisher") || state.scene === "memory" || state.scene === "objective" || state.scene === "fisher";
  const memoryFlow = activeIndex >= 11 && activeIndex <= 17;
  const memoryFlowTone = activeIndex >= 14 && activeIndex <= 16 ? "is-read" : "is-save";
  const transitionIds = ["current-parameters", showAnchor ? "task-a-anchor" : "", showFisher ? "task-a-fisher" : ""].filter(Boolean).join(" ");
  return <div data-p10-transition-id={transitionIds} className="p10-parameter-strip" data-flow-node="runtime-parameters" aria-label="模型参数与存储参数">
    {memoryFlow && <span data-flow-node="runtime-memory-port" className={`p10-parameter-strip__memory-port ${memoryFlowTone}`} aria-hidden="true" />}
    <span className="p10-parameter-strip__label">模型参数（可交互）<small>四组权重参数 · EWC 逐参数作用</small></span>
    {[
      { label: "Conv 1 · θ¹", detail: "weights", accessibleLabel: "Conv 1 weights, parameter block theta one" },
      { label: "Conv 2 · θ²", detail: "weights", accessibleLabel: "Conv 2 weights, parameter block theta two" },
      { label: "FC hidden · θ³", detail: "weights", accessibleLabel: "Fully connected hidden weights, parameter block theta three" },
      { label: "Output · θ⁴", detail: "weights", accessibleLabel: "Output weights, parameter block theta four" },
    ].map((item) => <button key={item.label} type="button" className={`p10-parameter-chip ${selected === "current-parameters" ? "is-selected" : ""}`} onClick={() => onSelect("current-parameters")} aria-pressed={selected === "current-parameters"} aria-label={item.accessibleLabel}>
      <b>{item.label}</b><small>{item.detail}</small><span aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
    </button>)}
    {showAnchor && <button type="button" className="p10-parameter-chip p10-parameter-chip--anchor" onClick={() => onSelect("task-a-anchor")} aria-pressed={selected === "task-a-anchor"}><b>固定 Anchor θ_A*</b><small>Task A snapshot</small></button>}
    {showFisher && <button type="button" className="p10-parameter-chip p10-parameter-chip--fisher" onClick={() => onSelect("task-a-fisher")} aria-pressed={selected === "task-a-fisher"}><b>Fisher F_A</b><small>参数位置对齐</small></button>}
  </div>;
}

function MathArea({ state, expandedFormula, onExpandedFormulaChange, onSelect }: {
  state: AnimationState;
  expandedFormula: boolean;
  onExpandedFormulaChange: (value: boolean) => void;
  onSelect: (id: RuntimeObjectId) => void;
}) {
  const relevant = (states: MathId[]) => state.math !== undefined && states.includes(state.math);
  const referenceClass = (isRelevant: boolean) => isRelevant ? "is-related" : "is-muted";
  return <section className="p10-panel p10-math-panel" aria-label="数学与公式区" data-math-focus={state.math ?? "none"}>
    <BoardPanelTitle number="2" title="数学视图" subtitle="Mathematical / Formula Area · 与当前运行状态关联" />
    <div className="p10-math-live" data-flow-node="math-link" data-p10-transition-id="math">
      <div className="p10-math-live__heading"><b>{state.math ? "当前状态关联公式" : "当前阶段的数学关系"}</b>{state.math && <button type="button" aria-pressed={expandedFormula} onClick={() => onExpandedFormulaChange(!expandedFormula)}>{expandedFormula ? "收起" : "展开"}</button>}</div>
      {state.math ? <Formula kind={state.math} expanded={expandedFormula} onSelect={onSelect} /> : <p>{state.scene === "fisher" ? "参数固定 · 梯度平方累积 · 不执行 optimizer.step()" : state.scene === "gradient" ? "g_B + g_EWC → g_total → optimizer.step()" : "当前参数 θ 在共享网络中参与前向、Loss 与更新。"}</p>}
    </div>
    <div className="p10-math-principles" aria-label="先验、似然与后验关系">
      <MathReference id="p_theta" className={referenceClass(relevant(["posterior"]))}><b>先验分布</b><span>p(θ)</span></MathReference>
      <MathReference id="p_D_given_theta" className={referenceClass(relevant(["probability", "posterior"]))}><b>条件似然</b><span>p(D_A|θ) = ∏ pθ(yₙ|xₙ)</span></MathReference>
      <MathReference id="task_a_posterior" className={referenceClass(relevant(["posterior"]))}><b>后验分布</b><span>p(θ|D_A) ∝ p(D_A|θ)p(θ)</span></MathReference>
    </div>
    <div className="p10-math-supporting">
      <MathReference id="laplace_approximation" className={referenceClass(relevant(["laplace"]))}><b>Laplace 局部近似</b><span>p(θ|D_A) ≈ N(θ_A*, Σ_A)</span></MathReference>
      <MathReference id="fisher_information" className={referenceClass(relevant(["fisher"]))}><b>Diagonal Fisher · 对角 Fisher</b><span>F_A,i ≈ 1/N Σₙ (∂ log pθA*(yₙ|xₙ) / ∂θᵢ)²</span></MathReference>
    </div>
    <button type="button" data-p10-transition-id="ewc-penalty" className={`p10-ewc-equation ${referenceClass(relevant(["objective", "gradient"]))}`} onClick={() => onSelect("ewc-penalty")}>
      <b>EWC 损失函数 · EWC Loss</b>
      <span>L_total = L_B + <i>λ</i>⁄2 Σ<sub>i</sub> F<sub>A,i</sub>(θ<sub>i</sub> − θ<sub>A,i</sub>*)²</span>
    </button>
  </section>;
}

function InspectorArea({ info, focusId, selected, review, onSelect, onReview, onOpenHub }: {
  info: { title: string; badge: string; body: string; detail: string };
  focusId?: RuntimeObjectId;
  selected?: RuntimeObjectId;
  review?: ReviewLink;
  onSelect: (id: RuntimeObjectId) => void;
  onReview: (review: ReviewLink) => void;
  onOpenHub: () => void;
}) {
  const links: ReviewLink[] = [
    { page: "page-03-bayes", anchor: "prior-likelihood-posterior", label: "Bayes" },
    { page: "page-04-laplace", anchor: "laplace-local-view", label: "Laplace" },
    { page: "page-05-fisher", anchor: "fisher-estimation", label: "Fisher" },
    { page: "page-06-ewc-objective", anchor: "ewc-objective", label: "EWC Objective" },
    { page: "page-07-lifecycle", anchor: "task-a-to-b-to-c", label: "Lifecycle" },
  ];
  return <section className="p10-panel p10-inspector-panel" aria-label="检查器与参考区">
    <BoardPanelTitle number="4" title="检查器 / 参考区" subtitle="Inspect linked objects · 回看前文" badge="REFERENCE" />
    <div className="p10-inspector-content" aria-live="polite">
      <div className="p10-inspector-content__top"><span>{info.badge}</span>{focusId && <button type="button" onClick={() => onSelect(focusId)}>{selected === focusId ? "取消选中" : "查看当前对象 ↗"}</button>}</div>
      <h3>{info.title}</h3><p>{info.body}</p><small>{info.detail}</small>
    </div>
    {review && <button type="button" className="p10-review-shortcut" onClick={() => onReview(review)}>当前步骤：{review.label} ↗</button>}
    <div className="p10-reference-links"><span>相关章节</span>{links.map((link) => <button key={link.page} type="button" onClick={() => onReview(link)}>{link.label}</button>)}<button type="button" className="p10-hub-link" onClick={onOpenHub}>打开 Reference Hub ↗</button></div>
  </section>;
}

function TimelinePanel({ activeIndex, unlockedThrough, onGoTo }: { activeIndex: number; unlockedThrough: number; onGoTo: (index: number) => void }) {
  return <footer className="p10-timeline" aria-label="Grand Animation 18 步状态时间轴">
    <div className="p10-timeline__heading"><span className="p10-panel__number">5</span><div><b>状态时间轴 <small>State Timeline / State Machine</small></b><span>18 个状态 · 按顺序播放，也可返回已解锁步骤</span></div><span className="p10-timeline__legend"><i className="is-current" />当前状态 <i className="is-done" />已完成 <i className="is-locked" />未开始</span></div>
    <div className="p10-timeline__bands" aria-label="五个阶段">
      {TIMELINE_PHASES.map((phase) => <button key={phase.tone} type="button" data-p10-transition-id={`phase-${phase.tone}`} className={`p10-timeline__band p10-timeline__band--${phase.tone} ${activeIndex >= phase.first && activeIndex <= phase.last ? "is-active" : ""}`} style={{ gridColumn: `${phase.first + 1} / span ${phase.last - phase.first + 1}` }} onClick={() => onGoTo(phase.first)} disabled={unlockedThrough < phase.first} aria-current={activeIndex >= phase.first && activeIndex <= phase.last ? "step" : undefined}>
        <b>{phase.title}</b><small>{phase.range}</small>
      </button>)}
    </div>
    <div className="p10-timeline__steps" role="group" aria-label="18 个可导航状态">
      {STATES.map((item, index) => <button key={item.id} type="button" data-p10-transition-id={`timeline-${item.id}`} className={`p10-timeline__step ${index === activeIndex ? "is-current" : index < activeIndex ? "is-done" : "is-locked"} ${item.checkpoint ? "is-checkpoint" : ""}`} onClick={() => onGoTo(index)} disabled={index > unlockedThrough} aria-current={index === activeIndex ? "step" : undefined} aria-label={`状态 ${index + 1}：${item.title}${index < activeIndex ? "，已完成" : index === activeIndex ? "，当前状态" : "，未开始"}`}>
        <span>{String(index + 1).padStart(2, "0")}</span><b>{item.title}</b>
      </button>)}
    </div>
  </footer>;
}

function FirstVisitOverlay({ onStart }: { onStart: () => void }) {
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { startRef.current?.focus(); }, []);
  return <div className="p10-overlay" role="dialog" aria-modal="true" aria-labelledby="p10-help-title" onKeyDown={(event) => { if (event.key === "Tab") { event.preventDefault(); startRef.current?.focus(); } }}>
    <div className="p10-overlay-card p10-overlay-card--help"><span className="p10-overline">FIRST VISIT · GRAND ANIMATION</span><h2 id="p10-help-title">How to explore</h2><div className="p10-help-grid">
      <div><kbd>Next</kbd><span>跟随推荐学习顺序</span></div><div><kbd>Back</kbd><span>返回上一个关键状态</span></div><div><kbd>Inspect</kbd><span>点击参数、公式或计算节点查看细节</span></div><div><kbd>Mini-map</kbd><span>查看当前位于完整 EWC 生命周期的哪里</span></div>
    </div><p>公式和运行时对象可以相互定位；按 Esc 退出检查或数学视图。</p><button ref={startRef} type="button" className="p10-primary-button" onClick={onStart}>Start the walkthrough <span>→</span></button></div>
  </div>;
}

function FinalSummary({ onReplay, onExplore, onReturn, headingRef }: { onReplay: () => void; onExplore: () => void; onReturn: () => void; headingRef: RefObject<HTMLHeadingElement> }) {
  return <section className="p10-completion" aria-labelledby="p10-final-title">
    <span className="p10-completion__eyebrow">FULL EWC EXECUTION · COMPLETE</span>
    <h3 ref={headingRef} id="p10-final-title" tabIndex={-1}>旧任务约束，进入同一个优化过程</h3>
    <div className="p10-completion__loop">Train <i>→</i> Consolidate <i>→</i> Store <i>→</i> Learn under old-task constraints <i>→</i> Repeat</div>
    <div className="p10-completion__takeaways">
      <span>旧任务结束位置与敏感性近似被保存</span>
      <span>Fisher 加权约束进入新任务目标</span>
      <span>两路梯度共同决定参数更新</span>
    </div>
    <div className="p10-completion__actions">
      <button type="button" onClick={onReturn}>返回 State 18</button>
      <button type="button" onClick={onReplay}>Replay Full Execution ↻</button>
      <button type="button" onClick={onExplore}>Explore Timeline →</button>
    </div>
  </section>;
}

export function PageGrandAnimation() {
  const api = useReferenceApi();
  const help = useFirstVisitHelp();
  const activeIndex = useMemo(() => api.activeAnimationStateId ? STATE_INDEX.get(api.activeAnimationStateId) ?? 0 : 0, [api.activeAnimationStateId]);
  const state = STATES[activeIndex];
  const [furthestIndex, setFurthestIndex] = useState(activeIndex);
  const [playing, setPlaying] = useState(false);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const summaryTriggerRef = useRef<HTMLButtonElement>(null);
  const wasShowingSummary = useRef(false);
  const [expandedFormula, setExpandedFormula] = useState(false);
  const [activeObject, setActiveObject] = useState<RuntimeObjectId | undefined>(api.activeRuntimeObject);
  const [announcement, setAnnouncement] = useState("");
  const boardRef = useRef<HTMLElementTagNameMap["article"] | null>(null);
  const previousTransitionIndex = useRef(activeIndex);
  const [flowingTransition, setFlowingTransition] = useState<{ stateId: GrandAnimationStateId; edgeIds: string[] }>({ stateId: state.id, edgeIds: [] });
  const selectedInfo = activeObject ? OBJECT_INFO[activeObject] : undefined;
  const unlockedThrough = Math.max(furthestIndex, activeIndex);
  const activePhase = TIMELINE_PHASES.find((phase) => activeIndex >= phase.first && activeIndex <= phase.last)!;

  useEffect(() => {
    const previousIndex = previousTransitionIndex.current;
    previousTransitionIndex.current = activeIndex;
    if (previousIndex === activeIndex) return;

    const previousState = STATES[previousIndex];
    const nextState = STATES[activeIndex];
    const board = boardRef.current;
    if (!board) return;

    const transitionTargets = new Set<string>(["step-copy", `timeline-${previousState.id}`, `timeline-${nextState.id}`]);
    const previousFocus = new Set(previousState.focus);
    const nextFocus = new Set(nextState.focus);
    previousState.focus.forEach((id) => { if (!nextFocus.has(id)) transitionTargets.add(id); });
    nextState.focus.forEach((id) => { if (!previousFocus.has(id)) transitionTargets.add(id); });
    if (previousState.scene !== nextState.scene) transitionTargets.add("scene");
    if (previousState.math !== nextState.math) transitionTargets.add("math");
    const previousTimelinePhase = TIMELINE_PHASES.find((phase) => previousIndex >= phase.first && previousIndex <= phase.last)?.tone;
    const nextTimelinePhase = TIMELINE_PHASES.find((phase) => activeIndex >= phase.first && activeIndex <= phase.last)?.tone;
    if (previousTimelinePhase !== nextTimelinePhase) {
      if (previousTimelinePhase) transitionTargets.add(`phase-${previousTimelinePhase}`);
      if (nextTimelinePhase) transitionTargets.add(`phase-${nextTimelinePhase}`);
    }

    const crossed = (boundary: number) => (previousIndex < boundary) !== (activeIndex < boundary);
    if (crossed(7)) transitionTargets.add("task-a-data");
    if (crossed(14) || crossed(17)) transitionTargets.add("task-b-data");
    if (crossed(11)) transitionTargets.add("task-a-anchor");
    if (crossed(12)) transitionTargets.add("task-a-fisher");
    if (crossed(13)) transitionTargets.add("task-state-a");
    if (crossed(17)) transitionTargets.add("task-state-b");

    setFlowingTransition({ stateId: nextState.id, edgeIds: [] });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || Boolean(board.closest(".is-reduced-motion"));
    if (reducedMotion) return;

    const animations: Animation[] = [];
    board.querySelectorAll<HTMLElement>("[data-p10-transition-id]").forEach((element) => {
      if (!element.getClientRects().length) return;
      const matchingIds = (element.dataset.p10TransitionId ?? "").split(/\s+/).filter((id) => transitionTargets.has(id));
      if (!matchingIds.length) return;

      const targetId = matchingIds.find((id) => id.startsWith("task-b") || id.startsWith("task-c") || id === "task-state-b")
        ?? matchingIds.find((id) => id.includes("anchor") || id.includes("fisher") || id === "task-state-a" || id === "persistent-memory")
        ?? matchingIds[0];
      const rgb = targetId.startsWith("task-b") || targetId.startsWith("task-c") || targetId === "task-state-b"
        ? "217, 99, 50"
        : targetId.includes("anchor") || targetId.includes("fisher") || targetId === "task-state-a" || targetId === "persistent-memory"
          ? "67, 133, 118"
          : "12, 82, 103";
      const baseShadow = getComputedStyle(element).boxShadow;
      const haloShadow = `${baseShadow === "none" ? "" : `${baseShadow}, `}0 0 0 3px rgba(${rgb}, .24), 0 0 12px rgba(${rgb}, .14)`;
      animations.push(element.animate([
        { boxShadow: baseShadow, offset: 0 },
        { boxShadow: haloShadow, offset: .28 },
        { boxShadow: baseShadow, offset: 1 },
      ], { duration: 3040, easing: "ease-out" }));
    });

    const edgeIds = FLOWING_BOARD_EDGES[nextState.id] ?? [];
    if (edgeIds.length) {
      setFlowingTransition({ stateId: nextState.id, edgeIds });
      const timer = window.setTimeout(() => setFlowingTransition({ stateId: nextState.id, edgeIds: [] }), 3600);
      return () => {
        window.clearTimeout(timer);
        animations.forEach((animation) => animation.cancel());
      };
    }
    return () => animations.forEach((animation) => animation.cancel());
  }, [activeIndex]);

  const goTo = (index: number, options: { continuePlayback?: boolean } = {}) => {
    const clampedIndex = Math.max(0, Math.min(STATES.length - 1, index));
    const next = STATES[clampedIndex];
    api.openReference({ animationStateId: next.id });
    api.setActiveRuntimeObject(undefined);
    setActiveObject(undefined);
    setFurthestIndex((furthest) => Math.max(furthest, clampedIndex));
    setExpandedFormula(false);
    setShowCompletionSummary(false);
    setAnnouncement(`状态 ${clampedIndex + 1}：${next.title}`);
    if (!options.continuePlayback) setPlaying(false);
  };

  const selectObject = (id: RuntimeObjectId) => {
    const next = activeObject === id ? undefined : id;
    api.setActiveRuntimeObject(next);
    setActiveObject(next);
    setPlaying(false);
  };

  const setFormulaExpanded = (expanded: boolean) => {
    setExpandedFormula(expanded);
    setPlaying(false);
  };

  const dismissInspector = () => { setActiveObject(undefined); api.setActiveRuntimeObject(undefined); };
  const startReplay = () => { goTo(0, { continuePlayback: true }); setPlaying(true); };
  const exploreTimeline = () => { dismissInspector(); goTo(0); };

  useEffect(() => { setActiveObject(api.activeRuntimeObject); }, [api.activeRuntimeObject]);
  useEffect(() => {
    if (!playing) return;
    const playbackEndIndex = getPlaybackEndIndex(activeIndex);
    if (activeIndex >= playbackEndIndex) {
      setPlaying(false);
      return;
    }
    const nextIndex = Math.min(activeIndex + 1, playbackEndIndex);
    const nextState = STATES[nextIndex];
    const timer = window.setTimeout(() => {
      api.openReference({ animationStateId: nextState.id });
      setFurthestIndex((furthest) => Math.max(furthest, nextIndex));
      setAnnouncement(`状态 ${nextIndex + 1}：${nextState.title}`);
      if (nextIndex >= playbackEndIndex) setPlaying(false);
    }, getStateHoldMs(state.id));
    return () => window.clearTimeout(timer);
  }, [playing, activeIndex, api]);

  useEffect(() => { setShowCompletionSummary(false); }, [activeIndex]);

  useEffect(() => {
    if (showCompletionSummary) summaryHeadingRef.current?.focus();
    else if (wasShowingSummary.current && summaryTriggerRef.current?.isConnected) summaryTriggerRef.current.focus();
    wasShowingSummary.current = showCompletionSummary;
  }, [showCompletionSummary]);

  useEffect(() => {
    if (api.currentPage !== "page-10-grand-animation") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (api.hubOpen) return;
      if (help.open) return;
      if (showCompletionSummary) {
        if (event.key === "Escape") { event.preventDefault(); setShowCompletionSummary(false); }
        return;
      }
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft" && activeIndex > 0) { event.preventDefault(); goTo(activeIndex - 1); }
      else if (event.key === "ArrowRight" && activeIndex < LAST_STATE_INDEX) { event.preventDefault(); goTo(activeIndex + 1); }
      else if (event.code === "Space" && !target?.closest("button, a") && activeIndex < LAST_STATE_INDEX) { event.preventDefault(); setPlaying((value) => !value); }
      else if (event.key === "Escape") {
        if (activeObject) dismissInspector();
        else if (state.scene === "posterior" || state.scene === "laplace") goTo(10);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [api.currentPage, api.hubOpen, activeIndex, activeObject, state.scene, help.open, showCompletionSummary]);

  const setRuntimeObject = (id?: RuntimeObjectId) => { api.setActiveRuntimeObject(id); setActiveObject(id); };
  const inspectorInfo = selectedInfo ?? (state.focus[0] ? OBJECT_INFO[state.focus[0]] : OBJECT_INFO["neural-network"]);
  return <article ref={boardRef} className="p10-page p10-board" id="grand-animation" aria-label="EWC Grand Animation">
    <header className="p10-board__header">
      <div className="p10-board__identity">
        <button type="button" className="p10-back-page" onClick={() => api.navigatePage("page-09-atari")} aria-label="返回 Page 9">← <span>Page 9</span></button>
        <div className="p10-header__main"><h1>持续学习可视化实验室</h1><p>让概率、Bayes、Laplace、Fisher 与 EWC 在同一条训练流程中连接起来。</p></div>
      </div>
      <div className="p10-board-player" aria-label="Grand Animation 播放控制">
        <div className="p10-board-player__transport">
          <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="上一步">|◀</button>
          <button type="button" className="p10-board-player__play" onClick={() => setPlaying((value) => !value)} disabled={!playing && activeIndex >= LAST_STATE_INDEX} aria-label={playing ? "暂停播放" : "播放至阶段边界"} title={playing ? "暂停播放" : "播放至阶段边界后自动暂停；边界上可再次点击继续，也可随时暂停"}>{playing ? "Ⅱ" : "▶"}</button>
          <button type="button" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex >= LAST_STATE_INDEX} aria-label="下一步">▶|</button>
        </div>
        <input type="range" min="0" max={STATES.length - 1} value={activeIndex} onChange={(event) => goTo(Math.min(Number(event.currentTarget.value), unlockedThrough))} aria-label="动画状态进度" aria-valuetext={`状态 ${activeIndex + 1}：${state.title}`} />
        <span className="p10-board-player__count">{activeIndex + 1}<i>/</i>{STATES.length}</span>
      </div>
      <div className="p10-board__current" aria-live="polite">
        <b>当前步骤：{activeIndex + 1}. {state.short}</b>
        <span>{activePhase.title} · {state.task}</span>
      </div>
    </header>

    <div className="p10-board__grid">
      <FlowGuideLayer state={state} activeIndex={activeIndex} flowingEdgeIds={flowingTransition.stateId === state.id ? flowingTransition.edgeIds : []} />
      <aside className="p10-board__left">
        <TaskDataPanel state={state} activeIndex={activeIndex} selected={activeObject} onSelect={selectObject} />
        <MemoryPanel activeIndex={activeIndex} selected={activeObject} onSelect={selectObject} />
      </aside>

      <section className="p10-panel p10-workbench" aria-labelledby="p10-current-title">
        <BoardPanelTitle number="" title="运行态视图（神经网络工作台）" subtitle="Runtime View · 同一个模型沿训练时间持续更新" badge={getStateViewLabel(state)} />
        <div className="p10-workbench__current" data-flow-node="runtime-step" data-p10-transition-id="step-copy">
          <div><span>STATE {String(activeIndex + 1).padStart(2, "0")} / 18 · {state.phase.toUpperCase()}</span><h2 id="p10-current-title">{state.title}</h2></div>
          <p>{state.annotation}<small>{state.why}</small></p>
          {state.review && <button type="button" onClick={() => api.openReference({ pageId: state.review!.page, anchorId: state.review!.anchor })}>{state.review.label} ↗</button>}
        </div>
        <div className="p10-workbench__network"><NeuralWorkbench state={state} selected={activeObject} onSelect={selectObject} /></div>
        <div className="p10-workbench__focus" data-p10-transition-id="scene" aria-label="当前步骤细节">
          {showCompletionSummary && <FinalSummary onReplay={startReplay} onExplore={exploreTimeline} onReturn={() => goTo(STATES.length - 1)} headingRef={summaryHeadingRef} />}
          <div hidden={showCompletionSummary} style={{ minHeight: 0, flex: "1 1 auto", display: showCompletionSummary ? "none" : "flex", flexDirection: "column" }}>
            <div className="p10-workbench__focus-head"><span>当前步骤细节 · {getStateViewLabel(state)}</span>{(state.scene === "posterior" || state.scene === "laplace") && <button type="button" onClick={() => goTo(10)}>返回 Runtime ↑</button>}</div>
            <SceneVisual key={state.id} state={state} selected={activeObject} onSelect={selectObject} onComplete={() => setShowCompletionSummary(true)} summaryTriggerRef={summaryTriggerRef} />
          </div>
        </div>
        <ParameterStrip state={state} activeIndex={activeIndex} selected={activeObject} onSelect={selectObject} />
      </section>

      <aside className="p10-board__right">
        <MathArea state={state} expandedFormula={expandedFormula} onExpandedFormulaChange={setFormulaExpanded} onSelect={selectObject} />
        <InspectorArea info={inspectorInfo} focusId={state.focus[0]} selected={activeObject} review={state.review} onSelect={selectObject} onReview={(review) => api.openReference({ pageId: review.page, anchorId: review.anchor })} onOpenHub={() => api.openHub()} />
      </aside>
    </div>

    <TimelinePanel activeIndex={activeIndex} unlockedThrough={unlockedThrough} onGoTo={goTo} />
    <span className="p10-sr-only" aria-live="polite">{announcement}</span>
    {help.open && <FirstVisitOverlay onStart={help.close} />}
  </article>;
}
