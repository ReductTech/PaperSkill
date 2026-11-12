import assert from "node:assert/strict";
import {
  KEYS,
  QUERIES,
  angleBetweenDegrees,
  buildSelectionSnapshot,
  cosineDistance,
  promptPoolConfig,
  selectedKeyIndices,
  sharedKeyIndices,
} from "../src/modules/prompt-retrieval-data.ts";

const round3 = value => Number(value.toFixed(3));
const indices = snapshot => snapshot.ranking.map(candidate => candidate.index);

assert.deepEqual(promptPoolConfig, {
  poolSize: 10,
  topN: 5,
  promptLength: 5,
  imageLength: 197,
  featureWidth: 768,
});

for (const vector of [...KEYS.map(key => key.vector), QUERIES.A.vector, QUERIES.B.vector]) {
  assert.ok(Math.abs(Math.hypot(vector.x, vector.y) - 1) < 1e-12, "teaching vectors are unit length");
}

const snapshotA = buildSelectionSnapshot("A");
const snapshotB = buildSelectionSnapshot("B");

assert.deepEqual(indices(snapshotA).slice(0, 5), [1, 2, 10, 3, 9]);
assert.deepEqual(indices(snapshotB).slice(0, 5), [4, 5, 3, 6, 2]);
assert.deepEqual(selectedKeyIndices("A"), [1, 2, 10, 3, 9]);
assert.deepEqual(sharedKeyIndices(), [2, 3]);
assert.deepEqual(snapshotA.ranking.slice(0, 5).map(candidate => round3(candidate.distance)), [0.01, 0.086, 0.223, 0.485, 0.758]);
assert.deepEqual(snapshotB.ranking.slice(0, 5).map(candidate => round3(candidate.distance)), [0.007, 0.143, 0.293, 0.625, 0.826]);

const qAK2 = snapshotA.candidates.find(candidate => candidate.index === 2);
assert.ok(qAK2);
assert.ok(Math.abs(qAK2.thetaDegrees - 24) < 1e-10);
assert.ok(Math.abs(qAK2.cosineSimilarity - Math.cos(24 * Math.PI / 180)) < 1e-12);
assert.equal(round3(qAK2.distance), 0.086);
assert.ok(Math.abs(angleBetweenDegrees(QUERIES.A.vector, KEYS[1].vector) - 24) < 1e-10);
assert.equal(cosineDistance(QUERIES.A.vector, KEYS[1].vector), qAK2.distance);
assert.throws(() => cosineDistance({ x: 0, y: 0 }, KEYS[0].vector), RangeError);
assert.ok(Object.isFrozen(snapshotA) && Object.isFrozen(snapshotA.ranking) && Object.isFrozen(snapshotA.selectedKeyIndices));

console.log("P5 retrieval model passed: A [1,2,10,3,9], B [4,5,3,6,2], shared [2,3], qA–k2 distance 0.086.");
