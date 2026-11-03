/** Synthetic teaching inputs. All views derive values from these definitions. */
import { MODEL_CLASSES } from "../data/model-classes.ts";
export const CLASSES = MODEL_CLASSES;
export { PROBABILITY_CLASSES } from "../data/model-classes.ts";
export const HISTORY_Z = [2, 1, 0] as const;
export const LABEL_OLD = HISTORY_Z;
export const LABEL_CURRENT = [2, 0, 1] as const;
export const REFERENCE_P = [0.8, 0.2] as const;


/** S2/S3 share x₁ and class coordinates. D1 has a separate, given later response. */
export const RESPONSE_CASES = [
  { id: "equal", label: "完全一致", values: HISTORY_Z, conclusion: "当前响应与历史目标完全一致，两种损失都为 0。" },
  { id: "preference", label: "类别偏好变化", values: LABEL_CURRENT, conclusion: "Claude 仍最高，但 GPT 与 DeepSeek 的排序交换了。KL 与平方距离都检测到偏离。" },
  { id: "shifted", label: "所有 logit 同加 1", values: [3, 2, 1], conclusion: "softmax 不区分统一加常数的变化，因此 KL 为 0；原始 logits 改变，平方距离为 3。两种约束各有含义。" },
] as const;

export function responseComparison(index: number) {
  const item = RESPONSE_CASES[index];
  if (!item) throw new Error("未知响应比较状态。");
  const result = logitComparison(HISTORY_Z, item.values);
  return { ...result, klGradient: probabilityComparison(result.p, result.q).gradient };
}

export const PROBABILITY_CASES = [
  { id: "near", label: "稍有偏离", values: [0.6, 0.4], conclusion: `两次都更倾向 ${CLASSES[0]}，但概率分配已经改变。历史约束仍然有必要。` },
  { id: "equal", label: "与旧分布相同", values: [0.8, 0.2], conclusion: "q 与固定的 p 完全相同，KL 为 0：没有需要惩罚的分布偏离。" },
  { id: "reversed", label: "偏好反转", values: [0.2, 0.8], conclusion: `当前分布转而更倾向 ${CLASSES[1]}，对固定旧分布的偏离更大，KL 随之增大。` },
] as const;

export const LOGIT_CASES = [
  { id: "swapped", label: `${CLASSES[0]}、${CLASSES[1]} 分数交换`, values: [1, 2, 0], conclusion: `${CLASSES[0]} 的分数下降，${CLASSES[1]} 的分数上升。平方匹配逐类累计这些偏离。` },
  { id: "shifted", label: "全部分数增加 1", values: [3, 2, 1], conclusion: "每类分数都增加 1，概率却完全不变。概率匹配与 logits 平方匹配约束的对象不同。" },
] as const;

function finiteVector(values: readonly number[]) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error("需要非空、有限的向量。");
}

export function softmax(values: readonly number[]): number[] {
  finiteVector(values);
  const maximum = Math.max(...values);
  const exponents = values.map((value) => Math.exp(value - maximum));
  const sum = exponents.reduce((total, value) => total + value, 0);
  return exponents.map((value) => value / sum);
}

export function probabilityComparison(p: readonly number[], q: readonly number[]) {
  finiteVector(p); finiteVector(q);
  if (p.length !== q.length) throw new Error("类别坐标必须一致。");
  for (const distribution of [p, q]) {
    if (distribution.some((value) => value <= 0) || Math.abs(distribution.reduce((a, b) => a + b, 0) - 1) > 1e-10) throw new Error("需要严格为正、归一化的概率。");
  }
  const terms = p.map((value, index) => value * Math.log(value / q[index]));
  const entropy = -p.reduce((total, value) => total + value * Math.log(value), 0);
  const crossEntropy = -p.reduce((total, value, index) => total + value * Math.log(q[index]), 0);
  const rawKL = terms.reduce((total, value) => total + value, 0);
  return { p: [...p], q: [...q], terms, entropy, crossEntropy, kl: Math.abs(rawKL) < 1e-14 ? 0 : rawKL, gradient: q.map((value, index) => value - p[index]) };
}

export function logitComparison(z: readonly number[], a: readonly number[]) {
  finiteVector(z); finiteVector(a);
  if (z.length !== a.length) throw new Error("类别坐标必须一致。");
  const differences = a.map((value, index) => value - z[index]);
  const squares = differences.map((value) => value * value);
  const p = softmax(z); const q = softmax(a);
  return { z: [...z], a: [...a], differences, squares, squaredDistance: squares.reduce((total, value) => total + value, 0), gradient: differences.map((value) => 2 * value), p, q, probabilityKL: probabilityComparison(p, q).kl };
}

export const SNAPSHOT_STEPS = [
  { title: "生成输出", parameter: "θₜ", text: "原图的当前训练视图进入唯一网络，得到本步更新前的输出。此时它还只是候选。" },
  { title: "复制并冻结", parameter: "θₜ", text: "复制输出的数值，得到固定目标 z。保存的是数值，不是另一台旧网络或反向传播图。" },
  { title: "当前参数继续更新", parameter: "θₜ₊₁", text: "本步联合损失更新当前网络；已复制的 z 不随之重算。更新之后，才决定是否把原图与 z 写入记忆。" },
] as const;

export const formatValue = (value: number, digits = 3) => value.toFixed(digits);
