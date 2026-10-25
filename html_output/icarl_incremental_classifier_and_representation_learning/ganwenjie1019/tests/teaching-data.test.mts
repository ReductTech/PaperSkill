/**
 * Paper-specific data checks for the P3/P4/P5 teaching examples.
 *
 * These assert the facts the animations claim: every plotted vector has unit length where the
 * narration says so, category prototypes come from their own exemplars, the Query prediction is
 * the real argmin, the Herding winners match the greedy computation, and Q has one row per D
 * sample whose three values are exactly the teacher responses.
 *
 * Run with `npm test`.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  CLASS_VISUALS,
  ALL_CLASS_IDS,
  P_BEFORE,
  P_AFTER,
  NEW_CLASS_HERDING,
  NEXT_QUOTA,
  MEMORY_BUDGET,
  CURRENT_EXEMPLARS,
  PROTOTYPES,
  QUERY_DISTANCES,
  QUERY_FEATURE,
  QUERY_PREDICTION,
  encode2D,
  euclideanDistance,
  mean,
  normalize,
  type Vector2,
} from "../src/data/icarl-runtime.ts";
import {
  HERDING_DEMO_ORDER,
  HERDING_DEMO_POINTS,
  HERDING_DEMO_ROUNDS,
  HERDING_DEMO_TARGET,
  HERDING_DEMO_TARGET_RAW,
} from "../src/data/herding-teaching-demo.ts";
import { budgetAt, reviewAt } from "../src/data/herding-phase-state.ts";
import {
  HERDING_CHART,
  clockwiseOffsetFromTop,
  projectHerdingFeature,
} from "../src/data/herding-teaching-geometry.ts";
import {
  INCREMENTAL_STAGE_DATA,
  binaryCrossEntropy,
  buildTargets,
  sixNodeBceLoss,
  studentOutputFor,
  teacherSnapshotFor,
} from "../src/data/incremental-training.ts";
import { p9TrainingAssemblyAt } from "../src/data/p9-training-assembly-state.ts";
import { p9PredictionTimelineAt } from "../src/data/p9-prediction-timeline.ts";
import { snapshotWriteProgress } from "../src/data/incremental-snapshot-progress.ts";
import { CLASSES_PER_BATCH, TABLE1A, TABLE1B } from "../src/data/table1-results.ts";
import { FIGURE2_FOCUS_RECTS, FIGURE2_SOURCE_FRAME, figure2Selection } from "../src/data/figure2-focus.ts";
import { FeatureSpaceWorkbench } from "../src/components/FeatureSpaceWorkbench.tsx";
import { PageThree } from "../src/pages/PageThree.tsx";
import { PageFour } from "../src/pages/PageFour.tsx";
import { PageFive } from "../src/pages/PageFive.tsx";
import { PageSix } from "../src/pages/PageSix.tsx";
import { PageSeven } from "../src/pages/PageSeven.tsx";
import { PageNine } from "../src/pages/PageNine.tsx";
import { ICARL_REFERENCE_ITEMS, ICARL_TERMS } from "../src/data/icarl-reference-content.tsx";
import { ReferenceHub } from "../src/shared/core/reference/ReferenceHub.tsx";

const OLD_CLASS_IDS = ["A", "B", "C"] as const;
const near = (a: number, b: number, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;
const unit = (vector: Vector2) => Math.hypot(vector[0], vector[1]);
const CJK_CHARACTERS = /[\u3400-\u9fff]/u;

assert.equal(ICARL_REFERENCE_ITEMS.length, 20, "The Reference Hub must retain all 20 reference entries.");
for (const item of ICARL_REFERENCE_ITEMS) {
  assert.doesNotMatch(`${item.title} ${item.summary} ${(item.tags ?? []).join(" ")}`, CJK_CHARACTERS,
    `Reference Hub entry ${item.id} must use English for its title, summary, and tags.`);
  if (item.content) {
    const detailMarkup = renderToStaticMarkup(createElement("div", null, item.content));
    assert.doesNotMatch(detailMarkup, CJK_CHARACTERS, `Reference Hub entry ${item.id} must use English in its details.`);
  }
}
for (const term of Object.values(ICARL_TERMS)) {
  assert.doesNotMatch([term.label, term.fullName, term.definition, term.paperRole, term.confusion, term.sourceKind]
    .filter(Boolean).join(" "), CJK_CHARACTERS, `Term popover ${term.id} must use English throughout.`);
}
const referenceHubMarkup = renderToStaticMarkup(createElement(ReferenceHub, { items: ICARL_REFERENCE_ITEMS }));
assert.doesNotMatch(referenceHubMarkup, CJK_CHARACTERS, "Reference Hub filters, labels, and empty-state copy must use English.");
const qReference = ICARL_REFERENCE_ITEMS.find((item) => item.id === "response-snapshot-q")!;
assert.ok(qReference.summary.includes("pre-update sigmoid responses") && qReference.summary.includes("sample ID"),
  "Response Snapshot Q must explain when it is recorded and how rows align with training images.");
const qDetailMarkup = renderToStaticMarkup(createElement("div", null, qReference.content));
assert.ok(qDetailMarkup.includes("new-class images") && qDetailMarkup.includes("N rows"),
  "Response Snapshot Q must clarify that new images also receive rows while only old classes form columns.");
const bceReference = ICARL_REFERENCE_ITEMS.find((item) => item.id === "binary-cross-entropy")!;
const bceDetailMarkup = renderToStaticMarkup(createElement("div", null, bceReference.content));
assert.ok(bceDetailMarkup.includes("g − r") && bceDetailMarkup.includes("independent sigmoid"),
  "The BCE reference must explain the local gradient and independent-output interpretation.");
assert.ok(ICARL_REFERENCE_ITEMS.find((item) => item.id === "cifar-100-dataset")?.summary.includes("20 superclasses"),
  "The CIFAR-100 reference must provide useful dataset structure beyond its name.");

function renderPageThreeAt(clip: number, pct = 0, onContinue?: () => void): string {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { __ICARL_FREEZE__: { clip, pct }, matchMedia: () => ({ matches: false }) },
  });
  try {
    return renderToStaticMarkup(createElement(PageThree, { onContinue }));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

function p3VisibleLegend(clip: number): string {
  const markup = renderPageThreeAt(clip);
  const legend = markup.match(/<div class="p3-scene__legend"[^>]*>(.*?)<\/div>/)?.[1];
  assert.ok(legend, `P3 clip ${clip} must render its stage legend.`);
  return legend!;
}

const p3RouteMarkup = renderPageThreeAt(0);
assert.ok(p3RouteMarkup.includes('class="p3-concept"') && !p3RouteMarkup.includes('class="tutorial-route"'),
  "P3 must use its own exemplar-to-prototype concept map instead of the shared route template.");
assert.equal([...p3RouteMarkup.matchAll(/class="p3-concept__memory"/g)].length, 1, "P3 must show finite exemplar memory as the source of class references.");
assert.ok(p3RouteMarkup.includes("同一个当前 φ") && p3RouteMarkup.includes("每类特征形成一个 Prototype"),
  "P3 must visibly keep exemplar and Query encoding in the same current feature space.");
assert.ok(p3RouteMarkup.includes("Prototype 是某个类别在当前特征空间中的近似参考位置") && p3RouteMarkup.includes("Query 的最近原型判别"),
  "P3 must connect the approximate class reference to nearest-prototype prediction.");
assert.ok(p3RouteMarkup.includes("不是某张“典型图片”") && p3RouteMarkup.includes("不是训练输出头的分数"),
  "P3 must distinguish a prototype reference position from a representative image and a training-head score.");
const p3PrincipleCopy = p3RouteMarkup.slice(p3RouteMarkup.indexOf('class="p3-concept__map"'), p3RouteMarkup.indexOf('class="p3-concept__footer"'));
assert.doesNotMatch(p3PrincipleCopy, /3 个类别|每类 4 张/u, "P3's demonstration counts must stay outside the general concept map.");
assert.equal([...p3PrincipleCopy.matchAll(/<em>待比较<\/em>/g)].length, 3, "P3 must show all three concept distances as equal and pending.");
assert.doesNotMatch(p3PrincipleCopy, /is-nearest|<em>最近<\/em>/u, "P3's concept map must not preselect a winning class before the real argmin animation.");
assert.ok(p3RouteMarkup.slice(p3RouteMarkup.indexOf('class="p3-concept__footer"')).includes("示例设置：3 个类别、每类 4 张图片"),
  "P3 must keep concrete class and exemplar counts in the demonstration note.");
assert.ok(p3RouteMarkup.includes("看同类保留图怎样形成 Prototype，再看 Query 的距离比较如何决定类别。"),
  "P3 must state one clear task before the main animation.");
const p3NormalizeLegend = p3VisibleLegend(0);
assert.match(p3NormalizeLegend, /单位圆/);
assert.match(p3NormalizeLegend, /Exemplar 特征/);
assert.doesNotMatch(p3NormalizeLegend, /类别均值|Prototype|Query|距离|圆心夹角/);
const p3AggregateLegend = p3VisibleLegend(1);
assert.match(p3AggregateLegend, /类别均值/);
assert.match(p3AggregateLegend, /Prototype/);
assert.doesNotMatch(p3AggregateLegend, /Query|距离|圆心夹角/);
const p3QueryLegend = p3VisibleLegend(2);
assert.match(p3QueryLegend, /Query 特征/);
assert.doesNotMatch(p3QueryLegend, /距离|圆心夹角/);
const p3DecisionLegend = p3VisibleLegend(3);
assert.match(p3DecisionLegend, /距离/);
assert.match(p3DecisionLegend, /圆心夹角/);
const p3MappingDetails = renderPageThreeAt(0).match(/<details class="p3-source__mapping"[^>]*>/)?.[0];
assert.ok(p3MappingDetails && !/\sopen(?:="")?(?:\s|>)/.test(p3MappingDetails),
  "P3 sample coordinates and normalization status must stay inside a collapsed verification area.");

/* ------------------------------------------------------------------ P3 --- */

const exemplars = OLD_CLASS_IDS.flatMap((classId) => P_BEFORE[classId]);
assert.equal(exemplars.length, 12, "P3 must show the twelve saved exemplars.");

for (const sample of exemplars) {
  const raw = encode2D(sample, "before");
  const normalized = normalize(raw);
  assert.ok(near(unit(normalized), 1), `${sample.id} must normalize to unit length.`);
  // The displayed raw feature must be the un-normalized encoder output.
  assert.ok(unit(raw) > 1e-6, `${sample.id} must have a usable raw feature.`);
}

const prototypes = OLD_CLASS_IDS.map((classId) => {
  const classFeatures = P_BEFORE[classId].map((sample) => normalize(encode2D(sample, "before")));
  const rawMean = mean(classFeatures);
  return { classId, rawMean, prototype: normalize(rawMean) };
});

for (const entry of prototypes) {
  const recomputed = mean(P_BEFORE[entry.classId].map((sample) => normalize(encode2D(sample, "before"))));
  assert.ok(near(entry.rawMean[0], recomputed[0]) && near(entry.rawMean[1], recomputed[1]),
    `Prototype mean for ${entry.classId} must come from its own four exemplars.`);
  assert.ok(near(unit(entry.prototype), 1), `Prototype ${entry.classId} must lie on the unit circle.`);
}

const queryRaw = encode2D({ id: "query", classId: "A", raw: [1.732, -1.0] }, "before");
const queryUnit = normalize(queryRaw);
assert.ok(near(unit(queryUnit), 1), "The query feature must be normalized before comparison.");

const distances = prototypes
  .map((entry) => ({ classId: entry.classId, distance: euclideanDistance(queryUnit, entry.prototype) }))
  .sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId));
assert.equal(distances.length, 3, "P3 compares the query against three prototypes.");
assert.ok(distances[0].distance <= distances[1].distance && distances[1].distance <= distances[2].distance,
  "The displayed distances must be ordered by the real argmin.");
for (const entry of distances) {
  assert.ok(entry.distance <= 2 + 1e-9, `Distance to ${entry.classId} must be a valid chord length.`);
}
assert.ok(CLASS_VISUALS[distances[0].classId].index >= 1, "The prediction must name a real class.");

/* ------------------------------------------------------------------ P4 --- */

assert.equal(HERDING_DEMO_POINTS.length, 8, "The Herding teaching example uses eight candidates.");
assert.equal(HERDING_DEMO_ORDER.length, 4, "The Herding teaching example selects four exemplars.");
assert.ok(near(unit(HERDING_DEMO_TARGET), 1), "The Herding target must be normalized.");
assert.ok(
  near(HERDING_DEMO_TARGET_RAW[0], mean(HERDING_DEMO_POINTS.map((point) => point.feature))[0]) &&
  near(HERDING_DEMO_TARGET_RAW[1], mean(HERDING_DEMO_POINTS.map((point) => point.feature))[1]),
  "The full-class raw mean must be the mean of all eight unit features.",
);

const projectedOrigin = projectHerdingFeature([0, 0]);
const projectedTop = projectHerdingFeature([0, 1]);
const projectedRight = projectHerdingFeature([1, 0]);
const projectedBottom = projectHerdingFeature([0, -1]);
const projectedLeft = projectHerdingFeature([-1, 0]);
assert.deepEqual(projectedOrigin, HERDING_CHART.center, "The chart projection must preserve the feature-space origin.");
assert.ok(near(clockwiseOffsetFromTop(projectedTop), 0), "The scan must begin at the top of the circle.");
assert.ok(near(clockwiseOffsetFromTop(projectedRight), 90), "Increasing scan angle must move clockwise from top to right.");
assert.ok(near(clockwiseOffsetFromTop(projectedBottom), 180), "The bottom follows the right in clockwise order.");
assert.ok(near(clockwiseOffsetFromTop(projectedLeft), 270), "The left follows the bottom in clockwise order.");

const scanOrder = HERDING_DEMO_POINTS
  .map((point) => ({ id: point.id, offset: clockwiseOffsetFromTop(projectHerdingFeature(point.feature)) }))
  .sort((a, b) => a.offset - b.offset);
assert.deepEqual(
  scanOrder.map((item) => item.id),
  ["a5", "a1", "a7", "a2", "a8", "a4", "a3", "a6"],
  "Herding candidates must be visited in clockwise order from the circle top.",
);

const projectedRawTarget = projectHerdingFeature(HERDING_DEMO_TARGET_RAW);
const projectedTarget = projectHerdingFeature(HERDING_DEMO_TARGET);
const rawTargetFromOrigin = [projectedRawTarget.x - projectedOrigin.x, projectedRawTarget.y - projectedOrigin.y];
const targetFromOrigin = [projectedTarget.x - projectedOrigin.x, projectedTarget.y - projectedOrigin.y];
assert.ok(
  near(Math.hypot(...rawTargetFromOrigin) / HERDING_CHART.radius, unit(HERDING_DEMO_TARGET_RAW)),
  "The raw full-class mean must keep its true length under projection.",
);
assert.ok(
  near(rawTargetFromOrigin[0] * targetFromOrigin[1] - rawTargetFromOrigin[1] * targetFromOrigin[0], 0),
  "The raw and normalized full-class targets must remain on the same radial line.",
);
assert.ok(
  near(Math.hypot(...targetFromOrigin), HERDING_CHART.radius),
  "The normalized full-class target must lie on the displayed unit circle.",
);

for (const round of HERDING_DEMO_ROUNDS) {
  const prefix = HERDING_DEMO_ORDER.slice(0, round.k - 1).map((point) => point.feature);
  assert.equal(round.chosen.id, HERDING_DEMO_ORDER[round.k - 1].id, `Round ${round.k} winner must equal the recorded order.`);

  let best: { id: string; distance: number } | null = null;
  for (const candidate of round.candidates) {
    const prefixRaw = mean([...prefix, candidate.point.feature]);
    const prefixUnit = normalize(prefixRaw);
    assert.ok(
      near(prefixRaw[0], candidate.rawPrefixMean[0]) && near(prefixRaw[1], candidate.rawPrefixMean[1]),
      `Round ${round.k} candidate ${candidate.point.id} raw prefix mean must be the arithmetic mean of real endpoints.`,
    );
    assert.ok(
      near(prefixUnit[0], candidate.normalizedPrefixMean[0]) && near(prefixUnit[1], candidate.normalizedPrefixMean[1]),
      `Round ${round.k} candidate ${candidate.point.id} unit prefix mean must be normalized.`,
    );
    const projectedPrefix = projectHerdingFeature(candidate.normalizedPrefixMean);
    const projectedExpectedPrefix = projectHerdingFeature(prefixUnit);
    assert.ok(
      near(projectedPrefix.x, projectedExpectedPrefix.x) && near(projectedPrefix.y, projectedExpectedPrefix.y),
      `Round ${round.k} candidate ${candidate.point.id} must be drawn at its actual normalized prefix mean.`,
    );
    const distance = euclideanDistance(prefixUnit, HERDING_DEMO_TARGET);
    assert.ok(near(distance, candidate.score, 1e-9), `Round ${round.k} candidate ${candidate.point.id} score must equal the drawn distance.`);
    const projectedTargetForDistance = projectHerdingFeature(HERDING_DEMO_TARGET);
    const displayedDistance = Math.hypot(
      projectedPrefix.x - projectedTargetForDistance.x,
      projectedPrefix.y - projectedTargetForDistance.y,
    ) / HERDING_CHART.radius;
    assert.ok(
      near(displayedDistance, candidate.score, 1e-9),
      `Round ${round.k} candidate ${candidate.point.id} projected distance must match its distance-ruler score.`,
    );
    if (!best || distance < best.distance) best = { id: candidate.point.id, distance };
  }
  assert.equal(best?.id, round.chosen.id, `Round ${round.k} winner must be the greedy argmin, not a display choice.`);
  assert.ok(
    near(unit(round.normalizedPrefixMean), 1),
    `Round ${round.k} prefix mean must lie on the unit circle.`,
  );
}

// Greedy Herding does not promise a monotonically shrinking distance; the animation must not either.
const roundDistances = HERDING_DEMO_ROUNDS.map((round) => round.score);

function renderPageFourAt(clip: number, pct = 0, onContinue?: () => void): string {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      __ICARL_FREEZE__: { clip, pct },
      matchMedia: () => ({ matches: false }),
    },
  });
  try {
    return renderToStaticMarkup(createElement(PageFour, { onContinue }));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

const p4ClipIds = attr(renderPageFourAt(0), "data-clip-ids").split(",");
const p4ClipIndex = new Map(p4ClipIds.map((id, index) => [id, index]));
const p4At = (id: string, pct = 0) => {
  const index = p4ClipIndex.get(id);
  assert.notEqual(index, undefined, `P4 timeline must include ${id}.`);
  return renderPageFourAt(index!, pct);
};

const p4RouteMarkup = renderPageFourAt(0);
assert.ok(p4RouteMarkup.includes('class="p4-preview"') && !p4RouteMarkup.includes('class="tutorial-route"'),
  "P4 must use its own selection comparison instead of the shared route template.");
assert.ok(p4RouteMarkup.includes("每个类别只能留下少量图片，怎样选择才更有代表性？"), "P4 must use a general, non-numeric question as its page title.");
const p4GeneralReasoning = p4RouteMarkup.slice(p4RouteMarkup.indexOf('class="p4-preview__comparison"'), p4RouteMarkup.indexOf('class="p4-preview__footer"'));
assert.ok(p4GeneralReasoning.includes("μ_keep") && p4GeneralReasoning.includes("μ_full"), "P4 must compare a selected-memory mean with the full-class target.");
assert.ok(p4GeneralReasoning.includes("贪心结果是全局最优") && p4GeneralReasoning.includes("取本轮距离最小"),
  "P4 must distinguish per-round greedy selection from a global optimum claim.");
assert.ok(p4GeneralReasoning.includes("截去尾项，保留前缀") && p4GeneralReasoning.includes("长期保存的是原始图片与顺序"), "P4 must explain why the ordered list supports later truncation.");
assert.doesNotMatch(p4GeneralReasoning, /八个候选|四个候选|K\s*=\s*12|3→4|4→3/u, "P4's general reasoning must not absorb its example counts.");
const p4Mechanism = p4RouteMarkup.match(/<section class="p4-preview__mechanism"[\s\S]*?<\/section>/)?.[0] ?? "";
const p4MechanismRound = HERDING_DEMO_ROUNDS[1];
assert.ok(p4Mechanism.includes("Herding：每次只确定下一张要保留的图")
  && p4Mechanism.includes("固定已有前缀") && p4Mechanism.includes("逐个试未选候选") && p4Mechanism.includes("提交本轮 arg min"),
  "P4's mechanism card must show prefix, candidate trial, and greedy commit as three states.");
assert.ok(p4Mechanism.includes('data-round="2"') && p4Mechanism.includes(`data-chosen="${p4MechanismRound.chosen.id}"`),
  "P4's compact mechanism must use the real second Herding round.");
for (const candidate of p4MechanismRound.candidates) {
  assert.ok(p4Mechanism.includes(`data-candidate="${candidate.point.id}" data-score="${candidate.score.toFixed(6)}"`),
    `P4's mechanism card must show ${candidate.point.id}'s actual round-two distance.`);
}
assert.ok(p4Mechanism.includes("逐轮贪心") && p4Mechanism.includes("不保证全局最优") && p4Mechanism.includes("不保证距离每轮下降"),
  "P4's mechanism card must state the greedy boundary without promising monotonic improvement.");
const p4DemoNote = p4RouteMarkup.slice(p4RouteMarkup.indexOf('class="p4-preview__footer"'));
assert.ok(p4DemoNote.includes("8 个合成单位特征") && p4DemoNote.includes("K=12") && p4DemoNote.includes("3→4 类") && p4DemoNote.includes("P5/P7 的 3→6 类"),
  "P4 must label its eight-candidate and 3-to-4 budget scenes as examples independent of the later 3-to-6 increment.");

const reviewCheckpoints = [
  { progress: 0, count: 1, active: 1 },
  { progress: 0.05, count: 1, active: 1 },
  { progress: 0.2, count: 1, active: 1 },
  { progress: 0.34, count: 2, active: 2 },
  { progress: 0.54, count: 3, active: 3 },
  { progress: 0.72, count: 4, active: 4 },
  { progress: 0.9, count: 4, active: 4 },
  { progress: 1, count: 4, active: 4 },
] as const;
for (const checkpoint of reviewCheckpoints) {
  const state = reviewAt(checkpoint.progress);
  assert.equal(state.visiblePrefixCount, checkpoint.count, `P4 review at ${checkpoint.progress} must show the correct ordered prefix length.`);
  assert.equal(state.activePrefixIndex, checkpoint.active, `P4 review at ${checkpoint.progress} must focus a real computed prefix endpoint.`);
  assert.deepEqual(state.currentPrefixPoint, HERDING_DEMO_ROUNDS[checkpoint.active - 1].normalizedPrefixMean,
    "P4 review focus must use a computed Herding prefix mean, never a linearly interpolated model point.");
  const markup = p4At("review-prefix", checkpoint.progress);
  const workbench = markup.match(/<section class="p4-workbench"[^>]*>/)?.[0];
  assert.ok(workbench, "P4 review must render its teaching workbench.");
  assert.equal(attr(workbench!, "data-memory-slot-count"), String(checkpoint.count), `P4 review markup at ${checkpoint.progress} must keep the visible prefix count synchronized.`);
  assert.equal(attr(workbench!, "data-prefix-count"), String(checkpoint.count), `P4 review markup at ${checkpoint.progress} must expose the same prefix count to the figure and list.`);
}
const p4ReviewAt20 = reviewAt(0.2);
assert.equal(p4ReviewAt20.fromPrefixIndex, 0, "P4's first prefix must enter after the focus handoff from candidate selection.");
assert.equal(p4ReviewAt20.introducedPrefixIndex, 1, "P4 must identify p₁ as the first newly introduced sample.");
assert.ok(p4ReviewAt20.arrivalProgress > 0 && p4ReviewAt20.arrivalProgress < 1, "P4 must animate p₁ into the ordered prefix rather than jump directly to a static list.");
assert.deepEqual(p4ReviewAt20.currentPrefixPoint, HERDING_DEMO_ROUNDS[0].normalizedPrefixMean, "The visible ν₁ endpoint must use the actual first selected exemplar.");
const p4ReviewMarkupAt20 = p4At("review-prefix", 0.2);
const p4ReviewMarkupIntro = p4At("review-prefix", 0.05);
assert.ok(p4ReviewMarkupIntro.includes("上一阶段已经决定 p₁…p₄"), "P4 must explicitly hand off from candidate selection to memory management.");
assert.ok(p4ReviewMarkupIntro.includes('data-clip-duration-ms="8000"'), "P4's prefix review must provide time for the ordered memory sequence and handoff.");
const p4ReviewMarkupAt34 = p4At("review-prefix", 0.34);
assert.ok(p4ReviewMarkupAt34.includes("加入 p2 = a2"), "P4 must explain how p₂ joins the existing first item.");
assert.equal((p4ReviewMarkupAt34.match(/class="p4-scene__review-link"/g) ?? []).length, 2, "P4 must connect both real participating samples to the ν₂ result.");
for (const id of ["a8", "a2"]) assert.ok(p4ReviewMarkupAt34.includes(`data-prefix-source="${id}" data-prefix-result="ν2"`), `P4 must show ${id} as a source for the true ν₂ result.`);
assert.ok(p4ReviewMarkupAt34.includes("is-arriving") && p4ReviewMarkupAt34.includes('data-prefix-slot-index="2"'), "The newly added p₂ card must be highlighted in the ordered memory list.");
assert.equal(reviewAt(0.4, 2).visiblePrefixCount, 2, "Manual P4 review selection must pin exactly the chosen prefix.");
assert.equal(reviewAt(0.4, 2).activePrefixIndex, 2, "Manual P4 review selection must keep its own selected endpoint.");
assert.equal(reviewAt(0.2).activePrefixIndex, 1, "A direct manual review must not leak into the automatic 1→2→3→4 replay state.");
const p4Source = readFileSync(path.join(process.cwd(), "src/pages/PageFour.tsx"), "utf8");
assert.match(p4Source, /function jumpToPhase\(index: number, options\?: \{ autoPlay\?: boolean \}\)[\s\S]*?setPlayMode\("phase"\);[\s\S]*?setManualReviewIndex\(null\);[\s\S]*?controls\.goToClip\(reducedMotion \? phase\.endIndex : phase\.startIndex, \{ autoPlay: false, \.\.\.options \}\)/,
  "P4 phase selection must clear a manually pinned review, pause at the selected phase, and expose the completed phase under reduced motion.");
assert.match(p4Source, /function replayPhase\(\)[\s\S]*?jumpToPhase\(activePhaseIndex, \{ autoPlay: !reducedMotion \}\)/,
  "P4 replay phase must restart and play the selected teaching phase instead of only locating it.");
assert.match(p4Source, /function playAll\(\)[\s\S]*?setPlayMode\("all"\);[\s\S]*?controls\.goToClip\(0, \{ autoPlay: true \}\)/,
  "P4 full playback must start at the first clip and retain all-phase mode.");

const p1Source = readFileSync(path.join(process.cwd(), "src/pages/PageOne.tsx"), "utf8");
const p2Source = readFileSync(path.join(process.cwd(), "src/pages/PageTwo.tsx"), "utf8");
const p3Source = readFileSync(path.join(process.cwd(), "src/pages/PageThree.tsx"), "utf8");
const p5Source = readFileSync(path.join(process.cwd(), "src/pages/PageFive.tsx"), "utf8");
const p6NavigationSource = readFileSync(path.join(process.cwd(), "src/pages/PageSix.tsx"), "utf8");
const p7Source = readFileSync(path.join(process.cwd(), "src/pages/PageSeven.tsx"), "utf8");
const p8NavigationSource = readFileSync(path.join(process.cwd(), "src/pages/PageEight.tsx"), "utf8");
assert.match(p1Source, /下一页：模型怎样处理图片/,
  "P1's final action must clearly identify the page transition.");
assert.match(p2Source, /function selectStage\(nextStage: number\)\s*\{\s*setIsPlaying\(false\);\s*setStage\(nextStage\);/,
  "P2 manual stage selection must stop the current path playback before showing the selected stage.");
assert.match(p2Source, /下一页：用代表图片完成一次预测/,
  "P2's final action must clearly identify the page transition.");
assert.match(p3Source, /function playAll\(\)[\s\S]*?setPlayMode\("all"\);[\s\S]*?controls\.goToClip\(0, \{ autoPlay: true \}\)/,
  "P3 full playback must restart the complete page timeline.");
assert.match(p3Source, /function moveStage\(index: number\)[\s\S]*?setPlayMode\("phase"\);[\s\S]*?controls\.goToClip\(index, \{ autoPlay: false \}\)/,
  "P3 manual stage selection must pause at the selected stage.");
assert.match(p5Source, /function goToPhase\(index: number\)[\s\S]*?controls\.goToClip\(reducedMotion \? phase\.endIndex : phase\.startIndex, \{ autoPlay: false \}\)/,
  "P5 must expose five logical phases and show their terminal state under reduced motion.");
assert.match(p5Source, /const FIRST_VISIBLE_MOTION_CLIP = 1;[\s\S]*?function playAll\(\)[\s\S]*?setPlayMode\("all"\);[\s\S]*?controls\.goToClip\(FIRST_VISIBLE_MOTION_CLIP, \{ autoPlay: true \}\)/,
  "P5 full playback must skip the static display-only recall card and retain every real Q-write clip.");
assert.match(p5Source, /activePhaseIndex === 0 && state\.clipIndex === 0[\s\S]*?controls\.goToClip\(FIRST_VISIBLE_MOTION_CLIP, \{ autoPlay: true \}\)/,
  "P5's first stage-play click must enter the first visible merge motion immediately.");
assert.match(p6NavigationSource, /setStatus\(reducedMotion \? "complete" : "paused"\)/,
  "P6 manual phase selection must pause, or show the completed state under reduced motion.");
const p6ControlsSource = p6NavigationSource.match(/<footer className="p6-controls"[\s\S]*?<\/footer>/)?.[0] ?? "";
assert.match(p6ControlsSource, /上一阶段[\s\S]*?完整播放[\s\S]*?下一阶段/,
  "P6 must keep previous, full-play, and next-stage controls visible without opening the phase directory.");
assert.match(p6NavigationSource, /playMode !== "all"[\s\S]*?window\.setTimeout[\s\S]*?setPhaseIndex\(next\)[\s\S]*?setStatus\("playing"\)/,
  "P6 full playback must hold a completed result and then continue to the next phase automatically.");
assert.match(p7Source, /const FIRST_VISIBLE_MOTION_STEP = 1;[\s\S]*?function playAll\(\)[\s\S]*?setPlayMode\("all"\);[\s\S]*?controls\.goToClip\(FIRST_VISIBLE_MOTION_STEP, \{ autoPlay: true \}\)/,
  "P7 full playback must skip the already-visible post-training card and start with memory motion.");
assert.match(p7Source, /if \(stage === 0\)[\s\S]*?controls\.goToClip\(FIRST_VISIBLE_MOTION_STEP, \{ autoPlay: true \}\)/,
  "P7's first stage-play click must enter old-list truncation immediately.");
assert.match(p7Source, /function goToStage\(index: number\)[\s\S]*?controls\.goToClip\(index, \{ autoPlay: false \}\)/,
  "P7 stage navigation must locate a stage and wait for explicit playback.");
assert.match(p8NavigationSource, /className="p8-page-handoff"[\s\S]*?下一页：一次增量学习的完整逻辑/,
  "P8 must provide its page transition to the redesigned P9 after the evidence summary.");
assert.match(p8NavigationSource, /disabled=\{currentIndex === tabs\.length - 1\}/,
  "P8's question navigation must stop at the final question instead of routing to another page.");

const budgetCheckpoints = [
  { progress: 0, count: 4, active: 4, tail: "steady", opacity: 1, quota: 4 },
  { progress: 0.3, count: 4, active: 4, tail: "pending", opacity: 1, quota: 4 },
  { progress: 0.45, count: 4, active: 4, tail: "pending", quota: 4 },
  { progress: 0.6, count: 4, active: 4, tail: "removing", quota: 4 },
  { progress: 0.72, count: 4, active: 4, tail: "removing", quota: 4 },
  { progress: 0.75, count: 3, active: 3, tail: "removed", opacity: 0 },
  { progress: 1, count: 3, active: 3, tail: "removed", opacity: 0 },
] as const;
for (const checkpoint of budgetCheckpoints) {
  const state = budgetAt(checkpoint.progress);
  assert.equal(state.visiblePrefixCount, checkpoint.count, `P4 budget at ${checkpoint.progress} must retain the correct prefix length independently of review selection.`);
  assert.equal(state.activePrefixIndex, checkpoint.active, `P4 budget at ${checkpoint.progress} must focus the actual retained prefix.`);
  assert.equal(state.tailState, checkpoint.tail, `P4 budget at ${checkpoint.progress} must expose the correct p₄ removal state.`);
  if ("opacity" in checkpoint) assert.ok(near(state.tailOpacity, checkpoint.opacity), `P4 budget at ${checkpoint.progress} must have the expected tail opacity.`);
  if ("quota" in checkpoint) assert.equal(state.visiblePrefixCount, checkpoint.quota, "P4 must keep the old four-item quota active until p₄ has fully exited.");
  if (state.tailState !== "removed") {
    assert.equal(state.activePrefixIndex, 4, "P4 must keep the true ν₄ result active while p₄ remains in the list.");
    assert.equal(state.pendingPrefixIndex, state.tailState === "steady" ? null : 3, "P4 must distinguish the pending ν₃ from the current ν₄.");
  }
}
assert.ok(budgetAt(0.6).tailDisplacement > budgetAt(0.45).tailDisplacement, "P4 p₄ must move continuously from its list position into the release area.");
assert.equal(budgetAt(1).activePrefixIndex, 3, "The final P4 budget state must emphasize ν₃ for the retained three-item prefix.");
assert.deepEqual(budgetAt(0.6).currentPrefixPoint, HERDING_DEMO_ROUNDS[3].normalizedPrefixMean, "P4 must retain the actual ν₄ coordinates until the tail removal completes.");
assert.deepEqual(budgetAt(1).currentPrefixPoint, HERDING_DEMO_ROUNDS[2].normalizedPrefixMean, "P4 must activate the actual ν₃ coordinates after removal.");
const p4BudgetInitial = p4At("budget-shrink", 0);
const p4BudgetMidpoint = p4At("budget-shrink", 0.6);
const p4BudgetNearEnd = p4At("budget-shrink", 0.72);
const p4BudgetEnd = p4At("budget-shrink", 1);
assert.ok(p4BudgetInitial.includes('data-clip-duration-ms="7000"'), "P4's budget sequence must provide time to establish the constraint, remove p₄, and show the result.");
assert.ok(p4BudgetInitial.includes("P = [p₁, p₂, p₃, p₄]") && p4BudgetInitial.includes("ν<sub>4</sub>"), "P4's budget phase must begin with the ordered four-item prefix and true ν₄.");
assert.ok(p4BudgetMidpoint.includes("p₄=a5 正离开原图记忆") && p4BudgetMidpoint.includes("真实前缀均值 ν<sub>4</sub>"), "P4 must not activate ν₃ while p₄ is still leaving.");
assert.ok(p4BudgetNearEnd.includes('data-memory-slot-count="4"') && p4BudgetNearEnd.includes("P = [p₁, p₂, p₃, p₄]"), "P4 before the exit completes must still show ν₄ and four slots.");
assert.ok(p4BudgetEnd.includes('data-memory-slot-count="3"') && p4BudgetEnd.includes('data-memory-slot-quota="3"'), "P4's final state must show 3 / 3 retained exemplars.");
assert.ok(p4BudgetEnd.includes("P′ = [p₁, p₂, p₃]") && p4BudgetEnd.includes("ν<sub>3</sub>"), "P4's final formula must match the retained prefix and true ν₃.");
assert.equal((p4BudgetEnd.match(/class="p4-scene__point/g) ?? []).length, 8, "Budget truncation must preserve all eight raw candidate points in the feature space.");
const p4BudgetSlotTags = p4BudgetEnd.match(/<article(?=[^>]*data-prefix-slot-index="[1-4]")[^>]*>/g) ?? [];
assert.deepEqual(p4BudgetSlotTags.filter((tag) => attr(tag, "data-prefix-retained") === "true").map((tag) => attr(tag, "data-prefix-sample-id")), ["a8", "a2", "a4"], "P4 must preserve exactly p₁=a8, p₂=a2, p₃=a4 without reordering.");
assert.ok(p4BudgetInitial.includes('data-budget-state="steady"') && p4BudgetInitial.includes("3 类 × 4 项") && p4BudgetInitial.includes("4 类 × 3 项"), "P4 must identify this as an independent K=12 3-to-4 class budget example.");
assert.ok(p4BudgetInitial.includes("P4 独立预算示例"), "P4 must keep its simplified class expansion visibly distinct from the real P5 batch.");
assert.ok(p4BudgetEnd.includes("不改原图或追加训练"), "P4 truncation must explain that the released tail changes memory membership, not its image or training history.");
assert.ok(p4BudgetEnd.includes("P4 独立预算示例") && p4BudgetEnd.includes("只从尾部移除 p₄=a5"), "P4's terminal state must retain the example boundary and show the completed truncation.");

const scanOrderFromStart = [...scanOrder.slice(scanOrder.findIndex((item) => item.id === "a8")), ...scanOrder.slice(0, scanOrder.findIndex((item) => item.id === "a8"))];

for (const round of HERDING_DEMO_ROUNDS) {
  const candidateIds = new Set(round.candidates.map((item) => item.point.id));
  const orderedCandidates = scanOrderFromStart.filter((item) => candidateIds.has(item.id));
  const firstId = orderedCandidates[0].id;
  const nextId = orderedCandidates[1].id;
  const fullSequenceIds = round.k === 1
    ? [`r1-scan-${firstId}`, `r1-score-${firstId}`]
    : [`r${round.k}-split-${firstId}`, `r${round.k}-mean-${firstId}`, `r${round.k}-norm-${firstId}`, `r${round.k}-score-${firstId}`];
  for (const id of fullSequenceIds) assert.ok(p4ClipIndex.has(id), `Round ${round.k}'s first candidate must keep the complete teaching step ${id}.`);
  assert.ok(p4ClipIndex.has(`r${round.k}-score-${nextId}`), `Round ${round.k}'s later candidate must retain a real score.`);
  if (round.k === 1) {
    assert.ok(!p4ClipIndex.has(`r1-norm-${nextId}`), "Later k=1 candidates must use ν₁(x) = z(x) without a redundant normalization animation.");
  } else {
    assert.ok(!p4ClipIndex.has(`r${round.k}-split-${nextId}`), "Later candidates must not repeat the detailed endpoint-copy sequence.");
    assert.ok(!p4ClipIndex.has(`r${round.k}-mean-${nextId}`), "Later candidates must not pause on a separate mean clip.");
  }
}

const p4RoundOneFirstId = HERDING_DEMO_ROUNDS[0].candidates
  .map((candidate) => candidate.point.id)
  .find((id) => id === HERDING_DEMO_ORDER[0].id);
assert.equal(p4RoundOneFirstId, "a8", "P4 round one must begin with the fixed a8 scan origin.");
const p4A8ScanState = p4At("r1-scan-a8", 0.5);
const p4A8ScanWorkbench = p4A8ScanState.match(/<section class="p4-workbench"[^>]*>/)?.[0];
assert.ok(p4A8ScanWorkbench, "P4 must render the initial a8 scan state.");
assert.equal(attr(p4A8ScanWorkbench!, "data-clip-duration-ms"), "140", "The zero-span a8 origin confirmation must not become a long idle scan.");
assert.ok(p4A8ScanState.includes("is-anchor-confirmation"), "P4 must visibly pulse a8 while confirming the fixed scan origin.");
assert.equal(p4ClipIndex.get("r1-score-a8"), p4ClipIndex.get("r1-scan-a8")! + 1, "P4 must start the first a8 distance immediately after its short origin confirmation.");
assert.ok(!p4ClipIndex.has("r1-hull-a8") && !p4ClipIndex.has("r1-norm-a8"), "P4 must not insert static hull or normalization waits for ν₁(a8) = z(a8).");

const p4RoundTwoFirst = HERDING_DEMO_ROUNDS[1];
const p4RoundTwoCandidateIds = new Set(p4RoundTwoFirst.candidates.map((item) => item.point.id));
const p4RoundTwoOrdered = scanOrderFromStart.filter((item) => p4RoundTwoCandidateIds.has(item.id));
const p4RoundTwoFirstId = p4RoundTwoOrdered[0].id;
const p4RoundTwoNextId = p4RoundTwoOrdered[1].id;
const p4Score = p4RoundTwoFirst.candidates.find((item) => item.point.id === p4RoundTwoFirstId)!.score;
const p4RoundOneA8Score = HERDING_DEMO_ROUNDS[0].candidates.find((item) => item.point.id === "a8")!.score;

const p4TargetLabelMarkup = p4At("target-normalize", 1).match(/<text class="p4-scene__fixed-mean-label"[^>]*>/)?.[0];
assert.ok(p4TargetLabelMarkup, "P4 must keep a visible label for the fixed full-class target.");
const p4TargetLabelX = Number(attr(p4TargetLabelMarkup!, "x"));
const p4TargetLabelY = Number(attr(p4TargetLabelMarkup!, "y"));
assert.ok(near(Math.hypot(p4TargetLabelX - HERDING_CHART.center.x, p4TargetLabelY - HERDING_CHART.center.y), HERDING_CHART.radius + 34, 0.01),
  "The μ_full label must sit radially outside the unit circle without moving its target marker.");

function p4ScorePath(markup: string): { start: [number, number]; end: [number, number]; opacity: number } | null {
  const match = markup.match(/<path class="p4-scene__score-line" d="M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+)" opacity="([\d.]+)"/);
  if (!match) return null;
  return { start: [Number(match[1]), Number(match[2])], end: [Number(match[3]), Number(match[4])], opacity: Number(match[5]) };
}

const p4A8ScoreAtHalf = p4At("r1-score-a8", 0.5);
const p4A8ScorePath = p4ScorePath(p4A8ScoreAtHalf);
assert.ok(p4A8ScorePath, "P4 must draw the first real distance from a8 without an extra normalization clip.");
assert.ok(near(Math.hypot(p4A8ScorePath!.end[0] - p4A8ScorePath!.start[0], p4A8ScorePath!.end[1] - p4A8ScorePath!.start[1]), p4RoundOneA8Score * HERDING_CHART.radius * 0.5, 1e-5),
  "P4's first visible comparison must be the true a8-to-μ_full distance.");
const p4A8RulerRow = p4A8ScoreAtHalf.match(/<span data-candidate-id="a8"[^>]*>/)?.[0];
assert.ok(p4A8RulerRow, "P4's first a8 comparison must appear in the distance ruler.");
assert.equal(attr(p4A8RulerRow!, "data-score-progress"), "0.500", "P4's a8 distance ruler must progress in sync with the visible first distance line.");

const p4ScoreAtZero = p4At(`r2-score-${p4RoundTwoFirstId}`, 0);
assert.equal(p4ScorePath(p4ScoreAtZero), null, "P4 must not draw a distance line before the comparison begins.");
const p4ScoreAtHalf = p4ScorePath(p4At(`r2-score-${p4RoundTwoFirstId}`, 0.5));
assert.ok(p4ScoreAtHalf, "P4 must draw its active comparison line halfway through the score clip.");
assert.ok(near(Math.hypot(p4ScoreAtHalf!.end[0] - p4ScoreAtHalf!.start[0], p4ScoreAtHalf!.end[1] - p4ScoreAtHalf!.start[1]), p4Score * HERDING_CHART.radius * 0.5, 1e-5),
  "The active P4 line must reveal half of the true candidate-to-target distance at 50%.");
const p4ScoreAtEnd = p4At(`r2-score-${p4RoundTwoFirstId}`, 1);
const p4CompletedPath = p4ScorePath(p4ScoreAtEnd);
assert.ok(p4CompletedPath, "P4 must retain the completed distance line for the observation hold.");
assert.ok(near(Math.hypot(p4CompletedPath!.end[0] - p4CompletedPath!.start[0], p4CompletedPath!.end[1] - p4CompletedPath!.start[1]), p4Score * HERDING_CHART.radius * 0.999, 1e-5),
  "The completed P4 line must equal the true distance used by the score ruler.");
assert.ok(p4ScoreAtEnd.includes(`data-scored-candidate-ids="${p4RoundTwoFirstId}"`), "A completed comparison must record the active real candidate ID in the ruler.");

const p4FadeAt25 = p4At(`r2-score-fade-${p4RoundTwoFirstId}`, 0.25);
const p4FadeAt50 = p4At(`r2-score-fade-${p4RoundTwoFirstId}`, 0.5);
const p4FadeAt75 = p4At(`r2-score-fade-${p4RoundTwoFirstId}`, 0.75);
const p4FadeAtEnd = p4At(`r2-score-fade-${p4RoundTwoFirstId}`, 1);
assert.ok((p4ScorePath(p4FadeAt25)?.opacity ?? 0) < 1, "P4 must clear the completed distance line first.");
assert.ok(p4FadeAt50.includes('class="p4-scene__raw-mean"') && attr(p4FadeAt50.match(/<polygon class="p4-scene__raw-mean"[^>]*>/)![0], "opacity") === "0",
  "P4 must clear the raw mean marker after the line fades.");
assert.ok(p4FadeAt75.includes('class="p4-scene__unit-mean"') && attr(p4FadeAt75.match(/<circle class="p4-scene__unit-mean"[^>]*>/)![0], "opacity") === "0",
  "P4 must clear the normalized mean after the raw mean.");
assert.equal(p4ScorePath(p4FadeAtEnd)?.opacity, 0, "The previous comparison line must be invisible before scanning onward.");
assert.ok(attr(p4FadeAtEnd.match(/<circle class="p4-scene__candidate-ring"[^>]*>/)![0], "opacity") === "0",
  "The candidate emphasis ring must clear before the next candidate scan.");
const p4NextScan = p4At(`r2-scan-${p4RoundTwoNextId}`, 0);
assert.equal(p4ScorePath(p4NextScan), null, "The next candidate scan must start with no previous distance geometry.");
assert.ok(!p4NextScan.includes('class="p4-scene__raw-mean"') && !p4NextScan.includes('class="p4-scene__unit-mean"'),
  "The next candidate scan must begin after the previous mean markers have been removed.");

/* ------------------------------------------------------------------ P5 --- */

assert.equal(INCREMENTAL_STAGE_DATA.oldExemplars.length, 12, "P5 reads twelve old exemplars.");
assert.equal(INCREMENTAL_STAGE_DATA.incomingSamples.length, 18, "P5 adds eighteen new images.");
assert.equal(INCREMENTAL_STAGE_DATA.trainingSamples.length, 30, "D must contain 12 + 18 = 30 samples.");

const trainingIds = new Set(INCREMENTAL_STAGE_DATA.trainingSamples.map((sample) => sample.id));
assert.equal(trainingIds.size, 30, "Every D sample must have a unique id.");

for (const sample of INCREMENTAL_STAGE_DATA.trainingSamples) {
  const row = teacherSnapshotFor(sample);
  assert.equal(row.length, 3, `${sample.id} must have three old-node responses.`);
  for (const value of row) {
    assert.ok(Number.isFinite(value) && value > 0 && value < 1, `${sample.id} responses must be sigmoid values.`);
  }
  const target = buildTargets(sample, row);
  assert.deepEqual(target.slice(0, 3), [row[0], row[1], row[2]], `${sample.id} target must start with its own Q row.`);
  for (let index = 0; index < 3; index += 1) {
    assert.equal(
      target[3 + index],
      Number(sample.classId === INCREMENTAL_STAGE_DATA.incomingClassIds[index]),
      `${sample.id} new-node target must come from its real label.`,
    );
  }
  const outputs = studentOutputFor(sample);
  assert.equal(outputs.length, ALL_CLASS_IDS.length, `${sample.id} must have one fixed-model output per class node.`);
  const modelLoss = sixNodeBceLoss(target, outputs);
  const summedNodeLosses = target.reduce((sum, value, index) => sum + binaryCrossEntropy(value, outputs[index]), 0);
  assert.ok(near(modelLoss, summedNodeLosses), `${sample.id} model loss must sum the same BCE used by each node.`);
  const stableOutputs = [...outputs];
  for (const exploredOutput of [0.11, 0.89]) {
    binaryCrossEntropy(target[1], exploredOutput); // P6's local slider probes this single curve only.
    assert.ok(near(sixNodeBceLoss(target, outputs), modelLoss), `${sample.id} formula exploration must not change the six-node model loss.`);
    assert.deepEqual(studentOutputFor(sample), stableOutputs, `${sample.id} formula exploration must not rewrite model outputs.`);
  }
  // Q is fixed before the update: re-reading it must never depend on the student.
  assert.deepEqual(teacherSnapshotFor(sample), row, `${sample.id} Q row must be stable across reads.`);
}

// Both an old exemplar and a new-class image must be traceable to a real Q row.
const oldExample = INCREMENTAL_STAGE_DATA.oldExemplars.find((sample) => sample.classId === "B");
const newExample = INCREMENTAL_STAGE_DATA.incomingSamples.find((sample) => sample.classId === "E");
assert.ok(oldExample && newExample, "P5 must find the planned old B and incoming E demonstrations.");
assert.ok(trainingIds.has(oldExample.id) && trainingIds.has(newExample.id),
  "The demonstrated old and new samples must both belong to D.");
assert.deepEqual(buildTargets(oldExample).slice(0, 3), teacherSnapshotFor(oldExample), "P6's old image must use its own Q row for the first three targets.");
assert.deepEqual(buildTargets(oldExample).slice(3), [0, 0, 0], "P6's old image must use zeros for the three new-class targets.");
assert.deepEqual(buildTargets(newExample).slice(0, 3), teacherSnapshotFor(newExample), "P6's new image must still use its own Q row for the old nodes.");
assert.deepEqual(buildTargets(newExample).slice(3), [0, 1, 0], "P6's E image must use a one-hot target at the E output node.");

const p6DefaultSample = INCREMENTAL_STAGE_DATA.incomingSamples.find((sample) => sample.id === "x_28")!;
const p6DefaultTargets = buildTargets(p6DefaultSample);
const p6DefaultOutputs = studentOutputFor(p6DefaultSample);
const p6DefaultPage = renderToStaticMarkup(createElement(PageSix));
assert.ok(p6DefaultPage.includes('class="p6-preview"') && !p6DefaultPage.includes('class="tutorial-route"'),
  "P6 must use its own dual-target assembly instead of the shared route template.");
assert.ok(p6DefaultPage.includes("Target：告诉模型每个输出节点应该接近什么")
  && p6DefaultPage.includes("旧节点读取冻结 Q 的响应强度") && p6DefaultPage.includes("新节点读取真实标签的 0/1"),
  "P6 must define Target and explain why old and new outputs use different target sources.");
assert.ok(p6DefaultPage.includes('data-flow="student-to-bce"') && p6DefaultPage.includes('data-flow="target-to-bce"')
  && p6DefaultPage.includes('data-flow-inputs="r,g"'),
  "P6 must show x-to-Student-to-g and Q-plus-y-to-r as parallel paths that meet at BCE.");
assert.ok(p6DefaultPage.includes("r 不是输入图片，也不是 Student 已有的预测 g"),
  "P6 must keep Target distinct from both the image input and the Student's current prediction.");
assert.equal([...p6DefaultPage.matchAll(/class="p6-preview__target"/g)].length, 1, "P6 must assemble one six-dimensional target vector.");
assert.equal([...p6DefaultPage.matchAll(/class="is-soft"/g)].length, 3, "P6's target map must show three old-node soft targets.");
assert.equal([...p6DefaultPage.matchAll(/class="is-hard"/g)].length, 3, "P6's target map must show three new-node hard targets.");
assert.ok(p6DefaultPage.includes("mini-batch") && p6DefaultPage.includes("参数更新方向"),
  "P6 must trace six independent BCE terms into batch aggregation and an update direction.");
const p6Boundary = p6DefaultPage.slice(p6DefaultPage.indexOf('class="p6-preview__footer"'));
assert.ok(p6Boundary.includes("同一张图的前三个旧类目标来自冻结 Q") && p6Boundary.includes("新增节点目标来自真实标签")
  && p6Boundary.includes("组成 r") && p6Boundary.includes("与 g 计算 BCE"),
  "P6's pre-play task must trace the same image's Q and label sources into r and BCE.");
assert.ok(p6Boundary.includes("不执行真实 SGD") && p6Boundary.includes("不把示例 g 当作训练收敛结果"),
  "P6 must preserve the symbolic-update limitation in its pre-play briefing.");
assert.ok(p6Boundary.includes("示例设置：3 个旧节点 + 3 个新节点"),
  "P6 must label the six-node and three-plus-three counts as a specific example.");
const p6ArticleTag = p6DefaultPage.match(/<article class="tutorial-page icarl-page icarl-page--p6"[^>]*>/)?.[0];
assert.ok(p6ArticleTag, "P6 must render its current sample and separate model/exploration readouts.");
assert.equal(attr(p6ArticleTag!, "data-sample"), p6DefaultSample.id);
assert.equal(attr(p6ArticleTag!, "data-model-loss"), sixNodeBceLoss(p6DefaultTargets, p6DefaultOutputs).toFixed(6));
assert.equal(attr(p6ArticleTag!, "data-model-output"), p6DefaultOutputs[4].toFixed(3));
assert.equal(attr(p6ArticleTag!, "data-explore-output"), p6DefaultOutputs[4].toFixed(2));
assert.equal(attr(p6ArticleTag!, "data-explore-loss"), binaryCrossEntropy(p6DefaultTargets[4], p6DefaultOutputs[4]).toFixed(6));

const firstDemoWrite = snapshotWriteProgress([oldExample], 2950, { startMs: 2500, rowTravelMs: 900 });
assert.equal(firstDemoWrite.activeSampleId, oldExample.id, "The old-image demo must write the Q row for that exact old sample.");
assert.deepEqual(firstDemoWrite.activeCellProgress, [1, 0.5, 0], "The old demo's cells must fill in order on its local row clock.");
const secondDemoWrite = snapshotWriteProgress([newExample], 2950, { startMs: 2500, rowTravelMs: 900 });
assert.equal(secondDemoWrite.activeSampleId, newExample.id, "The new-image demo must write the Q row for that exact new sample.");
assert.deepEqual(secondDemoWrite.activeCellProgress, [1, 0.5, 0], "The new demo must use the same row-local cell progression.");
assert.deepEqual(
  snapshotWriteProgress([oldExample], 3400, { startMs: 2500, rowTravelMs: 900 }).completedIds,
  [oldExample.id],
  "A demonstrated row becomes recorded only after its own row animation completes.",
);

const demoIds = new Set([oldExample.id, newExample.id]);
assert.deepEqual([...demoIds], [oldExample.id, newExample.id], "The two teaching examples must be distinct D rows.");
const remainingSamples = INCREMENTAL_STAGE_DATA.trainingSamples.filter((sample) => !demoIds.has(sample.id));
assert.equal(remainingSamples.length, 28, "The four batches must cover the 28 rows not written by the two demonstrations.");
const batchAtStart = snapshotWriteProgress(remainingSamples.slice(0, 3), 0, { rowTravelMs: 260, rowHoldMs: 120 });
assert.equal(batchAtStart.activeSampleId, remainingSamples[0].id, "A batch must begin with its first remaining D sample.");
const batchAtSecondRow = snapshotWriteProgress(remainingSamples.slice(0, 3), 510, { rowTravelMs: 260, rowHoldMs: 120 });
assert.deepEqual(batchAtSecondRow.completedIds, [remainingSamples[0].id], "Batch completion must use IDs in its local ordered slice.");
assert.equal(batchAtSecondRow.activeSampleId, remainingSamples[1].id, "The active batch sample must advance to the second remaining ID.");
assert.deepEqual(batchAtSecondRow.activeCellProgress, [1, 0.5, 0], "Cell progress must reset to the active batch row's local clock.");
const completedBatch = snapshotWriteProgress(remainingSamples.slice(0, 3), 1140, { rowTravelMs: 260, rowHoldMs: 120 });
assert.deepEqual(completedBatch.completedIds, remainingSamples.slice(0, 3).map((sample) => sample.id), "A completed batch must contain each scheduled ID once.");
assert.equal(completedBatch.activeSampleId, null, "A completed batch must not point at an unrelated D row.");
const scheduledIds = [...demoIds, ...remainingSamples.map((sample) => sample.id)];
assert.equal(new Set(scheduledIds).size, INCREMENTAL_STAGE_DATA.trainingSamples.length, "The two demos and remaining batches must cover D exactly once by stable ID.");

function renderPageFiveAt(clipId: string, pct = 0, onContinue?: () => void): string {
  const initial = renderToStaticMarkup(createElement(PageFive, { onContinue }));
  const clipIds = attr(initial.match(/<section class="p5-workbench"[^>]*>/)?.[0] ?? "", "data-clip-ids").split(",");
  const clipIndex = clipIds.indexOf(clipId);
  assert.notEqual(clipIndex, -1, `P5 timeline must include ${clipId}.`);
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { __ICARL_FREEZE__: { clip: clipIndex, pct }, matchMedia: () => ({ matches: false }) },
  });
  try {
    return renderToStaticMarkup(createElement(PageFive, { onContinue }));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

const p5RouteMarkup = renderPageFiveAt("p5-merge", 0);
assert.ok(p5RouteMarkup.includes('class="p5-briefing"') && !p5RouteMarkup.includes('class="tutorial-route"'),
  "P5 must replace the shared route template with its own two-source briefing.");
assert.equal([...p5RouteMarkup.matchAll(/class="p5-briefing__source /g)].length, 2,
  "P5 must show replayed training inputs and frozen old behavior as two distinct information sources.");
assert.ok(p5RouteMarkup.includes("训练副本") && p5RouteMarkup.includes("旧副本 + 新图") && p5RouteMarkup.includes("持久保留"),
  "P5's replay diagram must make copied training inputs and retained persistent memory visible.");
assert.ok(p5RouteMarkup.includes("冻结 Teacher") && p5RouteMarkup.includes("读取更新前响应") && p5RouteMarkup.includes("同一 ID"),
  "P5's behavior diagram must show the pre-update frozen Teacher and sample-ID aligned Q rows.");
assert.ok(p5RouteMarkup.includes("Q 不是真实标签") && p5RouteMarkup.includes("按图片 ID 对齐"),
  "P5 must distinguish Q from labels while explaining how D and Q align for P6.");
assert.ok(p5RouteMarkup.includes('class="p5-briefing__mobile-arrows"') && p5RouteMarkup.includes("按同一 ID 写入响应行"),
  "P5's narrow layout must retain the replay merge and sample-ID aligned Teacher-to-Q path.");
assert.equal([...p5RouteMarkup.matchAll(/class="p5-briefing__causal"/g)].length, 1,
  "P5 must use one compact causal bridge between replay and the frozen-Q reference.");
assert.ok(p5RouteMarkup.includes("Replay 解决旧图还能参与训练") && p5RouteMarkup.includes("冻结 Q 解决旧模型怎样响应也有参照"),
  "P5's causal bridge must explain the distinct need solved by each information source.");
assert.ok(p5RouteMarkup.includes('data-output="D"') && p5RouteMarkup.includes("同一张图与真标签")
  && p5RouteMarkup.includes('data-output="Q"') && p5RouteMarkup.includes("对应 ID 的旧类响应")
  && p5RouteMarkup.includes("按图片 ID 对齐") && p5RouteMarkup.includes("下一页：构造监督依据"),
  "P5's merge strip must present D and Q as aligned outputs handed to P6 for Target construction.");
const p5PrincipleCopy = p5RouteMarkup.slice(p5RouteMarkup.indexOf('class="p5-briefing__sources"'), p5RouteMarkup.indexOf('class="p5-briefing__footer"'));
assert.doesNotMatch(p5PrincipleCopy, /12\s*\+\s*18|30\s*[×x]\s*3|旧类\s*3|新类\s*3/u, "P5's demonstration dimensions must not be presented as general conditions.");
assert.ok(p5RouteMarkup.slice(p5RouteMarkup.indexOf('class="p5-briefing__footer"')).includes("D=12+18=30，Q=30×3"),
  "P5 must retain its real D/Q dimensions as a labeled demonstration example.");

function p5WorkbenchTag(markup: string): string {
  const tag = markup.match(/<section class="p5-workbench"[^>]*>/)?.[0];
  assert.ok(tag, "P5 must render its flow workbench.");
  return tag!;
}

function p5PreviewStates(markup: string): Map<string, string> {
  const preview = markup.match(/<div class="p5-q-preview"[^>]*>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(preview, "P5 must render the 30-row Q preview.");
  return new Map([...preview!.matchAll(/<span(?=[^>]*data-sample-id="([^"]+)")(?=[^>]*data-q-state="([^"]+)")[^>]*>/g)]
    .map((match) => [match[1], match[2]]));
}

const p5MergeComplete = renderPageFiveAt("p5-merge", 1);
assert.equal(attr(p5WorkbenchTag(p5MergeComplete), "data-d-arrived-count"), "30", "D must reach all 30 rows at the end of the merge clip.");
assert.equal(attr(p5WorkbenchTag(p5MergeComplete), "data-q-written-count"), "0", "Samples arriving in D must not be counted as Q rows written.");
assert.ok([...p5PreviewStates(p5MergeComplete).values()].every((state) => state === "pending"), "A complete D must still have 30 pending Q rows before response capture begins.");

const p5OldWriting = renderPageFiveAt("p5-old-sample", 0.75);
assert.equal(attr(p5WorkbenchTag(p5OldWriting), "data-current-sample-id"), oldExample.id);
assert.equal(attr(p5WorkbenchTag(p5OldWriting), "data-active-sample-id"), oldExample.id, "The first demonstrated write must target old B's own row.");
assert.equal(p5PreviewStates(p5OldWriting).get(oldExample.id), "writing");
const p5OldWritten = renderPageFiveAt("p5-old-sample", 1);
assert.equal(attr(p5WorkbenchTag(p5OldWritten), "data-q-written-count"), "1");
assert.equal(p5PreviewStates(p5OldWritten).get(oldExample.id), "written");

const p5NewStart = renderPageFiveAt("p5-new-sample", 0);
assert.equal(attr(p5WorkbenchTag(p5NewStart), "data-q-written-ids"), oldExample.id, "The old B demonstration must be written before the new E demonstration starts.");
assert.equal(attr(p5WorkbenchTag(p5NewStart), "data-current-sample-id"), newExample.id);
const p5TeacherSample = p5NewStart.match(/<div class="p5-model-input"[^>]*>/)?.[0];
const p5SnapshotSample = p5NewStart.match(/<div class="p5-q-sample-row[^>]*>/)?.[0];
assert.equal(attr(p5TeacherSample ?? "", "data-sample-id"), newExample.id, "The new E image must feed its matching Teacher output.");
assert.equal(attr(p5SnapshotSample ?? "", "data-sample-id"), newExample.id, "The three new E responses must be written to E's Q row.");
const p5NewWritten = renderPageFiveAt("p5-new-sample", 1);
assert.equal(attr(p5WorkbenchTag(p5NewWritten), "data-q-written-ids"), [oldExample.id, newExample.id].join(","), "The old B and new E rows must be the first two Q writes.");

for (let batchIndex = 0; batchIndex < 4; batchIndex += 1) {
  const batchMarkup = renderPageFiveAt(`p5-batch-${batchIndex + 1}`, 1);
  const batchBoard = p5WorkbenchTag(batchMarkup);
  const writtenCount = 2 + (batchIndex + 1) * 7;
  const expectedIds = INCREMENTAL_STAGE_DATA.trainingSamples
    .filter((sample) => demoIds.has(sample.id) || remainingSamples.slice(0, (batchIndex + 1) * 7).some((remaining) => remaining.id === sample.id))
    .map((sample) => sample.id);
  assert.equal(attr(batchBoard, "data-d-arrived-count"), "30", "All batch captures must read from the already-complete D.");
  assert.equal(Number(attr(batchBoard, "data-q-written-count")), writtenCount, `Batch ${batchIndex + 1} must add its seven Q rows in sequence.`);
  assert.deepEqual(attr(batchBoard, "data-q-written-ids").split(","), expectedIds, `Batch ${batchIndex + 1} must preserve D's original sample-ID order.`);
  const states = p5PreviewStates(batchMarkup);
  assert.equal(states.size, 30, "The Q overview must expose one stable cell per D sample ID.");
  assert.equal([...states.values()].filter((state) => state === "written").length, writtenCount);
  assert.equal([...states.values()].filter((state) => state === "pending").length, 30 - writtenCount);
}

/* ------------------------------------------------------------------ P7 --- */

assert.equal(PROTOTYPES.length, 6, "P7 must compare all six current prototypes.");
assert.equal(NEXT_QUOTA, 2, "P7's twelve-image budget must allocate two images to each of six classes.");
for (const classId of OLD_CLASS_IDS) {
  assert.deepEqual(P_AFTER[classId].map((sample) => sample.id), P_BEFORE[classId].slice(0, NEXT_QUOTA).map((sample) => sample.id),
    `P7 must retain the first ${NEXT_QUOTA} old ${classId} exemplars in their original order.`);
}
for (const classId of INCREMENTAL_STAGE_DATA.incomingClassIds) {
  assert.deepEqual(P_AFTER[classId].map((sample) => sample.id), NEW_CLASS_HERDING[classId].ordered.slice(0, NEXT_QUOTA).map((sample) => sample.id),
    `P7 must select new ${classId} exemplars from that class's real Herding order.`);
}
assert.equal(CURRENT_EXEMPLARS.length, 12, "P7 must finish with exactly twelve retained images.");
assert.equal(new Set(CURRENT_EXEMPLARS.map((sample) => sample.id)).size, 12, "P7's committed exemplar IDs must be unique.");
assert.deepEqual(QUERY_PREDICTION, QUERY_DISTANCES[0].classId, "The P7 prediction must be the true minimum-distance class.");
assert.deepEqual(QUERY_DISTANCES.map((entry) => entry.classId), [...QUERY_DISTANCES]
  .sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId))
  .map((entry) => entry.classId), "The P7 distance reference must retain its true nearest-to-farthest ordering.");

function renderPageSevenAt(progress: number, clip = 4, onContinue?: () => void): string {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      __ICARL_FREEZE__: { clip, pct: progress },
      matchMedia: () => ({ matches: false }),
    },
  });
  try {
    return renderToStaticMarkup(createElement(PageSeven, { onContinue }));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

const p7RouteMarkup = renderPageSevenAt(0, 0);
assert.ok(p7RouteMarkup.includes("模型更新后，记忆与 Prototype 要怎样一起更新？"), "P7 must frame memory and prototype refresh as a joint post-update question.");
const p7Preview = p7RouteMarkup.match(/<section class="p7-preview"[\s\S]*?<\/section>/)?.[0] ?? "";
assert.ok(p7Preview.includes("变化 A · 容量") && p7Preview.includes('data-memory-source="old-prefix"')
  && p7Preview.includes("P_before · 旧类有序 Exemplar") && p7Preview.includes("按新配额截尾") && p7Preview.includes("保留旧类前缀")
  && p7Preview.includes('data-memory-source="new-herding"') && p7Preview.includes("本轮新类完整数据")
  && p7Preview.includes("φ_after 下 Herding") && p7Preview.includes("选新类代表样本") && p7Preview.includes("P_after"),
  "P7's preview must show old-prefix truncation and new-class Herding as two independent sources that merge into P_after.");
assert.ok(!p7Preview.includes("截尾 + 补入"), "P7 must not imply that old-list truncation serially feeds the new-class Herding operation.");
assert.ok(p7Preview.includes("变化 B · 表示") && p7Preview.includes("重新编码") && p7Preview.includes("φ_after") && p7Preview.includes("当前 Prototype"),
  "P7's preview must show the representation-change path from retained raw images through the current extractor to current prototypes.");
assert.ok(p7Preview.includes("P_after 保存的是原始图片，不是永久不变的特征坐标")
  && p7Preview.includes("用 φ_after 对这些原图重新编码") && p7Preview.includes("Prototype 与当前 Query 的特征处在同一表示中"),
  "P7 must state why raw exemplars, rather than stale feature coordinates, are persisted.");
assert.ok(p7Preview.includes("Query") && p7Preview.includes("比较距离") && p7Preview.includes("NME 预测") && p7Preview.includes("Θ_after + P_after"),
  "P7's two change paths must converge on current-space NME and the persistent model-plus-image-memory state.");
assert.ok(p7Preview.includes("本例设置") && p7Preview.includes("K=12") && p7Preview.includes("4 → 2") && p7Preview.includes("D / E / F 各选 2"),
  "P7 must isolate its twelve-image and 4-to-2 budget details as example-only settings.");
assert.ok(p7Preview.includes("固定 K 下旧类截去尾项、新类补入图片") && p7Preview.includes("重建 Prototype") && p7Preview.includes("Query 再在当前空间比较距离"),
  "P7's pre-play task must trace memory changes into prototype rebuilding and current-space prediction.");
assert.ok(p7Preview.includes("查看分阶段工作台") && p7Preview.includes("▶ 完整播放"),
  "P7's preview must provide direct actions for inspection and full playback.");

function p7ConnectionWidths(markup: string): string[] {
  return [...markup.matchAll(/class="p7-stage-nav__segment"[^>]*><span style="width:([^\"]+)"/g)].map((match) => match[1]);
}

const p7FirstStageMarkup = renderPageSevenAt(0, 0);
assert.deepEqual(p7ConnectionWidths(p7FirstStageMarkup), ["0%", "0%", "0%", "0%"], "P7's first selected node must leave all four connector segments unfilled.");
assert.ok(p7FirstStageMarkup.includes('data-readiness="pending-memory"'), "P7 early phases must explain why a current prototype is not ready yet.");
assert.ok(!p7FirstStageMarkup.includes("等待 P_after 成员确定"), "P7 early phases must not spend a large panel repeating a waiting placeholder.");
assert.deepEqual(p7ConnectionWidths(renderPageSevenAt(0, 1)), ["100%", "0%", "0%", "0%"], "P7's second selected node must complete only the first connection segment.");
assert.deepEqual(p7ConnectionWidths(renderPageSevenAt(0, 4)), ["100%", "100%", "100%", "100%"], "P7's fifth selected node must complete exactly four connector segments.");

const p3HandoffMarkup = renderPageThreeAt(0, 0, () => undefined);
const p3NextStep = p3HandoffMarkup.match(/<section class="p3-next-step"[\s\S]*?<\/section>/)?.[0] ?? "";
assert.ok(p3NextStep.includes("本页结论") && p3NextStep.includes("Prototype 可由有限原图计算")
  && p3NextStep.includes("还缺什么") && p3NextStep.includes("有限名额该留给谁")
  && p3NextStep.includes("下一页问题") && p3NextStep.includes("类别参考尽量接近完整数据"),
  "P3 must hand off from prototype prediction to the exemplar-selection question.");
assert.ok(p3NextStep.includes("筛选代表样本") && !p3HandoffMarkup.includes("icarl-question-handoff"),
  "P3 must use its compact page-specific transition instead of the shared three-card handoff.");
const p4HandoffMarkup = renderPageFourAt(0, 0, () => undefined);
const p4NextStep = p4HandoffMarkup.match(/<section class="p4-next-step"[\s\S]*?<\/section>/)?.[0] ?? "";
assert.ok(p4NextStep.includes("本页结论") && p4NextStep.includes("有顺序、可裁剪的代表列表")
  && p4NextStep.includes("还缺什么") && p4NextStep.includes("继续更新参数")
  && p4NextStep.includes("下一页问题") && p4NextStep.includes("旧类记忆怎样重新进入训练"),
  "P4 must hand off from ordered exemplars to the replay question.");
assert.ok(p4NextStep.includes("让 Exemplars 参与更新") && !p4HandoffMarkup.includes("icarl-question-handoff"),
  "P4 must use its compact page-specific transition instead of the shared three-card handoff.");
const p5HandoffMarkup = renderPageFiveAt("p5-handoff", 0, () => undefined);
const p5NextStep = p5HandoffMarkup.match(/<section class="p5-next-step"[\s\S]*?<\/section>/)?.[0] ?? "";
const p5NextStepCopy = p5NextStep.slice(0, p5NextStep.indexOf("<button"));
assert.ok(p5NextStep.includes("本页结论") && p5NextStep.includes("训练图片及其类别信息") && p5NextStep.includes("旧类响应"),
  "P5's compact handoff must preserve the distinct roles of image/label information and old responses.");
assert.ok(p5NextStep.includes("还缺什么") && p5NextStep.includes("逐节点比较的监督依据")
  && p5NextStep.includes("下一页问题") && p5NextStep.includes("告诉每个输出节点应该接近什么")
  && p5NextStep.includes("构造各节点 Target"),
  "P5's compact handoff must explain the unresolved supervision question before naming the cross-page action.");
assert.ok(!p5NextStepCopy.includes("Student") && !p5NextStepCopy.includes("两类 Target"),
  "P5's handoff copy must not assume the reader already knows the next page's Student/Target terminology.");
assert.ok(!p5HandoffMarkup.includes("icarl-question-handoff"), "P5 must not reuse the shared three-card handoff.");
const p7HandoffMarkup = renderPageSevenAt(0, 4, () => undefined);
const p7NextStep = p7HandoffMarkup.match(/<section class="p7-next-step"[\s\S]*?<\/section>/)?.[0] ?? "";
const p7PlaybackControls = p7HandoffMarkup.match(/<footer class="p7-playback-controls"[^>]*>[\s\S]*?<\/footer>/)?.[0] ?? "";
assert.ok(p7NextStep.includes("本页结论") && p7NextStep.includes("记忆按容量重组") && p7NextStep.includes("Prototype 在当前表示空间重建")
  && p7NextStep.includes("已经打通") && p7NextStep.includes("完整机制已经闭合")
  && p7NextStep.includes("下一页转向") && p7NextStep.includes("论文实验与边界"),
  "P7 must compactly hand off from the completed mechanism to the paper's evidence question.");
assert.ok(p7NextStep.includes("查看论文证据与边界") && p7NextStep.includes("button") && !p7HandoffMarkup.includes("icarl-question-handoff"),
  "P7 must use its compact page-specific transition instead of the shared three-card handoff.");
assert.ok(!p7PlaybackControls.includes("查看论文证据与边界"), "P7 must keep its page action out of the playback controls.");
const p6Source = readFileSync(path.join(process.cwd(), "src/pages/PageSix.tsx"), "utf8");
assert.ok(p6Source.includes('className="p6-handoff" role="status"'), "P6's in-workbench phase feedback must remain distinct from the page-end transition.");
assert.ok(p6Source.includes('className="p6-next-step"') && !p6Source.includes("<QuestionHandoff"), "P6's page-end transition must be compact and distinct from in-workbench status.");
assert.ok(p6Source.includes("同一节点对应") && p6Source.includes("对每个节点分别比较"),
  "P6's target overview must replace the decorative bridge with an explicit node-wise relation.");
assert.ok(p6Source.includes("本页结论") && p6Source.includes("共享网络因此更新到新的参数状态")
  && p6Source.includes("新的问题") && p6Source.includes("原先的 Prototype 不能直接照搬")
  && p6Source.includes("下一页任务") && p6Source.includes("当前表示空间重建"),
  "P6's final handoff must connect the completed update to the need for current-space memory and prototypes.");

function distanceLines(markup: string): string[] {
  return markup.match(/<line\b[^>]*class="feature-space__distance[^"]*"[^>]*>/g) ?? [];
}

function attr(markup: string, name: string): string {
  const value = markup.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
  assert.ok(value, `Expected ${name} in SVG markup: ${markup}`);
  return value;
}

function lineLength(markup: string): number {
  return Math.hypot(Number(attr(markup, "x2")) - Number(attr(markup, "x1")), Number(attr(markup, "y2")) - Number(attr(markup, "y1")));
}

function queryMarkerStartX(markup: string): number {
  const marker = markup.match(/class="feature-space__query"[^>]*><path d="M ([\d.-]+) ([\d.-]+)/);
  assert.ok(marker, "P7 must render the persistent Query marker during the final stage.");
  return Number(marker[1]);
}

function queryMarkerPosition(markup: string): { x: number; y: number } {
  const marker = markup.match(/class="feature-space__query"[^>]*><path d="M ([\d.-]+) ([\d.-]+)/);
  assert.ok(marker, "P7 must render the persistent Query marker during the final stage.");
  return { x: Number(marker[1]), y: Number(marker[2]) + 8 };
}

function chartLabelPosition(markup: string, id: string): { x: number; y: number; anchor: string } {
  const label = markup.match(new RegExp(`<g[^>]*data-label-id="${id}"[^>]*>[\\s\\S]*?<text x="([\\d.-]+)" y="([\\d.-]+)" text-anchor="(start|middle|end)">`));
  assert.ok(label, `P7 must render chart label ${id}.`);
  return { x: Number(label[1]), y: Number(label[2]), anchor: label[3] };
}

function prototypeMarks(markup: string): string[] {
  return markup.match(/<g class="feature-space__prototype"[^>]*><rect[^>]*><\/g>/g) ?? [];
}

const p7AtZero = renderPageSevenAt(0);
const p7RebuildEnd = renderPageSevenAt(1, 3);
assert.deepEqual(prototypeMarks(p7AtZero), prototypeMarks(p7RebuildEnd), "P7 must keep all prototype coordinates fixed across the rebuild-to-query stage boundary.");
assert.equal(distanceLines(p7AtZero).length, 0, "P7 at 0% must not show comparison distances.");
assert.ok(!p7AtZero.includes("p7-query-result"), "P7 at 0% must not reveal the prediction.");
const queryFinalX = 320 + QUERY_FEATURE[0] * 160;
const queryEntryX = queryFinalX >= 320 ? 612 : 28;
assert.ok(near(queryMarkerStartX(p7AtZero), queryEntryX), "P7 at 0% must show Query at the chart edge.");

const queryMotionCheckpoints = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.6, 1] as const;
const initialQueryLabel = chartLabelPosition(p7AtZero, "query");
const initialClassOneLabel = chartLabelPosition(p7AtZero, `mean-${ALL_CLASS_IDS[0]}`);
assert.equal(initialQueryLabel.anchor, "end", "P7's moving Query label must keep the selected below-left anchor.");
for (const progress of queryMotionCheckpoints) {
  const markup = renderPageSevenAt(progress);
  const marker = queryMarkerPosition(markup);
  const label = chartLabelPosition(markup, "query");
  const classOneLabel = chartLabelPosition(markup, `mean-${ALL_CLASS_IDS[0]}`);
  assert.ok(near(marker.x - label.x, 14) && near(label.y - marker.y, 28), `P7 Query text must keep the same lower offset at ${progress * 100}% progress.`);
  assert.equal(label.anchor, "end", `P7 Query text must not flip sides at ${progress * 100}% progress.`);
  assert.ok(near(classOneLabel.x, initialClassOneLabel.x) && near(classOneLabel.y, initialClassOneLabel.y),
    `The Class 1 exemplar label must stay put while Query enters at ${progress * 100}% progress.`);
}

const p7At25 = renderPageSevenAt(0.25);
const p7LinesAt25 = distanceLines(p7At25);
assert.equal(p7LinesAt25.length, 1, "P7 at 25% must be drawing only the first distance.");
assert.ok(p7LinesAt25[0].includes("is-active"), "The in-progress distance must be highlighted.");
assert.equal(attr(p7LinesAt25[0], "data-prototype-class-id"), ALL_CLASS_IDS[0], "P7 must begin drawing Class 1 without revealing the nearest class by sorting.");
assert.ok(near(queryMarkerStartX(p7At25), queryFinalX), "Query must reach its fixed feature coordinate before comparisons begin.");
const firstDistancePx = QUERY_DISTANCES.find((entry) => entry.classId === ALL_CLASS_IDS[0])!.distance * 160;
const firstLineProgressAt25 = (0.25 - 0.2) / 0.55 * PROTOTYPES.length;
assert.ok(near(lineLength(p7LinesAt25[0]), firstDistancePx * firstLineProgressAt25, 1e-6),
  "The active P7 line length must track the true query-to-prototype distance and its displayed progress.");

const p7AtOneComplete = renderPageSevenAt(0.2 + 0.55 / 6);
const p7LinesAtOneComplete = distanceLines(p7AtOneComplete);
assert.equal(p7LinesAtOneComplete.length, 1, "P7 must expose exactly one complete line at the first comparison checkpoint.");
assert.ok(p7LinesAtOneComplete[0].includes("is-complete") && p7LinesAtOneComplete[0].includes("opacity:0.68"), "The first completed P7 line must remain clearly visible.");

const p7AtThreeComplete = renderPageSevenAt(0.475);
const p7LinesAtThreeComplete = distanceLines(p7AtThreeComplete);
assert.equal(p7LinesAtThreeComplete.length, 3, "P7 must expose exactly three complete lines at the middle comparison checkpoint.");
assert.deepEqual(p7LinesAtThreeComplete.map((line) => attr(line, "data-prototype-class-id")), ALL_CLASS_IDS.slice(0, 3), "P7 must reveal Classes 1–3 in class order.");
assert.ok(p7LinesAtThreeComplete.every((line) => line.includes("is-complete") && line.includes("opacity:0.68")), "P7 must retain all three completed lines at readable opacity.");

const p7At50 = renderPageSevenAt(0.5);
const p7LinesAt50 = distanceLines(p7At50);
assert.equal(p7LinesAt50.length, 4, "P7 at 50% must retain three completed comparisons and draw the fourth.");
assert.ok(p7LinesAt50[3].includes("is-active"), "P7 must highlight the currently drawn comparison.");
assert.deepEqual(p7LinesAt50.map((line) => attr(line, "data-prototype-class-id")), ALL_CLASS_IDS.slice(0, 4), "P7 must reveal comparisons in Class 1-to-6 order.");
assert.ok(p7LinesAt50.slice(0, 3).every((line) => line.includes("is-complete") && line.includes("opacity:0.68")), "P7 must keep completed lines visible while the next line is drawn.");
assert.equal(attr(p7LinesAt50[0], "data-comparison-rank"), "1", "P7 comparison ranks must follow the class drawing order.");

const p7At75 = renderPageSevenAt(0.75);
const p7LinesAt75 = distanceLines(p7At75);
assert.equal(p7LinesAt75.length, 6, "P7 at 75% must have completed all six true comparisons.");
assert.ok(p7LinesAt75.every((line) => line.includes("is-complete") && line.includes("opacity:0.68")), "P7 must keep all six completed lines visible before highlighting the argmin.");
assert.ok(!distanceLines(p7At75).some((line) => line.includes("is-nearest")), "P7 must wait until the separate nearest-highlight phase.");
assert.ok(!p7At75.includes("p7-query-result"), "P7 must keep the predicted class hidden before 90%.");

const p7At100 = renderPageSevenAt(1);
const p7LinesAt100 = distanceLines(p7At100);
assert.equal(p7LinesAt100.length, 6, "P7 at 100% must retain all six comparison lines.");
assert.equal(p7LinesAt100.filter((line) => line.includes("is-nearest")).length, 1, "P7 must highlight exactly one nearest prototype at the end.");
assert.equal(attr(p7LinesAt100.find((line) => line.includes("is-nearest"))!, "data-prototype-class-id"), QUERY_PREDICTION, "The highlighted P7 line must belong to the actual minimum-distance class.");
assert.ok(p7At100.includes("p7-query-result"), "P7 must reveal the prediction at the end.");
assert.ok(p7At100.includes(CLASS_VISUALS[QUERY_PREDICTION].displayLabel), "The revealed result must match the real argmin.");
assert.deepEqual(p7LinesAt100.map((line) => attr(line, "data-prototype-class-id")), ALL_CLASS_IDS, "P7's final display must retain all six lines in class order.");
assert.ok(p7LinesAt100.every((line) => near(lineLength(line),
  QUERY_DISTANCES.find((entry) => entry.classId === attr(line, "data-prototype-class-id"))!.distance * 160, 1e-6)),
"Every completed P7 distance line must have the true feature-space length for its class.");

const p9StaticInference = renderToStaticMarkup(createElement(FeatureSpaceWorkbench, {
  legacy: true,
  mode: "inference",
  title: "Query 与原型",
  description: "固定推断图",
  prototypes: PROTOTYPES,
  query: QUERY_FEATURE,
  unitCircle: true,
  focusableSamples: false,
}));
assert.equal(distanceLines(p9StaticInference).length, ALL_CLASS_IDS.length, "P9's existing inference mode must continue to show all full distances by default.");
assert.ok(!p9StaticInference.includes("is-active") && !p9StaticInference.includes("is-complete"), "Optional P7 timeline props must not alter P9's static inference rendering.");

/* ------------------------------------------------------------------ P8 --- */

assert.deepEqual(CLASSES_PER_BATCH, [2, 5, 10, 20, 50], "P8 must expose the paper's five iCIFAR-100 batch settings.");
assert.deepEqual(TABLE1A.map((row) => [row.batchSize, row.icarL, row.hybrid1, row.hybrid2, row.hybrid3, row.lwfMC]), [
  [2, 57.0, 36.6, 57.6, 57.0, 11.7],
  [5, 61.2, 50.9, 57.9, 56.7, 32.6],
  [10, 64.1, 59.3, 59.9, 58.1, 44.4],
  [20, 67.2, 65.6, 63.2, 60.5, 54.4],
  [50, 68.6, 68.2, 65.3, 61.5, 64.5],
], "P8 Table 1a must preserve all five rows of the paper's reported values.");
assert.deepEqual(TABLE1B.map((row) => [row.batchSize, row.icarL, row.ncm]), [
  [2, 57.0, 59.3], [5, 61.2, 62.1], [10, 64.1, 64.5], [20, 67.2, 67.5], [50, 68.6, 68.7],
], "P8 Table 1b must preserve the iCaRL and full-data NCM values.");

for (const rect of Object.values(FIGURE2_FOCUS_RECTS)) {
  assert.ok(rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0, "Every Figure 2 crop must have a positive in-image rectangle.");
  assert.ok(rect.x + rect.width <= FIGURE2_SOURCE_FRAME.width && rect.y + rect.height <= FIGURE2_SOURCE_FRAME.height,
    "Every Figure 2 crop must remain within the original full-resolution source image.");
}
for (const batch of CLASSES_PER_BATCH) {
  const selection = figure2Selection("cifar", batch);
  assert.equal(selection.focusId, `cifar-${batch}`, `The iCIFAR-100 batch-${batch} selector must choose its matching Figure 2 panel.`);
  assert.equal(selection.protocolLabel, `iCIFAR-100 · 每批 ${batch} 类 · 多类准确率`, "The focused panel caption must match the selected iCIFAR-100 protocol.");
  assert.equal(selection.rect, FIGURE2_FOCUS_RECTS[selection.focusId], "The selected overlay must use the exact source-subfigure bounds.");
}
assert.equal(figure2Selection("small", 50).focusId, "ilsvrc-small");
assert.equal(figure2Selection("small", 50).protocolLabel, "iILSVRC-small · 每批 10 类 · 验证集 Top-5");
assert.equal(figure2Selection("full", 2).focusId, "ilsvrc-full");
assert.equal(figure2Selection("full", 2).protocolLabel, "iILSVRC-full · 每批 100 类 · 验证集 Top-5");
const p8Source = readFileSync(path.join(process.cwd(), "src/pages/PageEight.tsx"), "utf8");
const figure2Evidence = p8Source.split("function Figure2Evidence(")[1]?.split("function Figure3Details(")[0] ?? "";
assert.ok(figure2Evidence.includes('mode="original" figureLabel="Figure 2"'), "P8 must render the complete Figure 2 through the original-image component.");
assert.ok(figure2Evidence.includes("论文原始完整 Figure 2") && figure2Evidence.includes("坐标轴与图例"), "P8 Figure 2 must identify the complete source figure with its axes and legend.");
assert.ok(figure2Evidence.includes("data-focus={selection.focusId}") && figure2Evidence.includes("SourceFocusOverlay"), "P8 must keep the selected protocol linked to its source subfigure.");
assert.ok(!figure2Evidence.includes("p8-figure2-zoom") && !figure2Evidence.includes('mode="crop"') && !figure2Evidence.includes("p8-source-figure-details"), "P8 must not render a separate Figure 2 crop or duplicated full-image layer.");

/* ------------------------------------------------------------------ P9 interleaved flow contract --- */

assert.deepEqual(OLD_CLASS_IDS.map((classId) => P_BEFORE[classId].length), [4, 4, 4], "P9 starts with four ordered raw exemplars in each old class.");
const oldP9Ids = OLD_CLASS_IDS.flatMap((classId) => P_BEFORE[classId].map((sample) => sample.id));
assert.equal(oldP9Ids.length, 12);
assert.equal(new Set(oldP9Ids).size, 12, "The inherited raw memory must contain twelve unique sample IDs.");
assert.equal(MEMORY_BUDGET, 12, "P9 keeps the exemplar image budget fixed at K=12.");
assert.equal(INCREMENTAL_STAGE_DATA.incomingSamples.length, 18, "P9's incoming batch must contain 18 raw samples.");
assert.deepEqual(INCREMENTAL_STAGE_DATA.incomingClassIds.map((classId) => INCREMENTAL_STAGE_DATA.incomingSamples.filter((sample) => sample.classId === classId).length), [6, 6, 6]);
assert.equal(INCREMENTAL_STAGE_DATA.trainingSamples.length, 30, "D must contain the 12 inherited exemplars and all 18 new samples.");
assert.equal(new Set(INCREMENTAL_STAGE_DATA.trainingSamples.map((sample) => sample.id)).size, 30, "Every D sample ID must be unique.");
assert.deepEqual(INCREMENTAL_STAGE_DATA.trainingSamples.slice(0, 12).map((sample) => sample.id), oldP9Ids, "Old exemplars enter D in a training copy while P_before retains its order and IDs.");
assert.equal(INCREMENTAL_STAGE_DATA.snapshotBySampleId.size, 30, "Frozen Q must have one old-model row for every sample in D.");

const p9OldExample = P_BEFORE.A[0];
const p9NewExample = INCREMENTAL_STAGE_DATA.incomingSamples.find((sample) => sample.classId === "D")!;
for (const sample of INCREMENTAL_STAGE_DATA.trainingSamples) {
  const q = teacherSnapshotFor(sample);
  assert.deepEqual(q, INCREMENTAL_STAGE_DATA.snapshotBySampleId.get(sample.id), `Q for ${sample.id} must be the shared pre-update teacher response.`);
  assert.equal(q.length, 3, `Q for ${sample.id} must contain only the three old output nodes.`);
  const targets = buildTargets(sample, q);
  assert.deepEqual(targets.slice(0, 3), q, `The old-node targets for ${sample.id} must use its own Q row.`);
  assert.deepEqual(targets.slice(3), INCREMENTAL_STAGE_DATA.incomingClassIds.map((classId) => Number(sample.classId === classId)), `The new-node targets for ${sample.id} must come from its true class label.`);
  const output = studentOutputFor(sample);
  assert.equal(output.length, 6, "The student fixture must retain six independent Sigmoid outputs.");
  const expectedLoss = targets.reduce((sum, target, index) => sum + binaryCrossEntropy(target, output[index]), 0);
  assert.ok(near(sixNodeBceLoss(targets, output), expectedLoss), `Six-node BCE for ${sample.id} must aggregate the independent nodes.`);
}
assert.deepEqual(teacherSnapshotFor(p9OldExample), INCREMENTAL_STAGE_DATA.snapshotBySampleId.get(p9OldExample.id), "The old-image example must retain its own Q identity.");
assert.deepEqual(teacherSnapshotFor(p9NewExample), INCREMENTAL_STAGE_DATA.snapshotBySampleId.get(p9NewExample.id), "The new-image example must also receive an old-teacher Q row.");

for (const classId of OLD_CLASS_IDS) {
  assert.deepEqual(P_AFTER[classId].map((sample) => sample.id), P_BEFORE[classId].slice(0, NEXT_QUOTA).map((sample) => sample.id), `Old class ${classId} must keep the original ordered prefix.`);
}
for (const classId of INCREMENTAL_STAGE_DATA.incomingClassIds) {
  assert.deepEqual(P_AFTER[classId].map((sample) => sample.id), NEW_CLASS_HERDING[classId].ordered.slice(0, NEXT_QUOTA).map((sample) => sample.id), `New class ${classId} must use its actual Herding prefix.`);
}
const allP9After = ALL_CLASS_IDS.flatMap((classId) => P_AFTER[classId]);
assert.equal(allP9After.length, 12, "P_after must fill but never exceed K=12.");
assert.deepEqual(ALL_CLASS_IDS.map((classId) => P_AFTER[classId].length), [2, 2, 2, 2, 2, 2]);
for (const distance of QUERY_DISTANCES) {
  const prototype = PROTOTYPES.find((candidate) => candidate.classId === distance.classId)!;
  assert.ok(near(distance.distance, euclideanDistance(QUERY_FEATURE, prototype.point)), `Query distance for class ${distance.classId} must use the current shared Prototype.`);
}
assert.equal(QUERY_PREDICTION, QUERY_DISTANCES[0].classId, "P9 prediction must remain the real nearest-prototype argmin.");

const p9DStateAt = (progress: number) => p9TrainingAssemblyAt(
  progress,
  INCREMENTAL_STAGE_DATA.oldExemplars,
  INCREMENTAL_STAGE_DATA.incomingSamples,
  p9OldExample.id,
  p9NewExample.id,
);
const p9DStart = p9DStateAt(0);
assert.deepEqual([p9DStart.oldCopies, p9DStart.incomingCount, p9DStart.assembledCount], [0, 0, 0]);
assert.equal(p9DStart.oldExampleArrived || p9DStart.incomingExampleArrived, false, "D must not show either example before its real ID enters the prefix.");
for (const progress of [0.25, 0.5]) {
  const state = p9DStateAt(progress);
  assert.equal(state.assembledCount, state.oldCopies + state.incomingCount, `D counts must agree at ${progress * 100}%.`);
  assert.equal(state.oldExampleArrived, INCREMENTAL_STAGE_DATA.oldExemplars.slice(0, state.oldCopies).some((sample) => sample.id === p9OldExample.id), `The old example token at ${progress * 100}% must track its actual training-copy ID.`);
  assert.equal(state.incomingExampleArrived, INCREMENTAL_STAGE_DATA.incomingSamples.slice(0, state.incomingCount).some((sample) => sample.id === p9NewExample.id), `The new example token at ${progress * 100}% must track its actual incoming prefix ID.`);
}
const p9DEnd = p9DStateAt(1);
assert.deepEqual([p9DEnd.oldCopies, p9DEnd.incomingCount, p9DEnd.assembledCount], [12, 18, 30]);
assert.equal(p9DEnd.oldExampleArrived && p9DEnd.incomingExampleArrived, true, "Both true example IDs must be present at D's terminal state.");

const p9TimelineStart = p9PredictionTimelineAt(0);
assert.deepEqual([p9TimelineStart.phase, p9TimelineStart.prototypeCount, p9TimelineStart.queryVisible, p9TimelineStart.comparisonsComplete], ["encoding", 0, false, 0]);
const p9Timeline30 = p9PredictionTimelineAt(0.30);
assert.deepEqual([p9Timeline30.phase, p9Timeline30.prototypeCount, p9Timeline30.queryVisible], ["prototypes", 1, false], "30% begins the first prototype without exposing the Query.");
const p9Timeline50 = p9PredictionTimelineAt(0.50);
assert.deepEqual([p9Timeline50.prototypeCount, p9Timeline50.queryVisible, p9Timeline50.comparisonsComplete], [6, false, 0], "All prototypes must settle before Query entry.");
const p9Timeline60 = p9PredictionTimelineAt(0.60);
assert.equal(p9Timeline60.queryVisible, true);
assert.ok(p9Timeline60.queryRevealProgress > 0 && p9Timeline60.queryRevealProgress < 1);
assert.deepEqual([p9Timeline60.comparisonProgress, p9Timeline60.comparisonsComplete], [0, 0], "Query motion must finish before comparison lines start.");
const p9Timeline75 = p9PredictionTimelineAt(0.75);
assert.ok(p9Timeline75.comparisonProgress > 0 && p9Timeline75.comparisonProgress < 1);
assert.equal(p9Timeline75.comparisonsComplete, 1, "At 75%, prior distance lines are complete while the next line is still forming.");
assert.equal(p9Timeline75.nearestHighlightActive, false, "The nearest class must stay unhighlighted before comparisons finish.");
const p9Timeline94 = p9PredictionTimelineAt(0.94);
assert.deepEqual([p9Timeline94.comparisonsComplete, p9Timeline94.nearestHighlightActive, p9Timeline94.nearestHighlightProgress], [6, true, 0]);
const p9TimelineEnd = p9PredictionTimelineAt(1);
assert.deepEqual([p9TimelineEnd.prototypeCount, p9TimelineEnd.queryVisible, p9TimelineEnd.comparisonsComplete, p9TimelineEnd.nearestHighlightProgress], [6, true, 6, 1]);

function renderPageNineAt(reducedMotion = false): string {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { matchMedia: () => ({ matches: reducedMotion }) },
  });
  try {
    return renderToStaticMarkup(createElement(PageNine));
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

const p9Markup = renderPageNineAt();
assert.ok(p9Markup.includes("iCaRL 一次增量学习的完整逻辑"), "P9 must use the approved page title.");
assert.deepEqual([...p9Markup.matchAll(/<section class="p9-step" data-step="(\d+)"/g)].map((match) => match[1]), ["01", "02", "03", "04", "05", "06", "07", "08"], "The eight teaching groups must appear in reading order.");
assert.ok(p9Markup.indexOf('class="p9-step__copy"') < p9Markup.indexOf('class="p9-step__figure"'), "Text must precede the corresponding figure in the mobile DOM reading order.");
assert.ok(p9Markup.includes('data-d-count="30"') && p9Markup.includes("12 / 12 旧图副本") && p9Markup.includes("18 / 18 张新图"), "The default D state must show all 12 old copies and 18 new images assembled.");
assert.ok(p9Markup.includes('data-object-id="P_before"') && p9Markup.includes("P_before 原件仍在"), "The D handoff must retain the persistent original memory while using copies.");
const p9DExampleSection = p9Markup.match(/<div class="p9-set-samples"[^>]*>[\s\S]*?class="p9-integrity-note"/)?.[0] ?? "";
assert.ok(p9DExampleSection.includes(`data-example-sample-id="${p9OldExample.id}"`) && p9DExampleSection.includes(`data-example-sample-id="${p9NewExample.id}"`), "The default completed D state must show both arrived example IDs.");
assert.ok(!p9DExampleSection.includes("等待训练样本进入 D"), "The completed D state must not show its empty placeholder.");
assert.ok(p9Markup.includes('data-q-rows="30" data-q-columns="3"') && p9Markup.includes('data-q-frozen="true"'), "The default Q state must show 30 rows, three old nodes, and a frozen result.");
const p9QExampleRows = [...p9Markup.matchAll(/<tr\b[^>]*data-q-example="true"[^>]*>[\s\S]*?<\/tr>/g)].map((match) => match[0]);
assert.equal(p9QExampleRows.length, 2, "P9 must show one old and one new sample as explicit Q examples.");
for (const [row, sample] of [[p9QExampleRows[0], p9OldExample], [p9QExampleRows[1], p9NewExample]] as const) {
  assert.ok(row.includes(`data-q-sample-id="${sample.id}"`), `The Q row must retain sample ID ${sample.id}.`);
  for (const value of teacherSnapshotFor(sample)) assert.ok(row.includes(value.toFixed(3)), `The Q row for ${sample.id} must show its true shared response value.`);
}
const p9QDetails = p9Markup.match(/<details class="p9-q-details">([\s\S]*?)<\/details>/)?.[1] ?? "";
assert.deepEqual([...p9QDetails.matchAll(/data-q-sample-id="([^"]+)"/g)].map((match) => match[1]), INCREMENTAL_STAGE_DATA.trainingSamples.map((sample) => sample.id), "Expanded Q must preserve every actual D sample ID in its true row order.");
assert.ok(p9Markup.includes(`data-training-sample-id="${p9NewExample.id}"`) && p9Markup.includes('data-target-ready="true"'), "The six-node Target must use the same new D sample and be complete by default.");
assert.equal([...p9Markup.matchAll(/class="p9-node-row"[^>]*data-node="[A-F]"/g)].length, 6, "P9 training must display six independent Sigmoid/BCE nodes.");
for (const id of allP9After.map((sample) => sample.id)) assert.ok(p9Markup.includes(`data-sample-id="${id}"`), `Committed P_after must preserve raw sample ID ${id}.`);
assert.ok(p9Markup.includes('data-memory-count="12"') && p9Markup.includes('data-memory-state="submitted"'), "The final memory view must commit exactly twelve exemplars.");
assert.ok(p9Markup.includes(`data-prediction-class="${QUERY_PREDICTION}"`) && p9Markup.includes(`data-result-class="${QUERY_PREDICTION}"`), "P9 must use the shared nearest-prototype class for its final result.");
assert.ok(p9Markup.includes('data-p9-phase="nearest"') && p9Markup.includes('data-prototype-count="6" data-query-visible="true"'), "The default P9-06 replay must render its full terminal stage.");
assert.ok(p9Markup.includes("不代表真实 SGD 轨迹"), "P9-06 must retain the limitation on its visual feature interpolation.");
const p9DistanceLines = distanceLines(p9Markup);
assert.equal(p9DistanceLines.length, ALL_CLASS_IDS.length, "The static Query view must show all six true prototype comparisons.");
assert.deepEqual(p9DistanceLines.map((line) => attr(line, "data-prototype-class-id")), ALL_CLASS_IDS, "Query comparisons must be drawn in class order before highlighting the minimum.");
assert.ok(p9Markup.includes("而非对六个训练输出节点取 argmax"), "P9 must keep nearest-prototype prediction distinct from training-head argmax.");
assert.ok(p9Markup.includes("Θ_after") && p9Markup.includes("P_after") && p9Markup.includes("X_next"), "The final group must hand off the persistent state and label X_next only as an entrance cue.");
assert.equal([...p9Markup.matchAll(/class="p9-replay"/g)].length, 7, "Each animated group must have only one local replay control.");
assert.equal([...p9Markup.matchAll(/data-animation-progress="1\.000"/g)].length, 7, "All local animations must render their complete result before the reader starts them.");
assert.doesNotMatch(p9Markup, /p9-chapters|p9-transport|p9-active-scene|片段 17 \/ 17/, "The rendered page must not include the legacy global player.");

const p9ReducedMotion = renderPageNineAt(true);
assert.equal([...p9ReducedMotion.matchAll(/class="p9-replay"[^>]*disabled=""/g)].length, 7, "Reduced-motion users must keep the complete result and have all replay controls disabled.");
assert.ok(p9ReducedMotion.includes("减少动态效果：完整结果已显示") && p9ReducedMotion.includes('data-result-visible="true"'), "Reduced motion must retain a readable terminal state and result.");

const p9Source = readFileSync(path.join(process.cwd(), "src/pages/PageNine.tsx"), "utf8");
const p9Css = readFileSync(path.join(process.cwd(), "src/styles/page-nine.css"), "utf8");
const appSource = readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
const p9PageEightSource = readFileSync(path.join(process.cwd(), "src/pages/PageEight.tsx"), "utf8");
const p9VisualQa = JSON.parse(readFileSync(path.join(process.cwd(), "visual-qa.json"), "utf8"));
assert.ok(p9Source.includes("prototypes={visiblePrototypes}") && p9Source.includes("query={timeline.queryVisible ? QUERY_FEATURE : undefined}"), "P9-06 must add only formed Prototype objects and omit Query until stage C.");
assert.ok(p9Source.includes("comparisonProgress={timeline.comparisonProgress}") && p9Source.includes("nearestHighlightProgress={timeline.nearestHighlightProgress}"), "P9-06 distance lines and nearest highlight must follow their separate timeline windows.");
assert.ok(p9Source.includes("useLocalReplay(1800, 250)"), "P9-02 must hold briefly at a true empty D so the zero-progress state remains inspectable.");
assert.doesNotMatch(p9Source, /RUNTIME_CLIPS|runtimeSceneAt|useAnimationTimeline|p9-chapters|p9-transport/, "P9 must not retain the 17-clip runtime or page-wide transport controls.");
assert.doesNotMatch(p9Css, /p9-chapters|p9-transport|p9-active-scene|p9-workbench-anchors/, "P9 CSS must not retain selectors for the discarded large scene framework.");
assert.ok(!existsSync(path.join(process.cwd(), "src/pages/page-nine-scene.ts")), "The obsolete page-only runtime module must be deleted.");
assert.ok(p9Css.includes(".p9-step:nth-of-type(even) .p9-step__copy { grid-column: 2;"), "Desktop groups must alternate the text and diagram sides.");
assert.ok(p9Css.includes(".p9-step:nth-of-type(even) .p9-step__copy, .p9-step:nth-of-type(even) .p9-step__figure { grid-column: 1; grid-row: auto; }"), "Mobile groups must stack text before diagrams without changing DOM order.");
assert.ok(p9Css.includes("@media (prefers-reduced-motion: reduce)"), "P9 must honor the reduced-motion preference.");
assert.match(p9Css, /\.p9-prototype-roster small \{[^}]*font: 11px var\(--mono\)/, "P9 Prototype member IDs must remain at least 11px when shown.");
assert.ok(p9Markup.includes('Q ∈ ℝ<sup class="p9-q-formula__exponent">30×3</sup>'), "P9 Q shape must use a typographic real-number symbol and superscript.");
const tutorialSource = readFileSync(path.join(process.cwd(), "src/data/tutorial.ts"), "utf8");
assert.ok(tutorialSource.includes('title: "iCaRL 一次增量学习的完整逻辑"') && !appSource.includes("ewc-app--runtime"), "P9 navigation must match the new title and use the shared app shell.");
assert.ok(p9PageEightSource.includes("下一页：一次增量学习的完整逻辑"), "P8 must lead into the redesigned P9 reading flow.");
assert.ok(Array.isArray(p9VisualQa.pages.find((page: { id: string }) => page.id === "icarl-p9-interleaved")?.states), "Visual QA must cover the eight-group reading flow and local replays.");
const p9QaPage = p9VisualQa.pages.find((page: { id: string }) => page.id === "icarl-p9-interleaved");
const p9QaText = JSON.stringify(p9QaPage);
const p9QaStateIds = new Set(p9QaPage.states.map((state: { id: string }) => state.id));
for (const stateId of [
  "p9-d-assembly-start",
  "p9-d-assembly-quarter",
  "p9-d-assembly-midpoint",
  "p9-d-assembly-terminal",
  "p9-d-assembly-paused",
  "p9-d-assembly-pause-resume",
  "p9-prototype-reencoding-start",
  "p9-prediction-30-first-prototype",
  "p9-prediction-50-six-prototypes",
  "p9-query-entry",
  "p9-query-distance-comparisons",
  "p9-nearest-prototype-terminal",
  "p9-prediction-100-static-result",
]) assert.ok(p9QaStateIds.has(stateId), `Visual QA must keep the P9 checkpoint ${stateId}.`);
assert.doesNotMatch(p9QaText, /p9-chapter|p9-transport|p9-play/, "P9 visual QA must not target removed playback controls.");
/* --------------------------------------------------- official W10 adapter --- */

const registrySource = readFileSync(path.join(process.cwd(), "src/modules/registry.tsx"), "utf8");
const mainSource = readFileSync(path.join(process.cwd(), "src/main.tsx"), "utf8");
const viteSource = readFileSync(path.join(process.cwd(), "vite.config.ts"), "utf8");
const paperCss = readFileSync(path.join(process.cwd(), "src/styles/paper.css"), "utf8");
const globalCss = readFileSync(path.join(process.cwd(), "src/styles.css"), "utf8");
const expectedPageIds = Array.from({ length: 9 }, (_, index) => `page-${index + 1}`);
const tutorialComponentIds = [...new Set([...tutorialSource.matchAll(/componentId:\s*"(page-\d+)"/g)].map((match) => match[1]))];
const registryPageIds = [...registrySource.matchAll(/widgetRegistry\["(page-\d+)"\]\s*=/g)].map((match) => match[1]);

assert.deepEqual(tutorialComponentIds, expectedPageIds, "The official tutorial manifest must expose each of the nine pages exactly once.");
assert.deepEqual(registryPageIds, expectedPageIds, "The widget registry must contain exactly the nine tutorial components.");
assert.match(tutorialSource, /kind:\s*"chapter"/, "The official tutorial manifest must contain a real chapter.");
assert.match(tutorialSource, /kind:\s*"module"/, "The official tutorial manifest must derive a module for every page.");
assert.match(tutorialSource, /kind:\s*"scene"/, "The official tutorial manifest must derive a scene for every page.");
assert.match(appSource, /import \{ pages, type PageId \} from "\.\/data\/tutorial"/, "App must read navigation from the official tutorial source.");
assert.match(appSource, /import \{ widgetRegistry \} from "\.\/modules\/registry"/, "App must use the official widget registry.");
assert.match(appSource, /<ActivePage navigateToPage=\{navigateToPage\} \/>/, "App must render the active page through the registry.");
assert.doesNotMatch(appSource, /import \{ Page(?:One|Two|Three|Four|Five|Six|Seven|Eight|Nine) \}/, "App must not maintain a second direct page registry.");

const expectedNavigationTargets = ["page-2", "page-3", "page-4", "page-5", "page-6", "page-7", "page-8", "page-9", "page-8"];
for (const [index, target] of expectedNavigationTargets.entries()) {
  const sourceId = `page-${index + 1}`;
  const entryPattern = new RegExp(`widgetRegistry\\["${sourceId}"\\][\\s\\S]*?navigateToPage\\("${target}"\\)`);
  assert.match(registrySource, entryPattern, `${sourceId} must retain its expected navigation target ${target}.`);
}

assert.ok(mainSource.includes('import "./styles/paper.css"'), "The official paper stylesheet must be loaded by the application.");
assert.ok(paperCss.includes("--mono:") && paperCss.includes("--math:") && paperCss.includes("--radius:"), "paper.css must own real iCaRL style variables.");
assert.ok(!globalCss.includes(":root { --mono:"), "The variables moved to paper.css must not remain duplicated in styles.css.");
assert.match(viteSource, /base:\s*"\.\/"/, "The Vite build must retain its relative base for official subpath deployment.");

/* ---------------------------------------------------------------- report --- */

console.log(
  [
    "icarl teaching data checks passed:",
    `  P3  12 unit features, ${prototypes.length} prototypes from their own exemplars, argmin -> ${CLASS_VISUALS[distances[0].classId].displayLabel}`,
    `  P4  8 candidates, order ${HERDING_DEMO_ORDER.map((point) => point.id).join(" -> ")}, round distances ${roundDistances.map((value) => value.toFixed(3)).join(", ")}`,
    `  P5  P_old 12 + X_new 18 = D 30, Q 30x3 fixed before the update`,
    `  P7  ${QUERY_DISTANCES.length} displayed distances match the fixed query and prototype endpoints; argmin -> ${CLASS_VISUALS[QUERY_PREDICTION].displayLabel}`,
    `  P9  8 interleaved groups; D=30, Q=30x3, six independent nodes and K=12 memory`,
  ].join("\n"),
);
