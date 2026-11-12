import { computeCandidates, promptPoolConfig, type QueryId } from "./prompt-retrieval-data";

export type RetrievalMode = "base-training" | "diversified-training" | "inference";

const HISTORY_COUNTS = Object.freeze([22, 20, 16, 14, 10, 6, 4, 3, 3, 2] as const);
const historyTotal = HISTORY_COUNTS.reduce((sum, count) => sum + count, 0);

export const P9_HISTORY = Object.freeze(HISTORY_COUNTS.map((count, offset) => Object.freeze({
  index: offset + 1,
  count,
  frequency: count / historyTotal,
})));

export type RetrievalComparisonRow = Readonly<{
  index: number;
  distance: number;
  historyFrequency: number;
  weightedScore: number;
  baseRank: number;
  diversifiedRank: number;
  baseSelected: boolean;
  diversifiedSelected: boolean;
}>;

export type RetrievalComparison = Readonly<{
  query: QueryId;
  rows: readonly RetrievalComparisonRow[];
  baseSelection: readonly number[];
  diversifiedSelection: readonly number[];
}>;

export function computeRetrievalComparison(query: QueryId): RetrievalComparison {
  const distances = computeCandidates(query);
  const baseRanking = [...distances].sort((left, right) => left.distance - right.distance || left.index - right.index);
  const weightedRanking = distances.map(candidate => ({
    ...candidate,
    weightedScore: candidate.distance * P9_HISTORY[candidate.index - 1].frequency,
  })).sort((left, right) => left.weightedScore - right.weightedScore || left.index - right.index);
  const baseRanks = new Map(baseRanking.map((candidate, offset) => [candidate.index, offset + 1]));
  const weightedRanks = new Map(weightedRanking.map((candidate, offset) => [candidate.index, offset + 1]));
  const baseSelection = Object.freeze(baseRanking.slice(0, promptPoolConfig.topN).map(candidate => candidate.index));
  const diversifiedSelection = Object.freeze(weightedRanking.slice(0, promptPoolConfig.topN).map(candidate => candidate.index));
  return Object.freeze({
    query,
    rows: Object.freeze(distances.map(candidate => Object.freeze({
      index: candidate.index,
      distance: candidate.distance,
      historyFrequency: P9_HISTORY[candidate.index - 1].frequency,
      weightedScore: candidate.distance * P9_HISTORY[candidate.index - 1].frequency,
      baseRank: baseRanks.get(candidate.index)!,
      diversifiedRank: weightedRanks.get(candidate.index)!,
      baseSelected: baseSelection.includes(candidate.index),
      diversifiedSelected: diversifiedSelection.includes(candidate.index),
    }))),
    baseSelection,
    diversifiedSelection,
  });
}

export const P9_ABLATIONS = Object.freeze([
  Object.freeze({ id: "full", name: "完整 L2P", accuracy: 81.14, forgetting: 4.64, removed: "无；Prompt Pool、独立 Key–Prompt 配对与多样化选择均保留。", lesson: "作为同一 5-datasets 配置的参照。" }),
  Object.freeze({ id: "no-pool", name: "无 Prompt Pool", accuracy: 51.96, forgetting: 26.60, removed: "移除多个 Prompt 槽位，改用单个共享 Prompt。", lesson: "回扣 P4：同一 Prompt 可能承受不同任务的更新冲突。" }),
  Object.freeze({ id: "no-independent-key", name: "无独立 Key–Prompt 配对", accuracy: 58.33, forgetting: 20.45, removed: "不再学习独立 Key，用 Prompt 均值替代检索表示。", lesson: "回扣 P5：寻址向量与注入分类的 Prompt 分工。" }),
  Object.freeze({ id: "no-diversification", name: "无多样化选择", accuracy: 62.26, forgetting: 17.84, removed: "关闭历史频率加权，训练选择恢复普通 Eq. (3)。", lesson: "在这一 5-datasets 设置里，移除可选多样化分支后结果变差。" }),
]);

export const P9_CLASS_INCREMENTAL_RESULTS = Object.freeze([
  Object.freeze({ dataset: "Split CIFAR-100", accuracy: "83.83 ± 0.04", forgetting: "7.63 ± 0.30" }),
  Object.freeze({ dataset: "5-datasets", accuracy: "81.14 ± 0.93", forgetting: "4.64 ± 0.52" }),
]);

export const P9_PROTOCOL_RESULTS = Object.freeze([
  Object.freeze({ protocol: "领域增量", dataset: "CORe50", metric: "Test Accuracy", value: "78.33 ± 0.06", source: "Table 3", note: "基础 L2P，零回放。" }),
  Object.freeze({ protocol: "Task-agnostic", dataset: "Gaussian-scheduled CIFAR-100", metric: "Test Accuracy", value: "88.34 ± 0.14", source: "Table 4", note: "基础 L2P，零回放；合成的平滑分布漂移基准。" }),
]);

export const P9_ARCHITECTURE_RESULTS = Object.freeze([
  Object.freeze({ method: "SupSup [60]", backbone: "ResNet18", accuracy: "28.34 ± 2.45", gap: "52.07" }),
  Object.freeze({ method: "DualNet [44]", backbone: "ResNet18", accuracy: "40.14 ± 1.64", gap: "40.27" }),
  Object.freeze({ method: "L2P (ours)", backbone: "ViT-B/16", accuracy: "83.83 ± 0.04", gap: "7.02" }),
]);

export const P9_FIGURE3_INTERPRETATION = Object.freeze([
  Object.freeze({ dataset: "Split CIFAR-100", pattern: "作者将图中较高的跨任务 Prompt 共用，解释为同一来源任务之间较强的相似性。" }),
  Object.freeze({ dataset: "5-datasets", pattern: "作者观察到更强的任务特异性；该完整实验配置使用了可选的多样化选择。" }),
]);
