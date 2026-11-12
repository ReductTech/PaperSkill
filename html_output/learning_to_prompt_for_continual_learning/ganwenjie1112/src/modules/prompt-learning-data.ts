import { buildSelectionSnapshot, KEYS, promptPoolConfig, QUERIES, type QueryId, type Vector2 } from "./prompt-retrieval-data";

export type BatchSample = Readonly<{
  id: QueryId;
  symbol: string;
  queryLabel: string;
  labelSymbol: string;
  logitsSymbol: string;
  selected: readonly number[];
  distances: Readonly<Record<number, number>>;
}>;

export const P7_BATCH_SAMPLES: readonly BatchSample[] = Object.freeze((["A", "B"] as const).map(id => {
  const snapshot = buildSelectionSnapshot(id);
  return Object.freeze({
    id,
    symbol: `x_${id}`,
    queryLabel: `q_${id}`,
    labelSymbol: `y_${id}`,
    logitsSymbol: `z_${id}`,
    selected: snapshot.selectedKeyIndices,
    distances: Object.freeze(Object.fromEntries(snapshot.selected.map(candidate => [candidate.index, candidate.distance]))),
  });
}));

export const P7_COMMON_INDICES: readonly number[] = Object.freeze(
  P7_BATCH_SAMPLES[0].selected.filter(index => P7_BATCH_SAMPLES[1].selected.includes(index)),
);

export const P7_BATCH_INDICES: readonly number[] = Object.freeze(
  [...new Set(P7_BATCH_SAMPLES.flatMap(sample => sample.selected))].sort((left, right) => left - right),
);

export const P7_UNTOUCHED_INDICES: readonly number[] = Object.freeze(
  Array.from({ length: promptPoolConfig.poolSize }, (_, offset) => offset + 1).filter(index => !P7_BATCH_INDICES.includes(index)),
);

export function gradientSourcesForSlot(index: number) {
  const selectedBy = P7_BATCH_SAMPLES.filter(sample => sample.selected.includes(index)).map(sample => sample.id);
  return Object.freeze({
    prompts: selectedBy,
    keys: selectedBy,
    classifier: Object.freeze(["A", "B"] as const),
  });
}

export function selectedDistanceTotal(sample: BatchSample) {
  return sample.selected.reduce((sum, index) => sum + sample.distances[index], 0);
}

/** Gradient of 1 − cos(q, k) with respect to k. */
export function cosineKeyGradient(query: Vector2, key: Vector2): Vector2 {
  const qNorm = Math.hypot(query.x, query.y);
  const kNorm = Math.hypot(key.x, key.y);
  const q = { x: query.x / qNorm, y: query.y / qNorm };
  const k = { x: key.x / kNorm, y: key.y / kNorm };
  const cosine = q.x * k.x + q.y * k.y;
  return { x: (cosine * k.x - q.x) / kNorm, y: (cosine * k.y - q.y) / kNorm };
}

const index = P7_COMMON_INDICES[0];
const initial = KEYS[index - 1].vector;
const contributions = (["A", "B"] as const).map(id => ({
  id, query: QUERIES[id].vector, gradient: cosineKeyGradient(QUERIES[id].vector, initial),
}));
const gradient = contributions.reduce((sum, item) => ({
  x: sum.x + item.gradient.x, y: sum.y + item.gradient.y,
}), { x: 0, y: 0 });
const learningRate = 0.8;

export const P7_KEY_STEP = {
  index, initial, contributions, gradient, learningRate,
  updated: { x: initial.x - learningRate * gradient.x, y: initial.y - learningRate * gradient.y },
} as const;
