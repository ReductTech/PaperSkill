import type { ReleaseTutorial } from "../types";

/**
 * Release-only descriptions of the current EWC pages. The application does not
 * consume this metadata; its page order and rendering remain in src/App.tsx.
 */
export const tutorial: ReleaseTutorial = {
  title: "Overcoming catastrophic forgetting in neural networks",
  description:
    "A structural release map for the ten implemented EWC learning pages; it does not drive the application.",
  chapters: [
    {
      kind: "chapter",
      id: "page-01-problem",
      title: "顺序训练中的参数变化",
      summary: "从连续任务中同一组参数的变化出发，观察新任务更新如何影响旧任务表现。",
      modules: [
        {
          kind: "module",
          id: "parameter-drift",
          title: "参数偏移与旧任务表现",
          summary: "比较参数变化前后的旧任务损失与表现，说明相近幅度的偏移也可能产生不同影响。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-02-probability",
      title: "从网络概率到 Loss",
      summary: "沿着输入、logits、类别概率和正确标签的似然，建立可计算的任务损失。",
      modules: [
        {
          kind: "module",
          id: "probability-to-loss",
          title: "从预测概率计算负对数似然",
          summary: "追踪一次前向预测如何经 Softmax 和正确类别概率形成 NLL；数值是教学示例。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-03-bayes",
      title: "参数的 Prior 与 Posterior",
      summary: "区分训练前的参数先验与观察 Task A 数据后的参数后验。",
      modules: [
        {
          kind: "module",
          id: "prior-and-posterior",
          title: "数据如何改变参数支持度",
          summary: "将参数点扩展为概率分布视角，为后续保存旧任务解附近的信息作准备。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-04-laplace",
      title: "Task A 解附近的局部约束",
      summary: "用局部二阶近似描述旧任务解附近的后验形状，并得到关于参数偏移的二次代价。",
      modules: [
        {
          kind: "module",
          id: "local-laplace-constraint",
          title: "从局部曲率到 Gaussian 约束",
          summary: "展示 Task A 参数中心与局部精度如何决定偏移的代价，以及完整 Hessian 的计算负担。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-05-fisher",
      title: "参数局部敏感性",
      summary: "解释对角 Fisher 如何近似参数级预测敏感性，并压缩局部精度的存储需求。",
      modules: [
        {
          kind: "module",
          id: "diagonal-fisher-sensitivity",
          title: "按参数估计局部敏感性",
          summary: "比较不同参数的 Fisher 权重，说明相同偏移在不同坐标上会有不同约束强度。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-06-ewc-objective",
      title: "Task B 的 EWC 目标",
      summary: "把 Task B 的新任务损失与来自 Task A 的参数级约束连接到同一次优化。",
      modules: [
        {
          kind: "module",
          id: "ewc-penalty-objective",
          title: "逐项装配 EWC 惩罚项",
          summary: "从旧参数锚点、平方偏移和 Fisher 权重构造惩罚，并区分逐参数权重与全局强度 λ。",
        },
        {
          kind: "module",
          id: "task-b-gradient-update",
          title: "两路梯度如何改变 Task B 更新",
          summary: "展示新任务梯度与 EWC 梯度在优化器前汇合，并用明确标注的教学数值说明参数更新。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-07-lifecycle",
      title: "EWC 顺序训练生命周期",
      summary: "沿任务边界追踪训练、保存旧参数锚点和 Fisher，再将其用于后续任务。",
      modules: [
        {
          kind: "module",
          id: "task-boundary-lifecycle",
          title: "跨任务保存与读取 EWC 状态",
          summary: "区分可训练参数与任务边界保存的状态，展示后续任务如何复用旧任务信息。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-08-mnist",
      title: "Permuted MNIST 实验",
      summary: "说明固定像素排列如何构造顺序分类任务，以及如何同时阅读遗忘与新任务学习表现。",
      modules: [
        {
          kind: "module",
          id: "permuted-mnist-evidence",
          title: "任务构造、基线与结果协议",
          summary: "对照 Sequential SGD、Uniform L2 与 EWC，并把旧任务保持和新任务可塑性作为两类指标阅读。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-09-atari",
      title: "Atari 系统与实验边界",
      summary: "把 EWC 放入 Atari 强化学习系统，区分系统级结果、诊断线索和证据边界。",
      modules: [
        {
          kind: "module",
          id: "atari-system-and-evidence",
          title: "强化学习循环与完整系统证据",
          summary: "追踪环境、agent、经验回放和任务边界约束的职责，并说明跨游戏表现属于完整系统结果。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "page-10-grand-animation",
      title: "让 EWC 真正运行起来",
      summary: "沿同一训练流程串联输入、概率、梯度、参数更新、任务边界记忆与后续任务约束。",
      modules: [
        {
          kind: "module",
          id: "ewc-runtime-integration",
          title: "跨 Task A 与 Task B 的运行整合",
          summary: "通过现有 Grand Animation 逐步查看训练状态及保存的锚点、Fisher 如何进入 Task B 更新。",
        },
      ],
    },
  ],
};
