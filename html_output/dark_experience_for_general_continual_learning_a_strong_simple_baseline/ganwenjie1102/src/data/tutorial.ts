import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Dark Experience for General Continual Learning: a Strong, Simple Baseline",
    titleZh: "DER / DER++：用有限记忆保留历史预测",
    paperUrl: "https://arxiv.org/abs/2004.07211v2",
    venue: "NeurIPS 2020",
    scope: "S1–S8 · DER / DER++ 完整交互教程",
  },
  chapters: [
    { kind: "chapter", id: "U1-replay-entry", title: "旧数据已过去，\n旧判断如何留下？", summary: "从持续学习的真实约束出发，先看有限回放能做什么，再看它还没记录什么。", navTitle: "回放起点", modules: [{ kind: "module", id: "replay-and-soft-targets", title: "有限回放与历史响应", componentId: "der-replay-entry" }] },
    { kind: "chapter", id: "U2-probability", title: "历史响应变了，\n怎样度量与约束？", summary: "沿用同一 x₁ 的三类响应，先在共用实验台观察变化，再从逐类贡献理解 KL 与平方匹配。", navTitle: "响应比较", modules: [{ kind: "module", id: "probability-constraint", title: "KL 与 Logit Matching 的统一比较", componentId: "der-response-comparison" }] },
    { kind: "chapter", id: "U3-logit-memory", title: "留下历史响应，\n再看两轮训练如何发生。", summary: "先追踪监督来源、冻结与更新的先后关系，再自主播放完整生命周期，核对每一步。", navTitle: "冻结与回放", modules: [{ kind: "module", id: "memory-snapshot", title: "历史监督的来源与两轮生命周期", componentId: "der-memory-snapshot" }] },
    { kind: "chapter", id: "U4-reservoir-and-step", title: "空间有限，\n谁能继续留下？", summary: "每条候选都已参与当前训练。在线选留决定的是未来的回放机会。", navTitle: "在线记忆", modules: [{ kind: "module", id: "reservoir", title: "有限记忆的在线选留", componentId: "der-reservoir" }, { kind: "module", id: "der-training-step", title: "DER 单步联合训练", componentId: "der-training-step" }] },
    { kind: "chapter", id: "U5-consistency-and-correction", title: "视图会改变，\n历史目标也可能出错。", summary: "先看不同视图为何共用同一个 z，再问保持旧行为为什么仍需要真实标签。", navTitle: "增强与标签", modules: [{ kind: "module", id: "augmentation", title: "不同视图与隐式一致性", componentId: "der-augmentation" }, { kind: "module", id: "der-plus", title: "旧标签与 DER++", componentId: "der-plus" }] },
    { kind: "chapter", id: "U6-complete-system", title: "从空池到预测，\n亲自走完四轮学习。", summary: "让 θ、M、N 与记录身份贯穿完整执行，核对读取、合并更新、写入和跨轮继承。", navTitle: "四轮贯通", modules: [{ kind: "module", id: "workbench", title: "完整四轮算法工作台", componentId: "der-workbench" }] },
    { kind: "chapter", id: "U7-evidence-and-limits", title: "执行闭环之后，\n让证据回答效果。", summary: "区分数据集、测试协议、容量和评测时机，同时看优势与不占优的表项。", navTitle: "证据与局限", modules: [{ kind: "module", id: "evidence", title: "实验与方法边界", componentId: "der-evidence" }] },
  ],
};
