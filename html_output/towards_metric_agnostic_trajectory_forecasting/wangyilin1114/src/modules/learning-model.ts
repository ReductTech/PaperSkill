import { distanceStep, endpoints, greedyCoverage, sampleRoad, type Point, type Sample } from './road-model';

export function laplace(x: number, mean: number, scale: number) {
  return Math.exp(-Math.abs(x - mean) / scale) / (2 * scale);
}

export type Mixture = { means: number[]; leftWeight: number };
export const initialMixture: Mixture = { means: [-1.7, 1.4], leftWeight: .45 };
export const trainingOutcomes = [-4.4, -3.9, -3.6, 3.4, 3.7, 4, 4.4, 4.8];

export function mixtureLoss(model: Mixture, wta: boolean) {
  return -trainingOutcomes.reduce((sum, x) => {
    if (wta) {
      const winner = Math.abs(x - model.means[0]) <= Math.abs(x - model.means[1]) ? 0 : 1;
      return sum + Math.log(Math.max(1e-12, laplace(x, model.means[winner], 1.25)));
    }
    const density = model.leftWeight * laplace(x, model.means[0], 1.25)
      + (1 - model.leftWeight) * laplace(x, model.means[1], 1.25);
    return sum + Math.log(Math.max(1e-12, density));
  }, 0) / trainingOutcomes.length;
}

export function mixtureStep(model: Mixture, wta: boolean) {
  const epsilon = .001;
  const gradient = model.means.map((_, i) => {
    const high = { ...model, means: model.means.map((v, j) => j === i ? v + epsilon : v) };
    const low = { ...model, means: model.means.map((v, j) => j === i ? v - epsilon : v) };
    return (mixtureLoss(high, wta) - mixtureLoss(low, wta)) / (2 * epsilon);
  });
  const weightGradient = wta ? 0 : (mixtureLoss({ ...model, leftWeight: model.leftWeight + epsilon }, false)
    - mixtureLoss({ ...model, leftWeight: model.leftWeight - epsilon }, false)) / (2 * epsilon);
  const before = mixtureLoss(model, wta);
  for (const rate of [.45, .2, .08, .03]) {
    const candidate = { means: model.means.map((value, i) => value - rate * gradient[i]),
      leftWeight: Math.max(.06, Math.min(.94, model.leftWeight - rate * weightGradient)) };
    if (mixtureLoss(candidate, wta) <= before) return candidate;
  }
  return model;
}

export function optimizeDistance(samples: Point[], count: number) {
  const seeds = count === 2 ? [endpoints[1], endpoints[0]] : endpoints.slice(0, count);
  let picks = seeds.map(point => ({ ...point }));
  for (let i = 0; i < 250; i++) picks = distanceStep(samples, picks);
  return picks;
}

export const conflictSamples: Sample[] = sampleRoad(20).map((point, index) => {
  const branch = index < 20 ? 0 : index < 77 ? 1 : 2;
  const mean = endpoints[branch];
  const width = branch === 1 ? 1.55 : .14;
  return { ...point, x: mean.x + (point.x - mean.x) * width,
    y: mean.y + (point.y - mean.y) * width };
});
export const conflictDistance = optimizeDistance(conflictSamples, 2);
export const conflictWindow = greedyCoverage(conflictSamples, 2, .6).selected.map(row => row.point);
