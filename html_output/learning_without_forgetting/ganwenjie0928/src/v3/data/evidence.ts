export type LwfEvidenceId = "table_1" | "table_2" | "figure_4" | "figure_7";

export const evidenceOrder: LwfEvidenceId[] = ["table_1", "table_2", "figure_4", "figure_7"];

export const evidenceQuestions: Record<LwfEvidenceId, string> = {
  table_1: "在 ImageNet → CUB 这组任务中，LwF 与常见适配路线呈现怎样的新旧任务折衷？",
  table_2: "哪些架构与训练选择在作者报告的消融中显示出稳定作用？",
  figure_4: "新任务逐步加入后，各任务表现如何变化？",
  figure_7: "旧响应损失权重、参数约束和响应损失选择带来什么证据？",
};

export const evidenceProtocol: Record<LwfEvidenceId, { text: string; sourcePage: number; sourceLabel: string }> = {
  table_1: {
    text: "ImageNet 旧任务 / CUB-200-2011 新任务；AlexNet，fc8 为任务专属输出层；ImageNet validation 与 CUB test；top-1 accuracy；三次运行均值，center crop。",
    sourcePage: 7,
    sourceLabel: "Table 1(a) · PDF p.7 · protocol p.6",
  },
  table_2: {
    text: "AlexNet 上的三组任务对：ImageNet → CUB、ImageNet → Indoor Scenes、Places365 → VOC；Table 2 对照旧任务与新任务 accuracy，并检查 task-specific layers、network expansion、共享学习率与 warm-up。",
    sourcePage: 9,
    sourceLabel: "Table 2 · PDF p.9",
  },
  figure_4: {
    text: "Places365 → VOC 与 ImageNet → Indoor Scenes 两组任务序列；VOC 类别分为 transport、animals、objects，Scenes 分为 large、medium、small rooms；每次增加任务后观察各任务表现。",
    sourcePage: 8,
    sourceLabel: "Figure 4 · PDF p.8 · §IV-A",
  },
  figure_7: {
    text: "Places365 → VOC 与 ImageNet → Scene 任务对；比较 λₒ 的权重变化、response regularization 与 parameter-L2 baseline，以及 KD、cross-entropy、L1、L2 响应损失。",
    sourcePage: 10,
    sourceLabel: "Figure 7 · PDF pp.9–10",
  },
};

export const evidenceInterpretations: Record<LwfEvidenceId, { kind: string; text: string }> = {
  table_1: {
    kind: "READING NOTE · INFORMATION CONDITIONS",
    text: "Joint Training 使用旧任务样本与标签，而 LwF 不使用；对照结果要连同这一信息条件差异一起读。表中其他方法的带符号差值是相对 LwF 的结果，不是直接打印的绝对准确率。",
  },
  table_2: {
    kind: "AUTHOR INTERPRETATION",
    text: "作者在所测设置中没有观察到替代架构带来一致优势，并指出 warm-up 对 LwF 并非关键条件。",
  },
  figure_4: {
    kind: "AUTHOR INTERPRETATION",
    text: "作者报告 LwF 随时间退化慢于 fine-tuning，并在多数情形优于 feature extraction；增加更多任务后，旧任务表现仍可能落后于 Joint Training。",
  },
  figure_7: {
    kind: "AUTHOR INTERPRETATION",
    text: "作者认为响应正则比约束单个参数更直接地针对旧任务行为；这是对所测设置的解释，不等于参数距离在任何场景都无用。",
  },
};

export const figure4ReadingGuide = [
  { label: "任务加入顺序", text: "Places365 → VOC（transport、animals、objects）；ImageNet → Indoor Scenes（large、medium、small rooms）。" },
  { label: "纵轴指标", text: "VOC 为 mAP；其他任务为 accuracy。曲线分别跟踪各旧任务和新加入任务。" },
  { label: "误差线与观察窗口", text: "误差线是 3 次不同 θₙ 随机初始化的 ±2 个标准差；图展示逐步加任务后的多阶段表现。" },
  { label: "数据组织", text: "VOC 按标签拆成三项任务，但图像在这些任务间共享；Indoor Scenes 则按房间大小拆分图像。" },
] as const;

export const figure7ReadingGuide = [
  { label: "λₒ trade-off", text: "每组 old-task / new-task 表现点对应不同损失权重；较大的标记表示较大的 λₒ，也就是更重视旧响应保持。" },
  { label: "响应约束与参数 L2", text: "在图中测试的 Places365 → VOC 和 ImageNet → Indoor Scenes 设置里，作者报告 LwF 优于所测的 parameter-L2 baseline。" },
  { label: "响应损失选择", text: "比较 KD、cross-entropy、L1 与 L2；KD 略优，但作者认为优势不大，保持旧输出比损失名称更关键。" },
] as const;

export const table2Questions = [
  {
    id: "branch",
    label: "Where to branch?",
    setup: "把更多靠后的隐藏层设为 task-specific，与只在输出层分支比较。",
    observed: "作者未报告增加 task-specific layers 带来一致优势。",
    interpretation: "本实验没有说明所有网络都应只在输出层分支。",
    boundary: "结论限于论文测试的模型与任务；不能外推为通用架构定律。",
  },
  {
    id: "expansion",
    label: "Does expansion help?",
    setup: "比较 network expansion、network expansion + LwF 与原始 LwF。",
    observed: "Expansion + LwF 与原始 LwF 表现相近，同时引入额外计算与结构复杂度；单独 expansion 也没有替代 LwF 的一致优势。",
    interpretation: "在报告设置中，扩张网络没有显示抵偿其额外成本的稳定增益。",
    boundary: "不证明扩张在其他数据规模、模型或初始化下无效。",
  },
  {
    id: "warmup",
    label: "How important is warm-up?",
    setup: "对照 LwF、no warm-up LwF，以及对应的 fine-tuning / LFL 设置。",
    observed: "作者认为 warm-up 对 LwF 并非关键；移除 warm-up 对 fine-tuning 的旧任务保持更不利。",
    interpretation: "Warm-up 是可选训练安排，不是 LwF 旧响应约束的定义。",
    boundary: "只覆盖 Table 2 报告的消融；不保证所有优化配置都同样稳定。",
  },
  {
    id: "shared-lr",
    label: "Does a lower shared LR solve forgetting?",
    setup: "以 fine-tuning 降低 shared θₛ 学习率的配置，和论文 LwF 设置比较。",
    observed: "单独降低 shared θₛ 学习率没有避免明显旧任务退化，并会降低新任务表现。",
    interpretation: "减小参数步长不等于直接约束旧任务输出。",
    boundary: "这是作者测试的低学习率配置，不是所有学习率方案的结论。",
  },
] as const;

export const verdictClaimIds = [
  "claim:eliminates_forgetting",
  "claim:no_old_training_data",
  "claim:response_beats_parameter",
  "claim:foundation_models_scope",
] as const;

export const verdictQuestions: Record<(typeof verdictClaimIds)[number], string> = {
  "claim:eliminates_forgetting": "LwF 是否彻底消除了灾难性遗忘？",
  "claim:no_old_training_data": "适配新任务时，LwF 是否不需要旧任务训练数据？",
  "claim:response_beats_parameter": "在论文测试设置中，响应正则是否优于参数 L2 基线？",
  "claim:foundation_models_scope": "本文是否证明 LwF 可用于基础模型？",
};

export function arxivPaperRecord() {
  return "https://arxiv.org/abs/1606.09282v3";
}
