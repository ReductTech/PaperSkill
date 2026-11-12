type Vector2 = readonly [number, number];
type Matrix2 = readonly [Vector2, Vector2];

type Parent = { node: Scalar; derivative: number };
class Scalar {
  gradient = 0;
  readonly value: number;
  readonly parents: readonly Parent[];
  constructor(value: number, parents: readonly Parent[] = []) {
    this.value = value;
    this.parents = parents;
  }
}

const tape: Scalar[] = [];
function scalar(value: number, parents: readonly Parent[] = []) {
  const result = new Scalar(value, parents);
  tape.push(result);
  return result;
}
const add = (a: Scalar, b: Scalar) => scalar(a.value + b.value, [{ node: a, derivative: 1 }, { node: b, derivative: 1 }]);
const multiply = (a: Scalar, b: Scalar) => scalar(a.value * b.value, [{ node: a, derivative: b.value }, { node: b, derivative: a.value }]);
const divide = (a: Scalar, b: Scalar) => scalar(a.value / b.value, [{ node: a, derivative: 1 / b.value }, { node: b, derivative: -a.value / (b.value * b.value) }]);
const exponential = (a: Scalar) => {
  const value = Math.exp(a.value);
  return scalar(value, [{ node: a, derivative: value }]);
};
const logarithm = (a: Scalar) => scalar(Math.log(a.value), [{ node: a, derivative: 1 / a.value }]);
const negate = (a: Scalar) => scalar(-a.value, [{ node: a, derivative: -1 }]);

function vector(values: Vector2) { return values.map(value => scalar(value)) as [Scalar, Scalar]; }
function affine(input: readonly Scalar[], weights: Matrix2): [Scalar, Scalar] {
  return weights.map(row => row.reduce((sum, weight, index) => add(sum, multiply(scalar(weight), input[index])), scalar(0))) as [Scalar, Scalar];
}
function dot(left: readonly Scalar[], right: readonly Scalar[]) {
  return left.reduce((sum, value, index) => add(sum, multiply(value, right[index])), scalar(0));
}
function softmax(values: readonly Scalar[]) {
  const max = Math.max(...values.map(value => value.value));
  const exponentials = values.map(value => exponential(add(value, scalar(-max))));
  const total = exponentials.reduce(add, scalar(0));
  return exponentials.map(value => divide(value, total));
}

export const P4_TOY_EXPERIMENT = Object.freeze({
  title: "冻结单头 Attention 教学模型",
  hiddenWidth: 2,
  prompt: [[0.4, -0.3], [0.1, 0.5]] as Matrix2,
  imageTokens: [[0.8, -0.2], [0.25, 0.65]] as Matrix2,
  frozenWeights: Object.freeze({
    wq: [[0.8, 0.1], [-0.2, 0.7]] as Matrix2,
    wk: [[0.6, -0.3], [0.2, 0.9]] as Matrix2,
    wv: [[0.7, 0.4], [-0.1, 0.8]] as Matrix2,
    wo: [[0.9, 0.2], [0.1, 0.85]] as Matrix2,
  }),
  classifier: {
    weights: [[0.4, -0.3], [-0.2, 0.5]] as Matrix2,
    bias: [0.1, -0.1] as Vector2,
  },
  label: 1,
  learningRate: 0.12,
} as const);

export type P4ForwardState = Readonly<{
  inputTokens: readonly Vector2[];
  firstPromptQuery: Vector2;
  keys: readonly Vector2[];
  values: readonly Vector2[];
  firstPromptAttention: readonly number[];
  weightedValueContributions: readonly Vector2[];
  firstPromptContext: Vector2;
  firstPromptOutput: Vector2;
  promptOutputs: readonly [Vector2, Vector2];
  promptReadout: Vector2;
  logits: Vector2;
  probabilities: Vector2;
  loss: number;
}>;

export type P4TrainingTrace = Readonly<{
  initial: P4ForwardState;
  promptGradients: Matrix2;
  classifierWeightGradients: Matrix2;
  classifierBiasGradients: Vector2;
  updatedPrompt: Matrix2;
  updatedClassifierWeights: Matrix2;
  updatedClassifierBias: Vector2;
  updated: P4ForwardState;
  gradientCheck: Readonly<{ maxAbsoluteError: number; epsilon: number }>;
}>;

function readValues(values: readonly Scalar[]) { return values.map(value => value.value) as [number, number]; }

function runForward(
  promptValues: Matrix2,
  classifierWeights: Matrix2,
  classifierBias: Vector2,
  differentiate: boolean,
) {
  tape.length = 0;
  const prompt = promptValues.map(row => vector(row)) as [[Scalar, Scalar], [Scalar, Scalar]];
  const image = P4_TOY_EXPERIMENT.imageTokens.map(row => vector(row)) as [[Scalar, Scalar], [Scalar, Scalar]];
  const tokens = [...prompt, ...image];
  const { wq, wk, wv, wo } = P4_TOY_EXPERIMENT.frozenWeights;
  const queries = tokens.map(token => affine(token, wq));
  const keys = tokens.map(token => affine(token, wk));
  const values = tokens.map(token => affine(token, wv));
  const attention = queries.map(query => softmax(keys.map(key => divide(dot(query, key), scalar(Math.SQRT2)))));
  const outputs = attention.map(weights => {
    const context = [0, 1].map(dimension => weights.reduce(
      (sum, weight, sourceIndex) => add(sum, multiply(weight, values[sourceIndex][dimension])), scalar(0),
    )) as [Scalar, Scalar];
    return affine(context, wo);
  });
  const readout = [0, 1].map(dimension => divide(add(outputs[0][dimension], outputs[1][dimension]), scalar(2))) as [Scalar, Scalar];

  const classWeights = classifierWeights.map(row => vector(row)) as [[Scalar, Scalar], [Scalar, Scalar]];
  const classBias = vector(classifierBias);
  const logits = classWeights.map((row, classIndex) => add(dot(row, readout), classBias[classIndex])) as [Scalar, Scalar];
  const probabilities = softmax(logits) as [Scalar, Scalar];
  const loss = negate(logarithm(probabilities[P4_TOY_EXPERIMENT.label]));

  if (differentiate) {
    loss.gradient = 1;
    for (const current of [...tape].reverse()) {
      for (const parent of current.parents) parent.node.gradient += current.gradient * parent.derivative;
    }
  }

  const weightedValueContributions = attention[0].map((weight, sourceIndex) => Object.freeze(
    values[sourceIndex].map(value => weight.value * value.value) as [number, number],
  ));
  const firstPromptContext = Object.freeze([0, 1].map(dimension =>
    weightedValueContributions.reduce((sum, contribution) => sum + contribution[dimension], 0),
  )) as Vector2;
  const promptOutputs = Object.freeze([readValues(outputs[0]), readValues(outputs[1])]) as readonly [Vector2, Vector2];
  const state: P4ForwardState = Object.freeze({
    inputTokens: Object.freeze(tokens.map(token => Object.freeze(readValues(token)))) as readonly Vector2[],
    firstPromptQuery: Object.freeze(readValues(queries[0])) as Vector2,
    keys: Object.freeze(keys.map(key => Object.freeze(readValues(key)))) as readonly Vector2[],
    values: Object.freeze(values.map(item => Object.freeze(readValues(item)))) as readonly Vector2[],
    firstPromptAttention: Object.freeze(attention[0].map(weight => weight.value)),
    weightedValueContributions: Object.freeze(weightedValueContributions),
    firstPromptContext,
    firstPromptOutput: Object.freeze(readValues(outputs[0])) as Vector2,
    promptOutputs,
    promptReadout: Object.freeze(readValues(readout)) as Vector2,
    logits: Object.freeze(readValues(logits)) as Vector2,
    probabilities: Object.freeze(readValues(probabilities)) as Vector2,
    loss: loss.value,
  });
  return {
    state,
    promptGradients: prompt.map(row => readValues(row.map(value => scalar(value.gradient)))) as unknown as Matrix2,
    classifierWeightGradients: classWeights.map(row => readValues(row.map(value => scalar(value.gradient)))) as unknown as Matrix2,
    classifierBiasGradients: readValues(classBias.map(value => scalar(value.gradient))) as Vector2,
  };
}

const addMatrices = (left: Matrix2, right: Matrix2, scale: number): Matrix2 => left.map((row, i) => row.map((value, j) => value + scale * right[i][j])) as unknown as Matrix2;
const addVectors = (left: Vector2, right: Vector2, scale: number): Vector2 => left.map((value, i) => value + scale * right[i]) as unknown as Vector2;
const maxAbsolute = (values: readonly number[]) => Math.max(...values.map(Math.abs));

function buildTrainingTrace(): P4TrainingTrace {
  const { prompt, classifier, learningRate } = P4_TOY_EXPERIMENT;
  const before = runForward(prompt, classifier.weights, classifier.bias, true);
  const updatedPrompt = addMatrices(prompt, before.promptGradients, -learningRate);
  const updatedClassifierWeights = addMatrices(classifier.weights, before.classifierWeightGradients, -learningRate);
  const updatedClassifierBias = addVectors(classifier.bias, before.classifierBiasGradients, -learningRate);
  const after = runForward(updatedPrompt, updatedClassifierWeights, updatedClassifierBias, false);

  const epsilon = 1e-6;
  const finiteDifferenceErrors = prompt.flatMap((row, i) => row.map((value, j) => {
    const plus = prompt.map(item => [...item]) as [[number, number], [number, number]];
    const minus = prompt.map(item => [...item]) as [[number, number], [number, number]];
    plus[i][j] = value + epsilon;
    minus[i][j] = value - epsilon;
    const plusLoss = runForward(plus, classifier.weights, classifier.bias, false).state.loss;
    const minusLoss = runForward(minus, classifier.weights, classifier.bias, false).state.loss;
    const numericGradient = (plusLoss - minusLoss) / (2 * epsilon);
    return Math.abs(numericGradient - before.promptGradients[i][j]);
  }));

  return Object.freeze({
    initial: before.state,
    promptGradients: before.promptGradients,
    classifierWeightGradients: before.classifierWeightGradients,
    classifierBiasGradients: before.classifierBiasGradients,
    updatedPrompt,
    updatedClassifierWeights,
    updatedClassifierBias,
    updated: after.state,
    gradientCheck: Object.freeze({ maxAbsoluteError: maxAbsolute(finiteDifferenceErrors), epsilon }),
  });
}

export function runP4Forward(prompt: Matrix2, classifierWeights: Matrix2, classifierBias: Vector2) {
  return runForward(prompt, classifierWeights, classifierBias, false).state;
}

export const P4_TRAINING_TRACE = buildTrainingTrace();
