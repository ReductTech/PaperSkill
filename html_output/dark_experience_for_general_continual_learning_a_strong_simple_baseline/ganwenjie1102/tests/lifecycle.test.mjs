import test from "node:test";
import assert from "node:assert/strict";
import { lifecycleSceneAt as at, LIFECYCLE_FIXTURE as fixture, LIFECYCLE_GEOMETRY as G } from "../src/modules/review/lifecycle-model.ts";

test("empty memory, pre-update copy, post-update append, then a real stored replay source", () => {
  assert.equal(at(1, 1).hasTarget, false);
  assert.deepEqual(at(1, 1).lossSources, ["current-ce"]);
  assert.equal(at(2, 0.1).hasTarget, true);
  for (const [clip, t] of [[2, 1], [3, 0.69], [3, 1], [4, 0.89]]) assert.equal(at(clip, t).memoryCount, 0);
  assert.equal(at(3, 0.69).updateCount, 0);
  assert.equal(at(3, 0.7).updateCount, 1);
  assert.equal(at(4, 0.9).memoryCount, 1);
  assert.equal(at(4, 0.9).seen, 1);
  assert.ok(at(4, 0.9).seen <= fixture.capacity);
  assert.equal(at(5, 0).replaySource, null);
  assert.equal(at(5, 0.06).replaySource, fixture.recordId);
  assert.deepEqual(at(5, 1).lossSources, ["current-ce", "historical-squared"]);
  assert.equal(at(7, 0.74).updateCount, 1);
  assert.equal(at(7, 0.75).updateCount, 2);
  assert.deepEqual(at(7, 1).writes, [fixture.recordId]);
  assert.equal(at(7, 1).seen, 1); // Stop before the later current candidate is written.
});

test("copy squares leave the beads for the frozen block while the block itself stays put", () => {
  const start = at(2, 0.12);
  start.copyPoints.forEach((point, k) => {
    assert.ok(Math.abs(point.x - start.sourcePoints[k].x) < 1.5, `square ${k} starts on its bead`);
    assert.ok(Math.abs(point.y - start.sourcePoints[k].y) < 1.5, `square ${k} starts on its bead`);
  });
  for (const t of [0.25, 0.5, 0.75]) {
    assert.equal(new Set(at(2, t).copyPoints.map((p) => JSON.stringify(p))).size, 3);
  }
  assert.equal(new Set([0.25, 0.5, 0.75].map((t) => JSON.stringify(at(2, t).copyPoints[0]))).size, 3, "copy moves continuously");
  const landed = at(2, 1).copyPoints;
  const markers = [0, 1, 2].map((k) => {
    const cw = (G.block.w - 26) / 3;
    return { x: G.block.x + 13 + cw * k + cw / 2 - 20, y: G.block.y + G.block.h - 21 };
  });
  landed.forEach((point, k) => {
    assert.ok(Math.abs(point.x - markers[k].x) < 1.5 && Math.abs(point.y - markers[k].y) < 1.5, `square ${k} lands in the frozen block`);
  });
  assert.deepEqual(at(2, 0.2).targetOrigin, at(2, 1).targetOrigin, "the frozen block does not move while its copy travels");
});

test("geometry stays finite and inside the stage, and frozen identity survives every phase", () => {
  for (let clip = 0; clip < 8; clip++) for (let n = 0; n <= 100; n++) {
    const s = at(clip, n / 100);
    assert.deepEqual(s.z, [2, 1, 0]);
    assert.equal(s.recordId, fixture.recordId);
    assert.equal(s.match.squaredDistance, 2);
    assert.deepEqual(s.match.differences, [-1, 1, 0]);
    for (const point of [s.targetOrigin, s.input, s.replayInput, ...s.currentPoints, ...s.referencePoints, ...s.copyPoints]) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      assert.ok(point.x >= 0 && point.x <= 1120 && point.y >= 0 && point.y <= 640);
    }
  }
  for (const clip of [4, 5]) {
    const key = clip === 5 ? "replayInput" : "targetOrigin";
    assert.equal(new Set((clip === 5 ? [.595, .62, .65] : [.25, .5, .75]).map((t) => JSON.stringify(at(clip, t)[key]))).size, 3);
  }
  for (const clip of [2, 3, 4, 5, 6]) {
    assert.deepEqual(at(clip, 1).targetOrigin, at(clip + 1, 0).targetOrigin);
    assert.deepEqual(at(clip, 1).targetPoints, at(clip + 1, 0).targetPoints);
  }
  assert.equal("y" in fixture, false); // DER record has no historical label.
});

test("replay reads the stored record and the comparison keeps one shared coordinate system", () => {
  const replay = at(5, 0.5);
  assert.equal(replay.replaySource, fixture.recordId);
  assert.equal(replay.memoryCount, 1);
  assert.ok(replay.replayInput.x > 110 && replay.replayInput.y > 330, "replay view travels the left corridor");
  const compare = at(6, 1);
  assert.ok(compare.lens > 0.99, "comparison opens the focused composition");
  compare.referencePoints.forEach((point, k) => {
    assert.ok(Math.abs(point.x - compare.currentPoints[k].x) < 0.01, "frozen and current rows share the tile column");
    assert.ok(Math.abs(point.y - (compare.tiles.y + 84)) < 0.01, "frozen row sits above the current row");
    assert.ok(Math.abs(compare.currentPoints[k].y - (compare.tiles.y + 119)) < 0.01);
  });
  assert.equal(at(6, 1).memoryCount, 1, "the stored record survives the comparison");
  assert.equal(at(7, 1).seen, 1, "the later candidate is not written yet");
});


test("the second post-update write stores current x2 with its own frozen target", () => {
  assert.equal(at(7, 1).memoryCount, 1);
  assert.equal(at(8, .93).memoryCount, 1);
  const done = at(8, 1);
  assert.equal(done.memoryCount, 2);
  assert.equal(done.seen, 2);
  assert.equal(done.updateCount, 2);
  assert.deepEqual(done.writes, [fixture.recordId, fixture.currentRecordId]);
  assert.deepEqual(done.currentTarget, ["u₁", "u₂", "u₃"]);
  assert.deepEqual(done.z, [2, 1, 0]);
  assert.deepEqual(done.candidateRect, G.secondRecord);
  assert.equal(done.secondStored, true);
});


test("two augmented inputs have separate ordered forwards, logits and loss sources", () => {
  assert.equal(at(5, .55).currentForward, 1);
  assert.equal(at(5, .55).replayForward, 0);
  assert.equal(at(5, .55).currentAugment, 1);
  assert.equal(at(5, .55).replayAugment, 0);
  assert.equal(at(5, .55).replayMotion, 0);
  assert.deepEqual(at(5, .55).lossSources, ["current-ce"]);
  assert.equal(at(5, .99).replayForward, 1);
  assert.equal(at(5, .99).replayAugment, 1);
  assert.deepEqual(at(5, .99).lossSources, ["current-ce", "historical-squared"]);
  assert.deepEqual(at(5, 1).currentTarget, ["u₁", "u₂", "u₃"]);
  assert.deepEqual(at(5, 1).match.a, [1, 2, 0]);
});


test("augmentation has a stationary large rectangular viewport before entering the network", () => {
  for (const t of [.26, .36, .46, .56, .66, .72]) {
    const s = at(0, t);
    assert.deepEqual(s.input, {x:260,y:212});
    assert.equal(s.inputSize, 96);
  }
  assert.ok(at(0, .36).firstAugment > at(0, .26).firstAugment);
  assert.ok(at(0, .66).firstCrop > at(0, .56).firstCrop);
  for (const t of [.67, .71, .76, .8, .84]) {
    assert.deepEqual(at(5, t).replayInput, {x:260,y:388});
    assert.equal(at(5, t).replayInputSize, 96);
  }
  assert.equal(at(5, 1).currentInputSize, at(5, 1).replayInputSize);
});
