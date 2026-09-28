export const problemFacts = [
  { id: "old-model", title: "旧模型", state: "可运行", detail: "仍能接收输入并产生旧任务输出。", available: true },
  { id: "old-data", title: "旧任务训练数据", state: "不可用", detail: "当前阶段不能重新访问旧图像及其标签。", available: false },
  { id: "new-data", title: "新任务数据", state: "可用", detail: "当前图像 Xₙ 与新任务标签 Yₙ 可用于训练。", available: true },
] as const;

export const baselineRoutes = [
  {
    id: "finetuning",
    title: "Fine-tuning",
    good: "可以适应新任务。",
    limit: "更新共享参数后，旧任务输出可能漂移。",
  },
  {
    id: "feature-extraction",
    title: "Feature Extraction",
    good: "冻结共享表示，有助于保护旧特征。",
    limit: "共享表示不能适应新任务。",
  },
  {
    id: "joint-training",
    title: "Joint Training",
    good: "可用新旧数据共同学习。",
    limit: "需要旧任务训练数据，与当前约束冲突。",
  },
  {
    id: "lwf",
    title: "LwF",
    good: "学习新任务，并用 Teacher 的旧响应保持旧输出。",
    limit: "旧行为约束来自当前新任务输入 Xₙ。",
  },
] as const;
