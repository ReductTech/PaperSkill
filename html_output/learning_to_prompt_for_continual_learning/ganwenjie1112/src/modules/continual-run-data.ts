import { KEY_ANGLES_DEGREES, promptPoolConfig } from "./prompt-retrieval-data";

export type RunSample = Readonly<{
  id: string;
  symbol: string;
  angleDegrees: number;
  label: string | null;
  source: string;
}>;

export type RunSelection = Readonly<{
  sample: RunSample;
  selected: readonly number[];
  distances: Readonly<Record<number, number>>;
}>;

export type BatchTrace = Readonly<{
  id: string;
  task: string;
  batch: string;
  samples: readonly RunSelection[];
  selectedUnion: readonly number[];
  startAngles: readonly number[];
  endAngles: readonly number[];
  gradientBySlot: Readonly<Record<number, number>>;
  optimizerStep: number;
}>;

export type RunStage = Readonly<{
  id: string;
  title: string;
  short: string;
  kind: "init" | "forward" | "step" | "boundary" | "inference";
  note: string;
  parameterVersion: number;
  batch: BatchTrace | null;
  query: RunSelection | null;
  angles: readonly number[];
}>;

const radians = (degrees: number) => degrees * Math.PI / 180;
const wrapDegrees = (degrees: number) => ((degrees % 360) + 360) % 360;

function distance(queryDegrees: number, keyDegrees: number) {
  return 1 - Math.cos(radians(queryDegrees - keyDegrees));
}

function select(sample: RunSample, keyAngles: readonly number[]): RunSelection {
  const ranking = keyAngles.map((angleDegrees, offset) => ({
    index: offset + 1,
    distance: distance(sample.angleDegrees, angleDegrees),
  })).sort((left, right) => left.distance - right.distance || left.index - right.index);
  const selected = ranking.slice(0, promptPoolConfig.topN);
  return Object.freeze({
    sample,
    selected: Object.freeze(selected.map(candidate => candidate.index)),
    distances: Object.freeze(Object.fromEntries(selected.map(candidate => [candidate.index, candidate.distance]))),
  });
}

function makeBatch(
  id: string,
  task: string,
  batch: string,
  samples: readonly RunSample[],
  startAngles: readonly number[],
  optimizerStep: number,
): BatchTrace {
  const selectedSamples = samples.map(sample => select(sample, startAngles));
  const gradientBySlot: Record<number, number> = {};
  selectedSamples.forEach(({ sample, selected }) => selected.forEach(index => {
    const keyAngle = radians(startAngles[index - 1]);
    const queryAngle = radians(sample.angleDegrees);
    const gradient = -Math.sin(queryAngle - keyAngle);
    gradientBySlot[index] = (gradientBySlot[index] ?? 0) + gradient;
  }));
  const learningRate = 0.045;
  const endAngles = startAngles.map((angle, offset) => {
    const gradient = gradientBySlot[offset + 1];
    return gradient === undefined ? angle : wrapDegrees(angle - learningRate * gradient * 180 / Math.PI);
  });
  return Object.freeze({
    id,
    task,
    batch,
    samples: Object.freeze(selectedSamples),
    selectedUnion: Object.freeze([...new Set(selectedSamples.flatMap(item => item.selected))].sort((a, b) => a - b)),
    startAngles: Object.freeze([...startAngles]),
    endAngles: Object.freeze(endAngles),
    gradientBySlot: Object.freeze(gradientBySlot),
    optimizerStep,
  });
}

export const P8_INITIAL_ANGLES: readonly number[] = Object.freeze([...KEY_ANGLES_DEGREES]);

const task1Batch1 = makeBatch("t1-b1", "Task 1", "Batch 1", [
  { id: "a", symbol: "x_A", angleDegrees: 12, label: "y_A", source: "P5 Query A · 教学向量" },
  { id: "b", symbol: "x_B", angleDegrees: 116, label: "y_B", source: "P5 Query B · 教学向量" },
], P8_INITIAL_ANGLES, 1);

const task1Batch2 = makeBatch("t1-b2", "Task 1", "Batch 2", [
  { id: "a2", symbol: "x_A′", angleDegrees: 24, label: "y_A′", source: "合成教学 Query · 24°" },
], task1Batch1.endAngles, 2);

const task2Batch1 = makeBatch("t2-b1", "Task 2", "Batch 1", [
  { id: "c", symbol: "x_C", angleDegrees: 205, label: "y_C", source: "合成教学 Query · 205°" },
], task1Batch2.endAngles, 3);

const inferenceSample: RunSample = Object.freeze({
  id: "test",
  symbol: "x_test",
  angleDegrees: 116,
  label: null,
  source: "P5 Query B 方向 · 测试无标签、无任务 ID",
});
const inferenceQuery = select(inferenceSample, task2Batch1.endAngles);

export const P8_BATCHES = Object.freeze({ task1Batch1, task1Batch2, task2Batch1 });

export const P8_STAGES: readonly RunStage[] = Object.freeze([
  Object.freeze({
    id: "initialization", title: "初始化", short: "初始化", kind: "init",
    note: "构造一组固定编号的 Key–Prompt 槽位与共享分类器，冻结输入嵌入层和 Transformer。基础 L2P 不依赖旧样本回放。",
    parameterVersion: 0, batch: null, query: null, angles: P8_INITIAL_ANGLES,
  }),
  Object.freeze({
    id: "task1-batch1", title: "Task 1 · Batch 1 前向", short: "T1 / B1 前向", kind: "forward",
    note: "两个样本分别从无 Prompt 的冻结 ViT 取得 Query；各自依据当前 K 选择 Top‑5，再用同一份 Θ₀ 完成分类前向。",
    parameterVersion: 0, batch: task1Batch1, query: null, angles: task1Batch1.startAngles,
  }),
  Object.freeze({
    id: "task1-step1", title: "Task 1 · Batch 1 写回", short: "B1 一次写回", kind: "step",
    note: "两样本损失先累积，再执行一次更新。示例 Key 在单位圆角度上按余弦匹配损失的解析梯度连续移动；Prompt 与 φ 只显示符号状态，不伪造高维数值。",
    parameterVersion: 1, batch: task1Batch1, query: null, angles: task1Batch1.startAngles,
  }),
  Object.freeze({
    id: "task1-batch2", title: "Task 1 · Batch 2 重新检索", short: "T1 / B2 重检索", kind: "forward",
    note: "第二个 Batch 读取 Θ₁；它重新计算 S(x)，不沿用 Batch 1 的选集。选中的 Key–Prompt 配对编号仍固定。",
    parameterVersion: 1, batch: task1Batch2, query: null, angles: task1Batch2.startAngles,
  }),
  Object.freeze({
    id: "task1-step2", title: "Task 1 · Batch 2 写回", short: "B2 一次写回", kind: "step",
    note: "Batch 2 的样本也只在整个批次完成后更新一次；共享分类器与命中的 Prompt/Key 继续沿用同一身份。",
    parameterVersion: 2, batch: task1Batch2, query: null, angles: task1Batch2.startAngles,
  }),
  Object.freeze({
    id: "task-boundary", title: "Task 1 → Task 2", short: "任务交接", kind: "boundary",
    note: "边界只标记当前训练数据切换。池没有重建，Key、Prompt 和 φ 从 Θ₂ 原样继承；基础检索本身不读取任务 ID。",
    parameterVersion: 2, batch: null, query: null, angles: task1Batch2.endAngles,
  }),
  Object.freeze({
    id: "task2-batch1", title: "Task 2 · Batch 1 前向", short: "T2 / B1 前向", kind: "forward",
    note: "新任务样本用继承的 Key 重新排名。这个单 Query 是标明角度的合成教学例子，不是论文样本或实验测量。",
    parameterVersion: 2, batch: task2Batch1, query: null, angles: task2Batch1.startAngles,
  }),
  Object.freeze({
    id: "task2-step1", title: "Task 2 · Batch 1 写回", short: "T2 一次写回", kind: "step",
    note: "Task 2 的梯度在当前 Batch 内累计后写回同一个池；此后测试读取的是最新状态 Θ₃。",
    parameterVersion: 3, batch: task2Batch1, query: null, angles: task2Batch1.startAngles,
  }),
  Object.freeze({
    id: "inference", title: "最终测试推断", short: "测试推断", kind: "inference",
    note: "只输入 x_test：用普通 Eq. (3) 重算 Top‑5，再走 Prompt 条件分类。没有标签、Loss、反向传播、优化器写回或任务 ID。",
    parameterVersion: 3, batch: null, query: inferenceQuery, angles: task2Batch1.endAngles,
  }),
]);

export function interpolateKeyAngles(start: readonly number[], end: readonly number[], progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return Object.freeze(start.map((angle, offset) => {
    const delta = ((end[offset] - angle + 540) % 360) - 180;
    return wrapDegrees(angle + delta * t);
  }));
}
