/** P2/P3 共用的三样本分类教学例子，非论文实测。
 * 候选配置输出整张 logits 表；所有概率和 Bayes 量均从未舍入值计算。
 * 网络图只示意结构；这里展示预设 Forward 输出，不模拟网络训练。
 */
export const softmax = (logits: number[]): [number, number, number] => {
  const maximum = Math.max(...logits);
  const weights = logits.map((value) => Math.exp(value - maximum));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map((value) => value / total) as [number, number, number];
};

export const PARAMETER_STATES = [
  { id: "theta-a", candidate: "A" as const, index: 1, prior: 0.5, sampleLogits: [[-0.87, -0.97, -1.61], [-1.5, 0, -1.16], [-1.3, -0.78, 0]] },
  { id: "theta-b", candidate: "B" as const, index: 2, prior: 0.35, sampleLogits: [[0, -1.3, -2.34], [-2.08, 0, -2.08], [-3.14, -3.14, 0]] },
  { id: "theta-c", candidate: "C" as const, index: 3, prior: 0.15, sampleLogits: [[0, -2.4, -3.09], [-2.78, 0, -2.78], [-3.64, -3.64, 0]] },
].map((state) => {
  const sampleProbabilities = state.sampleLogits.map(softmax);
  const datasetProbabilities = sampleProbabilities.map((row, sample) => row[sample]) as [number, number, number];
  return { ...state, logits: state.sampleLogits[0] as [number, number, number], probabilities: sampleProbabilities[0], sampleProbabilities, datasetProbabilities };
});

export type ParameterState = typeof PARAMETER_STATES[number];
export const datasetLikelihood = (state: ParameterState) => state.datasetProbabilities.reduce((product, probability) => product * probability, 1);
export const negativeLogLikelihood = (state: ParameterState) => -Math.log(datasetLikelihood(state));
export const EXAMPLE_EVIDENCE = PARAMETER_STATES.reduce((sum, state) => sum + state.prior * datasetLikelihood(state), 0);
