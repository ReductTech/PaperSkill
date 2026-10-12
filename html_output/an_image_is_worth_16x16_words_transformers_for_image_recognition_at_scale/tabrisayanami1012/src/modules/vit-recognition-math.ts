/** Two-token teaching model, NOT an image encoder. All coordinates and fixed
 * projections are supplied by us; only the first coefficient of W_K is trained. */
export const INITIAL_ATTENTION_PARAMETER = 2;
export const TRAINING_STEPS = 8;
export type Scene = 'house' | 'boat';

export function recognition(a: number, context: number) {
  if (!Number.isFinite(a) || a < -20 || a > 20 || !Number.isFinite(context) || Math.abs(context) > 1) {
    throw new Error('Teaching domain: -20 <= a <= 20 and -1 <= context <= 1');
  }
  const inputs = [[1, -1], [0, context]];
  const q = inputs.map(x => x[0]); // W_Q = [1, 0]^T
  const k = inputs.map(x => a * x[0]); // W_K = [a, 0]^T
  const v = inputs.map(x => x[1]); // W_V = [0, 1]^T
  const scores = k.map(x => q[0] * x); // d_k = 1, so sqrt(d_k) = 1
  const max = Math.max(...scores);
  const exps = scores.map(x => Math.exp(x - max));
  const weights = exps.map(x => x / exps.reduce((s, e) => s + e, 0));
  const contributions = weights.map((w, i) => w * v[i]);
  const output = contributions.reduce((s, x) => s + x, 0);
  const logits = [2 * output, -2 * output]; // fixed classifier, house first
  const houseProbability = 1 / (1 + Math.exp(-4 * output));
  const target = context >= 0 ? 1 : 0;
  const loss = -(target ? Math.log(houseProbability) : Math.log1p(-houseProbability));
  const outputDerivative = -(1 + context) * weights[0] * weights[1];
  const gradient = 4 * (houseProbability - target) * outputDerivative;
  return { a, context, inputs, q, k, v, scores, weights, contributions, output, logits,
    houseProbability, loss, gradient, outputDerivative,
    prediction: houseProbability >= 0.5 ? 'house' as const : 'boat' as const };
}

/** SGD, learning rate 1, on one fixed house example. Boat is a comparison only. */
export function recognitionHistory() {
  let a = INITIAL_ATTENTION_PARAMETER;
  return Array.from({ length: TRAINING_STEPS + 1 }, (_, step) => {
    const row = { step, ...recognition(a, 1) };
    a -= row.gradient;
    return row;
  });
}

/** A 2x2 grayscale patch and a hand-set linear edge filter. This is a separate
 * pixel-level arithmetic illustration, not the producer of the two-token inputs. */
export function edgeResponse(pattern: 'horizontal' | 'vertical' | 'flat') {
  const pixels = pattern === 'horizontal' ? [1, 1, 0, 0] : pattern === 'vertical' ? [1, 0, 1, 0] : [1, 1, 1, 1];
  const coefficients = [0.5, 0.5, -0.5, -0.5];
  return { pixels, coefficients, response: pixels.reduce((s, x, i) => s + x * coefficients[i], 0) };
}
