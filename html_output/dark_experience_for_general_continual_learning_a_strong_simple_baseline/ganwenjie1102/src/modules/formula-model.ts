import { probabilityComparison, logitComparison } from "./math-model.ts";

/** Positive binary support; the scalar q controls both (q, 1-q). */
export function binaryKL(p: number, q: number) {
  const forward = probabilityComparison([p, 1-p], [q, 1-q]);
  const reverse = probabilityComparison([q, 1-q], [p, 1-p]);
  return { ...forward, reverse: reverse.kl, slope: (q-p)/(q*(1-q)) };
}
export function squaredCoordinate(delta: number) {
  const result = logitComparison([0], [delta]);
  return { loss: result.squaredDistance, slope: result.gradient[0] };
}
export function coordinateStep(delta: number, eta = .2) {
  if (!Number.isFinite(eta) || eta < 0) throw new RangeError("Nonnegative finite learning rate required");
  return delta - eta * squaredCoordinate(delta).slope;
}
export function retentionProbability(K: number, n: number) {
  if (!Number.isInteger(K) || K < 1 || !Number.isInteger(n) || n < 1) throw new RangeError("Positive integer capacity/count required");
  return Math.min(1, K/n);
}
