export const promptPoolConfig = {
  poolSize: 10,
  topN: 5,
  promptLength: 5,
  imageLength: 197,
  featureWidth: 768,
} as const;

export type QueryId = "A" | "B";
export type Vector2 = Readonly<{ x: number; y: number }>;
export type QueryInput = QueryId | Vector2;

export type KeyDefinition = Readonly<{
  index: number;
  angleDegrees: number;
  vector: Vector2;
}>;

export type QueryDefinition = Readonly<{
  id: QueryId;
  angleDegrees: number;
  vector: Vector2;
}>;

export type CandidateScore = Readonly<{
  index: number;
  key: KeyDefinition;
  thetaDegrees: number;
  cosineSimilarity: number;
  distance: number;
}>;

export type SelectionSnapshot = Readonly<{
  query: QueryDefinition;
  candidates: readonly CandidateScore[];
  ranking: readonly CandidateScore[];
  selected: readonly CandidateScore[];
  selectedKeyIndices: readonly number[];
}>;

const toRadians = (degrees: number) => degrees * Math.PI / 180;

function unitVector(angleDegrees: number): Vector2 {
  const angle = toRadians(angleDegrees);
  return Object.freeze({ x: Math.cos(angle), y: Math.sin(angle) });
}

export const KEY_ANGLES_DEGREES = Object.freeze([4, 36, 71, 109, 147, 184, 219, 258, 296, 333] as const);

export const KEYS: readonly KeyDefinition[] = Object.freeze(KEY_ANGLES_DEGREES.map((angleDegrees, offset) => Object.freeze({
  index: offset + 1,
  angleDegrees,
  vector: unitVector(angleDegrees),
})));

export const QUERIES: Readonly<Record<QueryId, QueryDefinition>> = Object.freeze({
  A: Object.freeze({ id: "A", angleDegrees: 12, vector: unitVector(12) }),
  B: Object.freeze({ id: "B", angleDegrees: 116, vector: unitVector(116) }),
});

function vectorNorm(vector: Vector2) {
  return Math.hypot(vector.x, vector.y);
}

function normalizedDotProduct(left: Vector2, right: Vector2) {
  const leftNorm = vectorNorm(left);
  const rightNorm = vectorNorm(right);
  if (leftNorm === 0 || rightNorm === 0) {
    throw new RangeError("Cosine distance is undefined when either vector has zero norm.");
  }

  const similarity = (left.x * right.x + left.y * right.y) / (leftNorm * rightNorm);
  return Math.max(-1, Math.min(1, similarity));
}

export function cosineDistance(query: Vector2, key: Vector2) {
  return 1 - normalizedDotProduct(query, key);
}

export function angleBetweenDegrees(query: Vector2, key: Vector2) {
  return Math.acos(normalizedDotProduct(query, key)) * 180 / Math.PI;
}

export function keyAngle(index: number) {
  const key = KEYS[index - 1];
  if (!key) throw new RangeError(`Key index must be between 1 and ${promptPoolConfig.poolSize}; received ${index}.`);
  return toRadians(key.angleDegrees);
}

export function queryAngle(query: QueryId) {
  return toRadians(QUERIES[query].angleDegrees);
}

export function distanceToKey(query: QueryId, index: number) {
  const key = KEYS[index - 1];
  if (!key) throw new RangeError(`Key index must be between 1 and ${promptPoolConfig.poolSize}; received ${index}.`);
  return cosineDistance(QUERIES[query].vector, key.vector);
}

function resolveQueryVector(query: QueryInput): Vector2 {
  return typeof query === "string" ? QUERIES[query].vector : query;
}

export function computeCandidates(query: QueryInput): readonly CandidateScore[] {
  const queryVector = resolveQueryVector(query);
  return Object.freeze(KEYS.map(key => {
    const distance = cosineDistance(queryVector, key.vector);
    return Object.freeze({
      index: key.index,
      key,
      thetaDegrees: angleBetweenDegrees(queryVector, key.vector),
      cosineSimilarity: 1 - distance,
      distance,
    });
  }));
}

export function rankKeys(query: QueryInput) {
  return Object.freeze([...computeCandidates(query)].sort((left, right) => left.distance - right.distance || left.index - right.index));
}

export function selectedKeyIndices(query: QueryInput) {
  return Object.freeze(rankKeys(query).slice(0, promptPoolConfig.topN).map(item => item.index));
}

export function buildSelectionSnapshot(queryId: QueryId): SelectionSnapshot {
  const query = QUERIES[queryId];
  const candidates = computeCandidates(query.vector);
  const ranking = Object.freeze([...candidates].sort((left, right) => left.distance - right.distance || left.index - right.index));
  const selected = Object.freeze(ranking.slice(0, promptPoolConfig.topN));

  return Object.freeze({
    query,
    candidates,
    ranking,
    selected,
    selectedKeyIndices: Object.freeze(selected.map(candidate => candidate.index)),
  });
}

export function sharedKeyIndices(leftQuery: QueryId = "A", rightQuery: QueryId = "B") {
  const right = new Set(selectedKeyIndices(rightQuery));
  return Object.freeze(selectedKeyIndices(leftQuery).filter(index => right.has(index)));
}
