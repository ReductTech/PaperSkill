import type { FlowStep } from "../../shared/core/flow-stepper";
import type { ProcessLoopSpec } from "../../shared/core/process-loop";
import type { StickySection } from "../../shared/foundation/layout/StickySystemView";

export const keyMoveSteps: FlowStep[] = [
  { id: "key-new-task", title: "新任务到来", description: "旧任务数据不可访问；当前 Xₙ 与 Yₙ 可用。", relatedIds: ["xn"] },
  { id: "key-freeze-teacher", title: "固定旧模型", description: "将旧模型作为 Teacher 保留，参数在本轮不更新。", relatedIds: ["teacher"] },
  { id: "key-generate-response", title: "生成旧响应", description: "把当前 Xₙ 输入 Teacher，得到 Yₒ。", relatedIds: ["xn", "teacher", "yo"] },
  { id: "key-expand-student", title: "扩展 Student", description: "复制旧模型构成 Student，再为新任务添加 θₙ。", relatedIds: ["student", "theta-s", "old-branch", "new-branch"] },
];

export const trainingSteps: FlowStep[] = [
  { id: "cycle-warmup", title: "Warm-up", description: "先训练新 head θₙ；θₛ 与 θₒ 暂时冻结。", relatedIds: ["new-branch"] },
  { id: "cycle-forward", title: "Forward", description: "Teacher 产生 Yₒ；Student 同时产生 Ŷₒ 与 Ŷₙ。", relatedIds: ["teacher", "student", "yo", "old-branch", "new-branch"] },
  { id: "cycle-old-loss", title: "旧响应损失", description: "比较 Teacher 的 Yₒ 与 Student 的 Ŷₒ，得到 L_old。", relatedIds: ["yo", "old-branch", "loss-old"] },
  { id: "cycle-new-loss", title: "新任务损失", description: "用新任务标签 Yₙ 监督 Student 的 Ŷₙ，得到 L_new。", relatedIds: ["new-label", "new-branch", "loss-new"] },
  { id: "cycle-backward", title: "Backward", description: "L_old 与 L_new 都把梯度传到共享参数 θₛ。", relatedIds: ["loss-old", "loss-new", "theta-s"] },
  { id: "cycle-update", title: "Optimizer Step", description: "优化器应用已计算的梯度，真正更新 Student 参数。", relatedIds: ["objective", "optimizer", "updated-student"] },
];

export const processSyncSections: StickySection[] = [...keyMoveSteps, ...trainingSteps].map(({ id }) => ({ id, stepId: id }));

export const lwfProcess: ProcessLoopSpec = {
  nodes: [
    { id: "xn", label: "Xₙ", kind: "input", group: "当前任务输入", description: "旧模型与 Student 都接收同一批当前任务输入。", position: { x: 130, y: 85 } },
    { id: "teacher", label: "Teacher · 固定", kind: "module", group: "旧模型响应", description: "旧模型参数保持不变；它仍能对 Xₙ 产生旧任务响应。", position: { x: 410, y: 85 } },
    { id: "yo", label: "Yₒ", kind: "output", group: "旧模型响应", description: "Teacher 在当前任务输入 Xₙ 上产生的旧任务响应。", position: { x: 690, y: 85 } },
    { id: "student", label: "Student · θₛ", kind: "module", group: "Student", description: "可训练的共享表示参数；两个训练目标都可能更新它。", position: { x: 130, y: 235 } },
    { id: "old-branch", label: "θₒ → Ŷₒ", kind: "parameter", group: "Student", description: "Student 的旧任务 head 与旧任务输出。", position: { x: 410, y: 235 } },
    { id: "loss-old", label: "L_old", kind: "loss", group: "目标", description: "使 Student 的旧任务输出匹配 Teacher 对 Xₙ 的响应。", position: { x: 690, y: 235 } },
    { id: "new-label", label: "Yₙ", kind: "input", group: "当前任务监督", description: "当前任务的真实标签，只监督新任务输出。", position: { x: 130, y: 385 } },
    { id: "new-branch", label: "θₙ → Ŷₙ", kind: "parameter", group: "Student", description: "新初始化的任务 head 与新任务预测。", position: { x: 410, y: 385 } },
    { id: "loss-new", label: "L_new", kind: "loss", group: "目标", description: "用新任务标签 Yₙ 监督 Student 的新任务输出。", position: { x: 690, y: 385 } },
    { id: "objective", label: "L = λₒL_old + L_new + R", kind: "loss", group: "优化", description: "旧响应保持、新任务学习与普通正则项组成训练目标。", position: { x: 130, y: 535 } },
    { id: "optimizer", label: "Optimizer Step", kind: "state", group: "优化", description: "把反向传播得到的梯度应用到当前允许更新的参数。", position: { x: 410, y: 535 } },
    { id: "updated-student", label: "更新后的 Student", kind: "output", group: "优化", description: "参数改变发生在优化器更新之后。", position: { x: 690, y: 535 } },
  ],
  edges: [
    { id: "xn-teacher", from: "xn", to: "teacher", kind: "data", label: "当前输入" },
    { id: "teacher-yo", from: "teacher", to: "yo", kind: "data", label: "旧响应" },
    { id: "xn-student", from: "xn", to: "student", kind: "data", label: "同一批输入" },
    { id: "student-old", from: "student", to: "old-branch", kind: "data", label: "共享表示" },
    { id: "student-new", from: "student", to: "new-branch", kind: "data", label: "共享表示" },
    { id: "yo-old-loss", from: "yo", to: "loss-old", kind: "data", label: "Teacher target", path: "orthogonal" },
    { id: "old-output-loss", from: "old-branch", to: "loss-old", kind: "data", label: "Student output" },
    { id: "label-new-loss", from: "new-label", to: "loss-new", kind: "data", label: "新任务真值", path: "orthogonal" },
    { id: "new-output-loss", from: "new-branch", to: "loss-new", kind: "data", label: "Student output" },
    { id: "loss-old-objective", from: "loss-old", to: "objective", kind: "data", label: "旧行为保持" },
    { id: "loss-new-objective", from: "loss-new", to: "objective", kind: "data", label: "新任务学习" },
    { id: "old-loss-head-gradient", from: "loss-old", to: "old-branch", kind: "gradient", direction: "forward", label: "L_old → θₒ" },
    { id: "old-head-shared-gradient", from: "student", to: "old-branch", kind: "gradient", direction: "reverse", label: "θₒ → θₛ" },
    { id: "new-loss-head-gradient", from: "loss-new", to: "new-branch", kind: "gradient", direction: "forward", label: "L_new → θₙ" },
    { id: "new-head-shared-gradient", from: "student", to: "new-branch", kind: "gradient", direction: "reverse", label: "θₙ → θₛ" },
    { id: "objective-optimizer", from: "objective", to: "optimizer", kind: "control", label: "计算梯度后" },
    { id: "optimizer-updated-student", from: "optimizer", to: "updated-student", kind: "control", label: "应用梯度" },
  ],
  steps: [
    {
      id: "key-new-task", title: "新任务到来", summary: "旧训练数据不可用，但旧模型仍能运行；当前任务提供 Xₙ。",
      activeNodes: ["xn", "teacher", "student"], activeEdges: ["xn-teacher", "xn-student"],
      annotations: [{ target: "xn", text: "只有当前任务输入可用于本轮训练。" }],
      detail: { title: "约束", bullets: ["旧训练图像与标签不可用。", "旧模型和新任务数据仍可访问。"] },
    },
    {
      id: "key-freeze-teacher", title: "固定旧模型", summary: "保留一个不参与本轮优化的 Teacher。",
      activeNodes: ["teacher"], activeEdges: [],
      annotations: [{ target: "teacher", text: "Teacher 提供目标，不进入 optimizer。" }],
      detail: { title: "Teacher 的职责", bullets: ["参数保持固定。", "继续对当前输入产生旧任务输出。"] },
    },
    {
      id: "key-generate-response", title: "生成旧响应", summary: "把 Xₙ 输入 Teacher，得到 Yₒ。",
      activeNodes: ["xn", "teacher", "yo"], activeEdges: ["xn-teacher", "teacher-yo"],
      annotations: [{ target: "yo", text: "Yₒ 是 Teacher 对当前新任务输入的响应。" }],
      detail: { title: "Yₒ 的来源", bullets: ["不是旧任务真值标签。", "不是从旧数据集取出的样本。", "不是 replay sample。"] },
    },
    {
      id: "key-expand-student", title: "扩展 Student", summary: "建立可训练的 Student，并增加新任务 head θₙ。",
      activeNodes: ["student", "old-branch", "new-branch"], activeEdges: ["xn-student", "student-old", "student-new"],
      annotations: [{ target: "new-branch", text: "新任务 head θₙ 加入 Student。" }],
      detail: { title: "Student 的结构", bullets: ["θₛ 是共享参数。", "θₒ 负责旧任务输出。", "θₙ 负责新任务输出。"] },
    },
    {
      id: "cycle-warmup", title: "Warm-up", summary: "先训练新 head；共享参数 θₛ 与旧 head θₒ 暂时冻结。",
      activeNodes: ["student", "new-branch"], activeEdges: ["student-new"],
      annotations: [{ target: "new-branch", text: "仅 θₙ 可训练。" }],
      detail: { title: "参数状态", bullets: ["θₛ 冻结。", "θₒ 冻结。", "新初始化的 θₙ 可训练。"] },
    },
    {
      id: "cycle-forward", title: "Forward", summary: "Teacher 产生 Yₒ；Student 产生 Ŷₒ 与 Ŷₙ。",
      activeNodes: ["xn", "teacher", "yo", "student", "old-branch", "new-branch"],
      activeEdges: ["xn-teacher", "teacher-yo", "xn-student", "student-old", "student-new"],
      detail: { title: "两条前向路径", bullets: ["Teacher: Xₙ → Yₒ。", "Student: Xₙ → θₛ，再分成旧、新任务输出。"] },
    },
    {
      id: "cycle-old-loss", title: "旧响应损失", summary: "Teacher 的 Yₒ 与 Student 的 Ŷₒ 一起形成 L_old。",
      activeNodes: ["yo", "old-branch", "loss-old"], activeEdges: ["yo-old-loss", "old-output-loss"],
      annotations: [{ target: "loss-old", text: "Student 的旧任务输出要匹配 Teacher 的旧任务响应。" }],
      detail: { title: "旧任务保持", bullets: ["Yₒ 是软响应目标。", "Ŷₒ 是 Student 的旧任务输出。"] },
    },
    {
      id: "cycle-new-loss", title: "新任务损失", summary: "真实标签 Yₙ 监督 Student 的新任务输出 Ŷₙ。",
      activeNodes: ["new-label", "new-branch", "loss-new"], activeEdges: ["label-new-loss", "new-output-loss"],
      annotations: [{ target: "loss-new", text: "新任务真值只监督新任务输出。" }],
      detail: { title: "新任务学习", bullets: ["Yₙ 来自当前新任务数据。", "Ŷₙ 是 Student 的新任务预测。"] },
    },
    {
      id: "cycle-backward", title: "Backward", summary: "两项损失都能把梯度传到共享参数 θₛ。",
      activeNodes: ["loss-old", "loss-new", "student", "old-branch", "new-branch"],
      activeEdges: ["old-loss-head-gradient", "old-head-shared-gradient", "new-loss-head-gradient", "new-head-shared-gradient"],
      annotations: [
        { target: "old-branch", text: "L_old → θₒ → θₛ。" },
        { target: "new-branch", text: "L_new → θₙ → θₛ。" },
      ],
      detail: { title: "共享参数的两种压力", bullets: ["L_old 推动共享表示保留旧响应。", "L_new 推动共享表示适应新任务。"] },
    },
    {
      id: "cycle-update", title: "Optimizer Step", summary: "优化器应用梯度之后，Student 参数才真正改变。",
      activeNodes: ["objective", "optimizer", "updated-student"], activeEdges: ["loss-old-objective", "loss-new-objective", "objective-optimizer", "optimizer-updated-student"],
      annotations: [{ target: "optimizer", text: "backward 计算梯度；optimizer.step() 才更新参数。" }],
      detail: { title: "完整目标", bullets: ["L_old 保持旧响应。", "L_new 学习新任务。", "λₒ 控制旧响应项权重，R 是普通正则项。"] },
    },
  ],
};
