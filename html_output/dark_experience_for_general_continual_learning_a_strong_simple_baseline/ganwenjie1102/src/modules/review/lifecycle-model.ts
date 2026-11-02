import { HISTORY_Z, LOGIT_CASES, logitComparison } from "../math-model.ts";

// Given outputs at two training moments, not a simulated optimizer trajectory.
export const LIFECYCLE_FIXTURE = {
  capacity: 2,
  sampleId: "sample:x1",
  recordId: "record:x1:i",
  targetId: "target:x1:i",
  z: HISTORY_Z,
  replayOutput: LOGIT_CASES[0].values,
  currentSampleId: "sample:x2",
  currentTarget: ["u₁", "u₂", "u₃"],
  currentRecordId: "record:x2:j",
} as const;

/** The final beat completes the second training step with its own current-sample write. */
export const LIFECYCLE_CLIPS = [
  { id: "原图与增强过程", durationMs: 6000, holdMs: 1200 },
  { id: "前向与整组响应", durationMs: 3600, holdMs: 1400 },
  { id: "复制并冻结", durationMs: 3600, holdMs: 1500 },
  { id: "先更新当前网络", durationMs: 2600, holdMs: 1300 },
  { id: "候选写入空槽", durationMs: 3400, holdMs: 1600 },
  { id: "下一步读取与回放", durationMs: 18000, holdMs: 2200 },
  { id: "对齐、相减与平方", durationMs: 7600, holdMs: 2000 },
  { id: "一次联合更新", durationMs: 3400, holdMs: 1600 },
  { id: "本步候选写入记忆", durationMs: 3600, holdMs: 2000 },
] as const;

export const bound = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, p: number) => a + (b - a) * bound(p);
export const smooth = (p: number) => { const t = bound(p); return t * t * (3 - 2 * t); };
export const windowAt = (p: number, start: number, end: number) => smooth((p - start) / (end - start));
export type Point = { x: number; y: number };
export function curve(p: number, a: Point, b: Point, c: Point, d: Point): Point {
  const t = bound(p), s = 1 - t;
  return {
    x: s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * d.x,
    y: s ** 3 * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t ** 3 * d.y,
  };
}

/**
 * Stage geometry in the 1120×640 viewBox. The response is three score tiles, not a chart:
 * each tile carries a model pixel glyph, logit and level meter. Comparison reserves
 * separate rows for frozen/current logits, squared contributions and the total.
 */
export const LIFECYCLE_GEOMETRY = {
  width: 1120,
  height: 640,
  model: { x: 430, y: 124, w: 290, h: 316 },
  anchor: { x: 34, y: 160, w: 190, h: 216 },
  tiles: { x: 760, y: 190, w: 100, h: 132, gap: 10 },
  tilesCompare: { x: 334, y: 124, w: 228, h: 216, gap: 22 },
  block: { x: 760, y: 354, w: 320, h: 76 },
  record: { x: 224, y: 504, w: 330, h: 88 },
  recordInner: { x: 298, y: 530, w: 244, h: 60 },
  slot0: { x: 218, y: 498, w: 342, h: 100 },
  sample: { x: 34, y: 150, size: 96 },
  ports: { current: 300, replay: 378 },
  viewSize: 56,
  currentTiles: { x: 760, y: 164, w: 100, h: 104, gap: 10 },
  replayTiles: { x: 760, y: 318, w: 100, h: 104, gap: 10 },
  currentCandidate: { x: 760, y: 433, w: 320, h: 27 },
  compactCandidate: { x: 34, y: 398, w: 190, h: 60 },
  secondRecord: { x: 586, y: 504, w: 330, h: 88 },
  path: {
    intake: [{ x: 82, y: 198 }, { x: 150, y: 198 }, { x: 192, y: 212 }, { x: 260, y: 212 }],
    enter: [{ x: 260, y: 212 }, { x: 382, y: 212 }, { x: 382, y: 270 }, { x: 382, y: 300 }],
    replay: [{ x: 258, y: 556 }, { x: 140, y: 590 }, { x: 142, y: 388 }, { x: 260, y: 388 }],
    replayDock: [{ x: 260, y: 388 }, { x: 320, y: 388 }, { x: 350, y: 378 }, { x: 382, y: 378 }],
  },
  loss: { y: { x: 34, y: 60, w: 142, h: 46 }, ce: { x: 760, y: 44, w: 320, h: 56 } },
  band: { x: 34, y: 470, w: 1052, h: 140 },
} as const;

const G = LIFECYCLE_GEOMETRY;
const blockMarker = (k: number, block: { x: number; y: number; w: number; h: number }): Point => {
  const cw = (block.w - 26) / 3;
  return { x: block.x + 13 + cw * k + cw / 2 - 20, y: block.y + block.h - 21 };
};

export function lifecycleSceneAt(clip: number, progress: number) {
  const index = Math.max(0, Math.min(LIFECYCLE_CLIPS.length - 1, Math.floor(clip)));
  const p = bound(progress);
  const phase = (n: number) => index > n ? 1 : index < n ? 0 : p;
  const enter = phase(0), forward = phase(1), copy = phase(2), update = phase(3), store = phase(4);
  const later = index >= 5, replay = phase(5), compare = phase(6), joint = phase(7), secondStore = phase(8);
  const secondStored = secondStore >= 0.94;

  const firstUpdated = update >= 0.7;
  const stored = store >= 0.9;
  const lens = windowAt(compare, 0, 0.32);

  const [e0, e1, e2, e3] = G.path.enter;
  const [r0, r1, r2, r3] = G.path.replay;
  const firstApproach = windowAt(enter, .02, .22), currentApproach = windowAt(replay, .01, .1);
  const inputMotion = windowAt(enter, .76, .98), currentMotion = windowAt(replay, .34, .42);
  const replayMotion = windowAt(replay, .58, .66), replayTransfer = windowAt(replay, .84, .9);
  const along = (t: number, points: readonly Point[]) => curve(t, points[0], points[1], points[2], points[3]);
  const input = enter < .76 ? along(firstApproach, G.path.intake) : curve(inputMotion, e0, e1, e2, e3);
  const currentInput = replay < .34 ? along(currentApproach, G.path.intake) : curve(currentMotion, e0, e1, e2, e3);
  const replayInput = replay < .84 ? curve(replayMotion, r0, r1, r2, r3) : along(replayTransfer, G.path.replayDock);

  const copyMotion = windowAt(copy, 0.12, 0.8);
  const restMarker = (k: number): Point => blockMarker(k, G.block);
  const assembly = windowAt(store, 0.1, 0.75);
  const recordVisible = windowAt(store, 0.05, 0.35);
  const blockNow = {
    x: mix(G.block.x, 748, windowAt(assembly, 0, .1)) + (G.recordInner.x - 748) * windowAt(assembly, .4, .85),
    y: mix(G.block.y, 510, windowAt(assembly, .1, .4)) + (G.recordInner.y - 510) * windowAt(assembly, .85, 1),
    w: mix(G.block.w, G.recordInner.w, windowAt(assembly, 0, .1)),
    h: mix(G.block.h, G.recordInner.h, windowAt(assembly, .85, 1)),
  };
  const recordPos = { x: G.record.x, y: G.record.y };

  // Score tiles: the same three tiles grow into the comparison composition.
  const baseTiles = later ? G.replayTiles : G.tiles;
  const tiles = {
    x: mix(baseTiles.x, G.tilesCompare.x, lens),
    y: mix(baseTiles.y, G.tilesCompare.y, lens),
    w: mix(baseTiles.w, G.tilesCompare.w, lens),
    h: mix(baseTiles.h, G.tilesCompare.h, lens),
    gap: mix(baseTiles.gap, G.tilesCompare.gap, lens),
  };
  const tileX = (k: number) => tiles.x + k * (tiles.w + tiles.gap);

  const match = logitComparison(LIFECYCLE_FIXTURE.z, LIFECYCLE_FIXTURE.replayOutput);
  const baseToken = (k: number): Point => ({ x: tileX(k) + tiles.w - 23, y: tiles.y + 77 });
  const compareCurrent = (k: number): Point => ({ x: tileX(k) + tiles.w - 55, y: tiles.y + 119 });
  const compareFrozen = (k: number): Point => ({ x: tileX(k) + tiles.w - 55, y: tiles.y + 84 });

  const currentPoints = [0, 1, 2].map(k => ({
    x: mix(baseToken(k).x, compareCurrent(k).x, lens),
    y: mix(baseToken(k).y, compareCurrent(k).y, lens),
  }));
  const sourcePoints = [0, 1, 2].map(k => baseToken(k));
  const copyPoints = [0, 1, 2].map((_, k) => {
    const from = sourcePoints[k];
    const to = restMarker(k);
    return { x: mix(from.x, to.x, copyMotion), y: mix(from.y, to.y, copyMotion) };
  });
  const carried = windowAt(compare, .32, .5);
  const targetPoints = [0, 1, 2].map((_, k) => ({
    x: mix(blockMarker(k, blockNow).x, compareFrozen(k).x, carried),
    y: mix(blockMarker(k, blockNow).y, compareFrozen(k).y, carried),
  }));

  const difference = windowAt(compare, .5, .6);
  const squares = windowAt(compare, .6, .7);
  const sum = windowAt(compare, .7, .74);
  const sumTransfers = [0,1,2].map(k => windowAt(compare, .72 + k * .06, .84 + k * .06));
  const sumCopyOpacity = [0,1,2].map(k => windowAt(compare, .72 + k * .06, .745 + k * .06));
  const totalReveal = windowAt(compare, .96, 1);
  const merged = windowAt(joint, 0.1, 0.45);
  const updated = windowAt(joint, 0.45, 0.8);
  const parameter = index < 3 ? "θᵢ" : index === 3 ? (firstUpdated ? "θᵢ₊₁" : "θᵢ") : index < 7 ? "θⱼ" : (joint >= 0.75 ? "θⱼ₊₁" : "θⱼ");

  const outputReveal = [0, 1, 2].map(k => later
    ? windowAt(replay, .97 + k * .005, .986 + k * .005)
    : windowAt(forward, 0.4 + k * 0.12, 0.6 + k * 0.12));

  const candidateRect = index < 8 ? {
    x: mix(G.currentCandidate.x, G.compactCandidate.x, lens),
    y: mix(G.currentCandidate.y, G.compactCandidate.y, lens),
    w: mix(G.currentCandidate.w, G.compactCandidate.w, lens),
    h: mix(G.currentCandidate.h, G.compactCandidate.h, lens),
  } : {
    x: mix(G.compactCandidate.x, G.secondRecord.x, windowAt(secondStore, .25, .65)),
    y: mix(G.compactCandidate.y, 414, windowAt(secondStore, .06, .22)) + (G.secondRecord.y - 414) * windowAt(secondStore, .65, .92),
    w: mix(G.compactCandidate.w, G.secondRecord.w, windowAt(secondStore, .25, .65)),
    h: mix(G.compactCandidate.h, G.secondRecord.h, windowAt(secondStore, .65, .92)),
  };
  return {
    candidateRect, secondStore, secondStored, currentTarget: LIFECYCLE_FIXTURE.currentTarget,
    currentCandidateVisible: later ? windowAt(replay, .54, .58) : 0,
    firstAugment: windowAt(enter, .24, .48), firstCrop: windowAt(enter, .48, .72),
    currentAugment: windowAt(replay, .1, .22), currentCrop: windowAt(replay, .22, .34),
    replayAugment: windowAt(replay, .66, .76), replayCrop: windowAt(replay, .76, .84),
    firstApproach, currentApproach, replayTransfer,
    inputSize: mix(96, G.viewSize, inputMotion), currentInputSize: mix(96, G.viewSize, currentMotion),
    replayInputSize: replay < .84 ? mix(44, 96, windowAt(replayMotion, .7, 1)) : mix(96, G.viewSize, replayTransfer),
    currentForward: windowAt(replay, .42, .53), replayForward: windowAt(replay, .9, .98),
    currentOutputReveal: [0, 1, 2].map(k => later ? windowAt(replay, .52 + k * .005, .536 + k * .005) : 0),
    clip: index, progress: p, enter, forward, copy, update, store, later, replay, compare, joint,
    firstUpdated, stored, lens, recordVisible, assembly, copyMotion,
    parameter, tiles, tileX,
    input, currentInput, replayInput, inputMotion, currentMotion, replayMotion,
    blockNow, recordPos, copyPoints,
    match, currentPoints, sourcePoints, targetPoints,
    referencePoints: targetPoints,
    targetOrigin: carried > 0 ? targetPoints[0] : { x: blockNow.x, y: blockNow.y },
    difference, squares, sum, sumTransfers, sumCopyOpacity, totalReveal, merged, updated,
    outputReveal,
    enterDocked: later ? windowAt(replay, .41, .43) : windowAt(enter, .96, 1),
    replayDocked: windowAt(replay, .89, .91),
    trailEnter: windowAt(enter, 0.08, 0.9) * (1 - windowAt(enter, 0.94, 1)),
    trailReplay: windowAt(replay, 0.26, 0.7) * (1 - windowAt(replay, 0.78, 0.9)),
    memoryCount: (stored ? 1 : 0) + (secondStored ? 1 : 0),
    seen: (stored ? 1 : 0) + (secondStored ? 1 : 0),
    hasTarget: copy > 0,
    replaySource: later && replay >= 0.06 ? LIFECYCLE_FIXTURE.recordId : null,
    lossSources: later && replay >= .98 ? ["current-ce", "historical-squared"] : (later ? replay >= .54 : forward >= 1) ? ["current-ce"] : [],
    updateCount: (firstUpdated ? 1 : 0) + (joint >= 0.75 ? 1 : 0),
    writes: secondStored ? [LIFECYCLE_FIXTURE.recordId, LIFECYCLE_FIXTURE.currentRecordId] : stored ? [LIFECYCLE_FIXTURE.recordId] : [],
    ceState: later ? (joint >= .75 ? "updated" : replay >= .54 ? "formed" : "none") : firstUpdated ? "updated" : forward >= 1 ? "formed" : "none",
    sampleId: LIFECYCLE_FIXTURE.sampleId,
    recordId: LIFECYCLE_FIXTURE.recordId,
    targetId: LIFECYCLE_FIXTURE.targetId,
    z: LIFECYCLE_FIXTURE.z,
  };
}
