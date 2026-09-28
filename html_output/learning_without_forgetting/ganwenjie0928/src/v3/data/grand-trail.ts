import type { LwfChapterId } from "./chapters";

export type GrandTrailStep = {
  id: string;
  title: string;
  checkpoint: string;
  action: string;
  input: string;
  output: string;
  state: string;
  why: string;
  activeActors: string[];
  activeFlows: string[];
  referenceId?: string;
  chapterRef?: LwfChapterId;
  durationMs: number;
};

export type GrandTrailEdge = { from: string; to: string; flow: string };

export const grandTrailSteps: GrandTrailStep[] = [
  {
    id: "old-model",
    title: "旧模型就绪",
    checkpoint: "START · MODELₜ",
    action: "从已完成任务 1…t 的旧模型开始。",
    input: "Modelₜ · 共享参数 θₛ + 旧 head θₒ",
    output: "仍可运行的旧任务模型",
    state: "旧训练图像与标签不可用；模型参数仍可访问。",
    why: "旧模型保留了可查询的旧行为，但不需要取回旧训练样本。",
    activeActors: ["model", "old-data-locked"],
    activeFlows: [],
    referenceId: "teacher",
    chapterRef: "01",
    durationMs: 900,
  },
  {
    id: "new-task",
    title: "新任务到来",
    checkpoint: "NEW TASK · INPUT",
    action: "新任务带来当前可用的输入与新标签。",
    input: "Xₙ + Yₙ",
    output: "当前阶段训练数据",
    state: "适配阶段只使用新任务数据；旧任务数据仍不可用。",
    why: "LwF 在新任务样本上同时学习新标签并查询旧模型响应。",
    activeActors: ["model", "new-task", "old-data-locked"],
    activeFlows: ["task-arrival"],
    referenceId: "xn",
    chapterRef: "02",
    durationMs: 1100,
  },
  {
    id: "teacher-student-split",
    title: "冻结 Teacher，建立 Student",
    checkpoint: "SPLIT · TWO ROLES",
    action: "保留一份固定旧模型作为 Teacher，并建立可训练的 Student。",
    input: "Modelₜ · θₛ + θₒ",
    output: "Teacherₜ (fixed) + Studentₜ₊₁ (active)",
    state: "Teacher 不更新；Student 独立适配新任务。",
    why: "两个模型角色分开后，旧响应目标稳定，当前模型仍可学习。",
    activeActors: ["teacher-frozen", "student-active", "new-task"],
    activeFlows: ["teacher-freeze", "student-copy"],
    referenceId: "student",
    chapterRef: "02",
    durationMs: 1500,
  },
  {
    id: "generate-responses",
    title: "刷新旧任务响应",
    checkpoint: "RESPONSE · Yₒ",
    action: "将同一批新输入 Xₙ 送入 Teacherₜ，产生旧任务响应 Yₒ。",
    input: "Teacherₜ + Xₙ",
    output: "Yₒ on Xₙ",
    state: "响应由当前 Teacher 和当前输入重新生成，不是旧样本或旧标签。",
    why: "旧数据不能访问时，旧模型输出仍能为旧任务行为提供参照。",
    activeActors: ["teacher-frozen", "student-active", "new-task", "old-response"],
    activeFlows: ["response-refresh"],
    referenceId: "yo",
    chapterRef: "02",
    durationMs: 1500,
  },
  {
    id: "add-head",
    title: "增加新任务 head",
    checkpoint: "EXPAND · θₙ",
    action: "在 Student 的共享主干旁增加新任务专属 head θₙ。",
    input: "Student 的共享参数 θₛ 与旧 head θₒ",
    output: "Studentₜ₊₁ · θₛ + θₒ + θₙ",
    state: "旧输出路径保留；新增 θₙ 负责当前任务预测。",
    why: "新 head 给新任务留出输出通道，无需替换旧任务 head。",
    activeActors: ["teacher-frozen", "student-active", "new-head"],
    activeFlows: ["head-branch"],
    referenceId: "theta-n",
    chapterRef: "02",
    durationMs: 1300,
  },
  {
    id: "warm-up",
    title: "Warm-up 新 head",
    checkpoint: "WARM-UP · ONLY θₙ",
    action: "先使用当前任务标签预热新 head。",
    input: "Xₙ + Yₙ → Student 的新任务分支",
    output: "初步适配的 θₙ",
    state: "Warm-up 时 θₛ 与 θₒ 冻结，只有 θₙ 可训练。",
    why: "先单独适配新输出层，之后再进入旧响应与新任务联合优化。",
    activeActors: ["teacher-frozen", "shared-frozen", "old-head-frozen", "new-head-active"],
    activeFlows: ["new-head-warmup"],
    referenceId: "warm-up",
    chapterRef: "03",
    durationMs: 1300,
  },
  {
    id: "joint-training",
    title: "联合训练两个目标",
    checkpoint: "JOINT TRAINING · L_old + L_new",
    action: "旧响应目标与新任务监督共同形成训练目标，并把梯度传回 Student。",
    input: "Yₒ / Ŷₒ 与 Yₙ / Ŷₙ",
    output: "L = λₒ L_old + L_new + R → gradients",
    state: "θₛ 同时接收两个目标的影响；Teacherₜ 仍保持固定。",
    why: "联合目标在保持已观察旧响应与适配当前任务之间提供权衡。",
    activeActors: ["teacher-frozen", "student-active", "old-loss", "new-loss", "gradient"],
    activeFlows: ["old-loss", "new-loss", "gradient-wave"],
    referenceId: "joint-optimization",
    chapterRef: "03",
    durationMs: 2200,
  },
  {
    id: "update",
    title: "更新 Student",
    checkpoint: "UPDATE · PARAMETERS",
    action: "Optimizer 将刚才计算的梯度应用到允许更新的 Student 参数。",
    input: "联合目标产生的梯度",
    output: "更新后的 Studentₜ₊₁",
    state: "参数变化发生在 optimizer step；Teacherₜ 不变。",
    why: "这一步才真正改变 Student 参数并完成当前阶段的适配。",
    activeActors: ["teacher-frozen", "student-updated", "optimizer"],
    activeFlows: ["parameter-update"],
    referenceId: "joint-optimization",
    chapterRef: "03",
    durationMs: 1200,
  },
  {
    id: "next-teacher",
    title: "晋升并交给下一阶段",
    checkpoint: "PROMOTION · LOOP CLOSURE",
    action: "更新后的 Studentₜ₊₁ 成为 Modelₜ₊₁，并在下一任务阶段成为 Teacherₜ₊₁。",
    input: "更新后的 Studentₜ₊₁",
    output: "Modelₜ₊₁ → Teacherₜ₊₁ → Task t+2",
    state: "当前回放停在下一阶段入口；新任务到来后会重新生成旧响应。",
    why: "模型沿任务序列递归交接，构成完整生命周期。",
    activeActors: ["model-next", "teacher-next", "next-task"],
    activeFlows: ["model-promotion", "loop-closure"],
    referenceId: "sequential-refresh",
    chapterRef: "05",
    durationMs: 1700,
  },
];

export const grandTrailEdges: GrandTrailEdge[] = [
  { from: "old-model", to: "new-task", flow: "task-arrival" },
  { from: "new-task", to: "teacher-student-split", flow: "student-copy" },
  { from: "teacher-student-split", to: "generate-responses", flow: "response-refresh" },
  { from: "generate-responses", to: "add-head", flow: "head-branch" },
  { from: "add-head", to: "warm-up", flow: "new-head-warmup" },
  { from: "warm-up", to: "joint-training", flow: "gradient-wave" },
  { from: "joint-training", to: "update", flow: "parameter-update" },
  { from: "update", to: "next-teacher", flow: "model-promotion" },
];

export const jointTrainingSubsteps = ["Forward", "L_old / L_new", "Backward", "Optimizer Step"] as const;
