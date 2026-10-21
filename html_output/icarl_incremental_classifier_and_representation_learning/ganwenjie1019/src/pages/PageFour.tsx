import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChartLabels, FEATURE_FRAME, featureStar, type ChartLabel } from "../components/FeatureChart";
import {
  HERDING_DEMO_ORDER,
  HERDING_DEMO_POINTS,
  HERDING_DEMO_QUOTA,
  HERDING_DEMO_ROUNDS,
  HERDING_DEMO_TARGET,
  HERDING_DEMO_TARGET_RAW,
  type HerdingDemoCandidate,
} from "../data/herding-teaching-demo";
import {
  HERDING_CHART,
  clockwiseOffsetFromTop,
  projectHerdingFeature,
} from "../data/herding-teaching-geometry";
import { budgetAt, reviewAt, type BudgetState, type PrefixReviewState } from "../data/herding-phase-state";
import {
  useAnimationTimeline,
  type AnimationClip,
} from "../shared/animation/useAnimationTimeline";
import {
  arcSegmentPath,
  clamp,
  progressWithin,
  smoothstep,
  type Point,
} from "../shared/animation/easing";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

/* ------------------------------------------------------------- geometry --- */

const VIEW = { width: HERDING_CHART.width, height: HERDING_CHART.height };
const CENTER: Point = HERDING_CHART.center;
const RADIUS = HERDING_CHART.radius;
const toChartPoint = projectHerdingFeature;
const TARGET_POINT = toChartPoint(HERDING_DEMO_TARGET);
const TARGET_RAW_POINT = toChartPoint(HERDING_DEMO_TARGET_RAW);
const TARGET_RADIAL_DIRECTION = { x: TARGET_POINT.x - CENTER.x, y: TARGET_POINT.y - CENTER.y };
const TARGET_RADIAL_LENGTH = Math.hypot(TARGET_RADIAL_DIRECTION.x, TARGET_RADIAL_DIRECTION.y) || 1;
const TARGET_LABEL_OUTSET = 34;
const TARGET_LABEL_OFFSET = {
  x: (TARGET_RADIAL_DIRECTION.x / TARGET_RADIAL_LENGTH) * TARGET_LABEL_OUTSET,
  y: (TARGET_RADIAL_DIRECTION.y / TARGET_RADIAL_LENGTH) * TARGET_LABEL_OUTSET,
};
const SCAN_START_ID = "a8";
const SCAN_START_POINT = HERDING_DEMO_POINTS.find((point) => point.id === SCAN_START_ID)!;
const SCAN_START_CHART_POINT = toChartPoint(SCAN_START_POINT.feature);
const SCAN_START_OFFSET_FROM_TOP = clockwiseOffsetFromTop(SCAN_START_CHART_POINT);
const SCAN_START_DEG = HERDING_CHART.topAngleDeg + SCAN_START_OFFSET_FROM_TOP;

function diamond(point: Point, radius = 7) {
  return `${point.x},${point.y - radius} ${point.x + radius},${point.y} ${point.x},${point.y + radius} ${point.x - radius},${point.y}`;
}

/** Scan order: clockwise from a8, crossing the 0/360 boundary smoothly. */
const SCAN_ORDER = [...HERDING_DEMO_POINTS]
  .map((point) => {
    const offsetFromTop = clockwiseOffsetFromTop(toChartPoint(point.feature));
    return { point, offset: (offsetFromTop - SCAN_START_OFFSET_FROM_TOP + 360) % 360 };
  })
  .sort((a, b) => a.offset - b.offset);
const SCAN_OFFSET_BY_ID = new Map(SCAN_ORDER.map((item) => [item.point.id, item.offset]));
const TOTAL_SWEEP = 360;
const SWEEP_STEP_MS = 360;

/* ----------------------------------------------------------------- clips --- */

type ClipKind = "target-contribute" | "target-normalize" | "target-normalize-fade" | "scan" | "hull" | "hover" | "split" | "gather" | "mean" | "score" | "score-fade" | "norm" | "commit" | "review" | "budget";

type DemoClip = AnimationClip & {
  kind: ClipKind;
  round: number;
  candidateIndex: number;
  /** Cumulative clockwise sweep (in candidate steps) at the start of this clip. */
  sweepStart: number;
  /** Sweep when the clip ends; it changes only in explicit scan and round-commit clips. */
  sweepEnd: number;
  /** Millisecond length of the movement part; the renderer derives sub-windows from it. */
  move: number;
};

const ROUNDS = HERDING_DEMO_ROUNDS;
/** P4 phase 05's dashed prefix links should draw at half their current speed. */
const ROUND_FOUR_HULL_DURATION_SCALE = 2;
const stepDurations: Record<string, number> = { hull: 700, hover: 500, split: 560, gather: 1100, mean: 620, score: 820, norm: 760, commit: 900 };

function buildClips(): DemoClip[] {
  const clips: DemoClip[] = [];
  const push = (clip: Omit<DemoClip, "id"> & { id: string }) => {
    clips.push(clip);
  };

  push({ id: "target-contribute", kind: "target-contribute", round: 0, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 1500, durationMs: 1500, holdMs: 650, narrative: "八个样本共同决定完整类别的原始均值" });
  push({ id: "target-normalize", kind: "target-normalize", round: 0, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 1300, durationMs: 1300, holdMs: 900, narrative: "原始均值单位化为比较目标 μ_full" });
  push({ id: "target-normalize-fade", kind: "target-normalize-fade", round: 0, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 450, durationMs: 450, holdMs: 250, narrative: "虚线停留后淡出，保留 μ_full 作为后续比较目标" });

  for (const round of ROUNDS) {
    const selectedBefore = new Set(round.prefix.slice(0, round.k - 1).map((point) => point.id));

    /** Walk the fixed geometry clockwise from a8, skipping entries already in the prefix. */
    const waypoints: { id: string; sweep: number; scored: boolean; candidateIndex: number }[] =
      SCAN_ORDER.map((entry) => ({
        id: entry.point.id,
        sweep: entry.offset / TOTAL_SWEEP,
        scored: !selectedBefore.has(entry.point.id),
        candidateIndex: round.candidates.findIndex((candidate) => candidate.point.id === entry.point.id),
      }));
    const scored = waypoints.filter((entry) => entry.scored);
    /** Milliseconds for a leg that covers `span` of the circle, proportional to the real arc. */
    const legDuration = (span: number) => Math.max(320, Math.round(SWEEP_STEP_MS * Math.max(span * (SCAN_ORDER.length - 1), 0.12)));

    let sweep = 0;
    for (const [order, candidate] of scored.entries()) {
      const sweepAt = candidate.sweep;
      const isFirst = order === 0;
      const legStart = sweep;
      const candidateIndex = candidate.candidateIndex;

      push({
        id: `r${round.k}-scan-${candidate.id}`,
        kind: "scan",
        round: round.k,
        candidateIndex,
        sweepStart: legStart,
        sweepEnd: sweepAt,
        move: round.k === 1 && isFirst ? 140 : legDuration(sweepAt - legStart),
        durationMs: round.k === 1 && isFirst ? 140 : legDuration(sweepAt - legStart),
        holdMs: round.k === 1 && isFirst ? 0 : isFirst ? 150 : 60,
        narrative: isFirst && round.k === 1
          ? "从扫描起点 a8 立即开始第一条真实距离比较"
          : isFirst
            ? `扫描环从候选 ${SCAN_START_ID} 出发，按顺时针顺序到达本轮第一个未选候选 ${candidate.id}`
            : `上一候选已完成均值与距离比较；扫描环再顺时针到达候选 ${candidate.id}`,
      });

      const rest = { round: round.k, candidateIndex, sweepStart: sweepAt };

      // The first candidate in each round gets the full teaching sequence. Later candidates keep
      // the same real endpoints and scores, but use a compact, continuous comparison.
      if (!isFirst) {
        if (round.k === 1) {
          push({ id: `r1-hover-${candidate.id}`, kind: "hover", ...rest, sweepEnd: sweepAt, move: 180, durationMs: 180, holdMs: 80, narrative: `ν₁(${candidate.id}) = z(${candidate.id})：不需要额外平均，直接比较它到 μ_full 的距离` });
          push({ id: `r1-score-${candidate.id}`, kind: "score", ...rest, sweepEnd: sweepAt, move: 420, durationMs: 420, holdMs: 500, narrative: `画出 ${candidate.id} 到 μ_full 的真实距离，并写入距离尺` });
          push({ id: `r1-score-fade-${candidate.id}`, kind: "score-fade", ...rest, sweepEnd: sweepAt, move: 520, durationMs: 520, holdMs: 0, narrative: "先清除刚完成的比较，再继续顺时针扫描" });
          sweep = sweepAt;
          continue;
        }

        const hullMs = 240;
        const gatherMs = 520;
        const normalizeMs = 420;
        const scoreMs = 420;
        push({ id: `r${round.k}-hull-${candidate.id}`, kind: "hull", ...rest, sweepEnd: sweepAt, move: hullMs, durationMs: hullMs, holdMs: 45, narrative: `固定本轮前缀，并连出参与候选 ${candidate.id} 的真实特征点` });
        push({ id: `r${round.k}-gather-${candidate.id}`, kind: "gather", ...rest, sweepEnd: sweepAt, move: gatherMs, durationMs: gatherMs, holdMs: 55, narrative: `${round.k} 个真实贡献点汇入本次前缀的算术均值` });
        push({ id: `r${round.k}-norm-${candidate.id}`, kind: "norm", ...rest, sweepEnd: sweepAt, move: normalizeMs, durationMs: normalizeMs, holdMs: 55, narrative: "将本次前缀均值单位化，再与 μ_full 比较" });
        push({ id: `r${round.k}-score-${candidate.id}`, kind: "score", ...rest, sweepEnd: sweepAt, move: scoreMs, durationMs: scoreMs, holdMs: 450, narrative: `${candidate.id} 的真实距离写入本轮距离尺` });
        push({ id: `r${round.k}-score-fade-${candidate.id}`, kind: "score-fade", ...rest, sweepEnd: sweepAt, move: 520, durationMs: 520, holdMs: 0, narrative: "清除距离线、均值标记与候选强调，再继续顺时针扫描" });
        sweep = sweepAt;
        continue;
      }

      if (round.k === 1) {
        // k = 1 has no prefix to average: show ν₁(a8) = z(a8) while its real distance grows.
        const firstDistanceMs = isFirst ? 760 : 420;
        push({
          id: `r1-score-${candidate.id}`,
          kind: "score",
          ...rest,
          sweepEnd: sweepAt,
          move: firstDistanceMs,
          durationMs: firstDistanceMs,
          holdMs: isFirst ? 650 : 500,
          narrative: isFirst
            ? `ν₁(${candidate.id}) = z(${candidate.id})：距离线立即延伸并同步记录真实分数`
            : `画出 ${candidate.id} 到 μ_full 的真实距离，并写入距离尺`,
        });
        push({ id: `r1-score-fade-${candidate.id}`, kind: "score-fade", ...rest, sweepEnd: sweepAt, move: 650, durationMs: 650, holdMs: 0, narrative: "距离线停留后淡出；完全消失后才移动到下一候选" });
        sweep = sweepAt;
        continue;
      }

      push({ id: `r${round.k}-hull-${candidate.id}`, kind: "hull", ...rest, sweepEnd: sweepAt, move: stepDurations.hull, durationMs: stepDurations.hull, holdMs: 100, narrative: `先固定已有前缀，用线段连接 ${round.k} 个参与平均的特征点` });
      push({ id: `r${round.k}-split-${candidate.id}`, kind: "split", ...rest, sweepEnd: sweepAt, move: stepDurations.split, durationMs: stepDurations.split, holdMs: 80, narrative: `每个端点复制一个贡献点；原始候选与前缀点保持原位` });
      push({ id: `r${round.k}-gather-${candidate.id}`, kind: "gather", ...rest, sweepEnd: sweepAt, move: stepDurations.gather, durationMs: stepDurations.gather, holdMs: 200, narrative: round.k === 2 ? "两个贡献点沿连线移动到真实中点" : `所有贡献点同时移动到 ${round.k} 个单位特征的真实算术均值` });
      push({ id: `r${round.k}-mean-${candidate.id}`, kind: "mean", ...rest, sweepEnd: sweepAt, move: stepDurations.mean, durationMs: stepDurations.mean, holdMs: 170, narrative: round.k === 2 ? "中点就是两张图片前缀的原始均值 ν̄₂(x)" : `重心就是 ${round.k} 张图片前缀的原始均值 ν̄${round.k}(x)` });
      push({ id: `r${round.k}-norm-${candidate.id}`, kind: "norm", ...rest, sweepEnd: sweepAt, move: stepDurations.norm, durationMs: stepDurations.norm, holdMs: 150, narrative: `沿径向把原始前缀均值单位化，得到用于比较的 ν${round.k}(x)` });
      push({ id: `r${round.k}-score-${candidate.id}`, kind: "score", ...rest, sweepEnd: sweepAt, move: stepDurations.score, durationMs: stepDurations.score, holdMs: 650, narrative: `从 ν${round.k}(x) 到 μ_full 画出真实距离线并记录` });
      push({ id: `r${round.k}-score-fade-${candidate.id}`, kind: "score-fade", ...rest, sweepEnd: sweepAt, move: 650, durationMs: 650, holdMs: 0, narrative: "距离线、均值标记和候选强调依次清除，再移动到下一候选" });
      sweep = sweepAt;
    }

    // After all candidate cycles finish, close the sweep back to the lower-right start point.
    push({
      id: `r${round.k}-commit`,
      kind: "commit",
      round: round.k,
      candidateIndex: round.candidates.findIndex((candidate) => candidate.point.id === round.chosen.id),
      sweepStart: sweep,
      sweepEnd: 1,
      move: stepDurations.commit,
      durationMs: stepDurations.commit,
      holdMs: 1400,
      narrative: `全部候选比较完毕：${round.chosen.id} 的前缀均值离 μ_full 最近，成为 p${round.k}`,
    });
  }

  push({ id: "review-prefix", kind: "review", round: 5, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 8000, durationMs: 8000, holdMs: 1200, narrative: "逐项加入已选样本，并查看对应的真实前缀均值" });
  push({ id: "budget-shrink", kind: "budget", round: 6, candidateIndex: 0, sweepStart: 0, sweepEnd: 0, move: 7000, durationMs: 7000, holdMs: 1500, narrative: "总预算 K = 12 不变；类别增加后把容量边界移到前三项并移除尾项 p₄" });
  return clips.map((clip) => {
    if (clip.round !== 4 || clip.kind !== "hull") return clip;
    return {
      ...clip,
      move: Math.round(clip.move * ROUND_FOUR_HULL_DURATION_SCALE),
      durationMs: Math.round(clip.durationMs * ROUND_FOUR_HULL_DURATION_SCALE),
    };
  });
}

const clips = buildClips();
const clipIndexById = new Map(clips.map((clip, index) => [clip.id, index]));
const phaseRailEntries = [
  { id: "target-contribute", label: "建立目标", group: 0 },
  ...ROUNDS.map((round) => {
    const firstCandidate = SCAN_ORDER.find((entry) =>
      round.candidates.some((candidate) => candidate.point.id === entry.point.id),
    )!;
    return { id: `r${round.k}-scan-${firstCandidate.point.id}`, label: `第 ${round.k} 轮`, group: round.k };
  }),
  { id: "review-prefix", label: "回看前缀", group: 5 },
  { id: "budget-shrink", label: "预算截断", group: 6 },
];
const phaseRanges = phaseRailEntries.map((entry, index) => {
  const startIndex = clipIndexById.get(entry.id) ?? 0;
  const endIndex = index === phaseRailEntries.length - 1
    ? clips.length - 1
    : (clipIndexById.get(phaseRailEntries[index + 1].id) ?? clips.length) - 1;
  const durationMs = clips.slice(startIndex, endIndex + 1)
    .reduce((total, clip) => total + clip.durationMs + (clip.holdMs ?? 0), 0);
  return { ...entry, startIndex, endIndex, durationMs };
});

function stablePhaseTitle(phaseIndex: number, clip: DemoClip) {
  if (phaseIndex === 0) return "建立当前类别的完整目标 μ_full";
  if (phaseIndex >= 1 && phaseIndex <= 4) {
    return clip.kind === "commit"
      ? `第 ${phaseIndex} 轮结果：确定 p${phaseIndex}`
      : `第 ${phaseIndex} 轮：在已有前缀后选择 p${phaseIndex}`;
  }
  return phaseIndex === 5 ? "四轮完成：检查有序列表的前缀" : "预算缩小时保留有序列表前缀";
}

/* ------------------------------------------------------------------ scene --- */

type Scene = {
  clip: DemoClip;
  progress: number;
  targetContribute: number;
  targetNormalize: number;
  scanSweep: number | null;
  scannedIds: Set<string>;
  barProgress: (candidateId: string) => number;
  hullReveal: number;
  rawMeanOpacity: number;
  normalizedOpacity: number;
  candidateHighlightOpacity: number;
  contributions: { at: Point; opacity: number }[];
  rawMeanPoint: Point | null;
  normalizedPoint: Point | null;
  scoreReveal: number;
  scoreLineOpacity: number;
  decisionReveal: number;
  reviewIndex: number | null;
  visiblePrefixCount: number;
  fromPrefixIndex: number | null;
  targetPrefixIndex: number | null;
  markerProgress: number;
  lineOpacity: number;
  slotCount: number;
  review: PrefixReviewState | null;
  budget: BudgetState | null;
};

function roundOf(k: number) {
  return ROUNDS[k - 1];
}

function candidateOf(clip: DemoClip) {
  const round = clip.round >= 1 && clip.round <= 4 ? roundOf(clip.round) : null;
  return round ? round.candidates[clip.candidateIndex] ?? null : null;
}

function candidatesInScanOrder(candidates: readonly HerdingDemoCandidate[]) {
  return [...candidates].sort(
    (a, b) => (SCAN_OFFSET_BY_ID.get(a.point.id) ?? 0) - (SCAN_OFFSET_BY_ID.get(b.point.id) ?? 0),
  );
}

function blendHex(from: string, to: string, progress: number) {
  const a = [1, 3, 5].map((index) => Number.parseInt(from.slice(index, index + 2), 16));
  const b = [1, 3, 5].map((index) => Number.parseInt(to.slice(index, index + 2), 16));
  const t = clamp(progress);
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * t)).join(" ")})`;
}

function sceneAt(clip: DemoClip, progress: number, manualReviewIndex: number | null): Scene {
  const p = clamp(progress);
  const reviewState = clip.kind === "review" ? reviewAt(p, manualReviewIndex) : null;
  const budgetState = clip.kind === "budget" ? budgetAt(p) : null;
  const prefixState = reviewState ?? budgetState;
  const candidate = candidateOf(clip);
  const round = clip.round >= 1 && clip.round <= 4 ? roundOf(clip.round) : null;
  const prefixPoints = round ? round.prefix.slice(0, round.k - 1) : [];
  const participantPoints = round && candidate ? [...prefixPoints, candidate.point] : [];

  // The scan ring moves only during scan clips. It stays on the current candidate while that
  // candidate's prefix mean, normalized mean, and distance are completed.
  let scanSweep: number | null = null;
  if (clip.kind === "scan") {
    scanSweep = (clip.sweepStart + (clip.sweepEnd - clip.sweepStart) * p) * TOTAL_SWEEP;
  } else if (clip.kind !== "target-contribute" && clip.kind !== "target-normalize" && clip.kind !== "target-normalize-fade" && clip.kind !== "review" && clip.kind !== "budget") {
    scanSweep = (clip.sweepStart + (clip.sweepEnd - clip.sweepStart) * p) * TOTAL_SWEEP;
  }

  const scannedIds = new Set<string>();
  if (scanSweep !== null) {
    for (const item of SCAN_ORDER) if (item.offset < scanSweep - 0.4) scannedIds.add(item.point.id);
  }

  const contributions: { at: Point; opacity: number }[] = [];
  let rawMeanPoint: Point | null = null;
  let normalizedPoint: Point | null = null;
  let hullReveal = 0;
  let scoreReveal = 0;
  let scoreLineOpacity = 0;
  let rawMeanOpacity = 1;
  let normalizedOpacity = 1;
  let candidateHighlightOpacity = 1;
  let decisionReveal = 0;

  if (candidate && round) {
    const sourcePoints = participantPoints.map((point) => toChartPoint(point.feature));
    // For k = 1 the "prefix mean" of one sample is that sample's own unit feature, measured from
    // the origin: ν₁(x) = normalize(z(x) / 1). Its length is not a distance to the target.
    const rawMean = toChartPoint(candidate.rawPrefixMean);
    const normalized = toChartPoint(candidate.normalizedPrefixMean);
    const gathered = clamp(progressWithin(p, 0.08, 0.86));

    if (clip.kind === "hull") hullReveal = smoothstep(p);
    if (clip.kind === "split") hullReveal = 1;
    if (clip.kind === "hover") hullReveal = 1;
    if (["split", "hover", "gather", "mean", "norm", "score", "score-fade", "commit"].includes(clip.kind) && round.k > 1) {
      const gather = clip.kind === "split" ? 0 : clip.kind === "hover" ? 0 : clip.kind === "gather" ? gathered : 1;
      sourcePoints.forEach((source, index) => {
        const at = { x: source.x + (rawMean.x - source.x) * gather, y: source.y + (rawMean.y - source.y) * gather };
        const fade = clip.kind === "split" ? 1 : clip.kind === "hover" ? 1 : clip.kind === "gather" ? 1 - clamp(progressWithin(p, 0.78, 0.98)) : 0;
        if (fade > 0.01) contributions.push({ at, opacity: fade });
        void index;
      });
    }
    const meanVisible = round.k === 1
      ? false
      : ["gather", "mean", "norm", "score", "score-fade", "commit"].includes(clip.kind) && (clip.kind !== "gather" || gathered > 0.9);
    const meanOpacity = meanVisible ? (clip.kind === "gather" ? clamp(progressWithin(p, 0.86, 0.98)) : 1) : 0;
    if (meanOpacity > 0.01) rawMeanPoint = rawMean;

    const normalizeProgress = clip.kind === "norm" ? smoothstep(p)
      : ["score", "score-fade", "commit"].includes(clip.kind) ? 1
      : 0;
    if (clip.kind === "score" || clip.kind === "score-fade" || clip.kind === "commit") normalizedPoint = normalized;
    else if (clip.kind === "norm") {
      normalizedPoint = { x: rawMean.x + (normalized.x - rawMean.x) * normalizeProgress, y: rawMean.y + (normalized.y - rawMean.y) * normalizeProgress };
    }

    if (clip.kind === "score") {
      scoreReveal = clamp(p);
      scoreLineOpacity = 1;
    } else if (clip.kind === "score-fade") {
      scoreReveal = 1;
      scoreLineOpacity = 1 - smoothstep(progressWithin(p, 0, 0.25));
      rawMeanOpacity = 1 - smoothstep(progressWithin(p, 0.25, 0.5));
      normalizedOpacity = 1 - smoothstep(progressWithin(p, 0.5, 0.75));
      candidateHighlightOpacity = 1 - smoothstep(progressWithin(p, 0.75, 0.99));
    } else if (clip.kind === "commit") scoreReveal = 1;
    if (clip.kind === "commit") decisionReveal = smoothstep(progressWithin(p, 0.35, 0.85));
  }

  if (clip.kind === "target-contribute") {
    // Full-class mean offered by all eight real points.
    rawMeanPoint = TARGET_RAW_POINT;
  }
  if (clip.kind === "target-normalize" || clip.kind === "target-normalize-fade") {
    rawMeanPoint = TARGET_RAW_POINT;
    const move = clip.kind === "target-normalize" ? smoothstep(p) : 1;
    normalizedPoint = { x: TARGET_RAW_POINT.x + (TARGET_POINT.x - TARGET_RAW_POINT.x) * move, y: TARGET_RAW_POINT.y + (TARGET_POINT.y - TARGET_RAW_POINT.y) * move };
  }

  const currentClipIndex = clipIndexById.get(clip.id) ?? 0;
  const scoredIds = new Set<string>();
  if (round) {
    round.candidates.forEach((item) => {
      const scoreIndex = clipIndexById.get(`r${round.k}-score-${item.point.id}`);
      if (scoreIndex !== undefined && currentClipIndex > scoreIndex) scoredIds.add(item.point.id);
    });
  }
  const barProgress = (candidateId: string) => {
    if (!round) return 0;
    if (scoredIds.has(candidateId)) return 1;
    return (clip.kind === "score" || clip.kind === "score-fade") && candidate?.point.id === candidateId ? scoreReveal : 0;
  };

  let slotCount = 0;
  if (clip.kind === "commit") slotCount = clip.round - 1 + clamp(progressWithin(p, 0.25, 0.9));
  else if (prefixState) slotCount = prefixState.visiblePrefixCount;
  else if (clip.round >= 2 && clip.round <= 5) slotCount = clip.round - 1;
  if (clip.kind === "target-contribute" || clip.kind === "target-normalize" || clip.kind === "target-normalize-fade") slotCount = 0;

  return {
    clip,
    progress: p,
    targetContribute: clip.kind === "target-contribute" ? smoothstep(progressWithin(p, 0.05, 0.82)) : clip.kind === "target-normalize" ? 1 : 0,
    targetNormalize: clip.kind === "target-normalize" ? smoothstep(p) : ["target-contribute"].includes(clip.kind) ? 0 : 1,
    scanSweep,
    scannedIds,
    barProgress,
    hullReveal,
    rawMeanOpacity,
    normalizedOpacity,
    candidateHighlightOpacity,
    contributions,
    rawMeanPoint,
    normalizedPoint,
    scoreReveal,
    scoreLineOpacity,
    decisionReveal,
    reviewIndex: prefixState?.activePrefixIndex ?? null,
    visiblePrefixCount: prefixState?.visiblePrefixCount ?? Math.round(slotCount),
    fromPrefixIndex: prefixState?.fromPrefixIndex ?? null,
    targetPrefixIndex: prefixState?.targetPrefixIndex ?? null,
    markerProgress: prefixState?.markerProgress ?? 0,
    lineOpacity: prefixState?.lineOpacity ?? 0,
    slotCount,
    review: reviewState,
    budget: budgetState,
  };
}

/* --------------------------------------------------------------- vectors --- */

function HerdingScene({ scene }: { scene: Scene }) {
  const candidate = candidateOf(scene.clip);
  const round = scene.clip.round >= 1 && scene.clip.round <= 4 ? roundOf(scene.clip.round) : null;
  const prefixPoints = round ? round.prefix.slice(0, round.k - 1) : [];
  const selectedOrdered = scene.clip.kind === "review" || scene.clip.kind === "budget"
    ? HERDING_DEMO_ORDER.slice(0, scene.visiblePrefixCount)
    : round ? round.prefix.slice(0, scene.clip.kind === "commit" ? scene.clip.round : scene.clip.round - 1) : [];
  const selectedIds = new Set(selectedOrdered.map((point) => point.id));
  const showCandidateLabels = scene.clip.kind !== "review" && scene.clip.kind !== "budget";
  const scanRadians = scene.scanSweep === null ? null : ((SCAN_START_DEG + scene.scanSweep) * Math.PI) / 180;
  const scanPoint = scanRadians === null ? null : { x: CENTER.x + Math.cos(scanRadians) * RADIUS, y: CENTER.y + Math.sin(scanRadians) * RADIUS };
  const sweptFrom = scene.scanSweep === null ? null : ((SCAN_START_DEG + Math.max(scene.scanSweep, 0.001)) * Math.PI) / 180;

  const labels: ChartLabel[] = [];
  const obstacles: Point[] = [];
  const isTargetNormalization = scene.clip.kind === "target-normalize" || scene.clip.kind === "target-normalize-fade";
  const targetLabelPoint = isTargetNormalization && scene.normalizedPoint
    ? scene.normalizedPoint
    : scene.targetNormalize > 0.5 && scene.clip.kind !== "target-contribute"
      ? TARGET_POINT
      : null;
  const isPrefixSummary = scene.clip.kind === "review" || scene.clip.kind === "budget";
  if (scene.targetContribute < 0.02 && scene.clip.kind !== "target-contribute" && !isTargetNormalization && !isPrefixSummary) labels.push({ ...TARGET_RAW_POINT, id: "target-raw", text: "μ̄_full" });
  for (const point of HERDING_DEMO_POINTS) {
    const at = toChartPoint(point.feature);
    obstacles.push(at);
    if (showCandidateLabels && (selectedIds.has(point.id) || (point.id === candidate?.point.id && scene.clip.kind !== "scan"))) {
      labels.push({ ...at, id: point.id, text: point.id, opacity: point.id === candidate?.point.id ? scene.candidateHighlightOpacity : 1 });
    }
  }
  if (scene.rawMeanPoint && scene.clip.round !== 1) {
    if (scene.rawMeanOpacity > 0.01) obstacles.push(scene.rawMeanPoint);
    labels.push({ ...scene.rawMeanPoint, id: "raw-mean", text: round && round.k >= 2 ? `ν̄${round.k}(x)` : "μ̄_full", opacity: scene.rawMeanOpacity });
  }
  if (scene.normalizedPoint && scene.clip.round !== 1) {
    if (scene.normalizedOpacity > 0.01) obstacles.push(scene.normalizedPoint);
    if (!isTargetNormalization) labels.push({ ...scene.normalizedPoint, id: "unit-mean", text: round ? `ν${round.k}(x)` : "μ_full", opacity: scene.normalizedOpacity });
  }
  if (scene.reviewIndex !== null) {
    const activePoint = toChartPoint(ROUNDS[scene.reviewIndex - 1].normalizedPrefixMean);
    obstacles.push(activePoint);
    const labelOpacity = scene.fromPrefixIndex === scene.targetPrefixIndex ? 1 : 0.22 + 0.78 * scene.markerProgress;
    labels.push({ ...activePoint, id: "active-prefix", text: `ν${scene.reviewIndex}`, opacity: labelOpacity });
  }

  return (
    <svg
      className="p4-scene"
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`固定的八样本 Herding 特征空间。${scene.clip.narrative}${candidate ? `；当前候选 ${candidate.point.id}` : ""}`}
    >
      <title>同一特征空间中的 Herding 计算与有序前缀</title>
      <desc>坐标轴、八个单位候选特征与完整类别目标贯穿所有片段；扫描环从 a8 出发沿圆周顺时针移动，每个候选完成均值、单位化和距离记录后才转向下一候选。</desc>
      {/* Circle first, axes on top: the circle's fill must not hide the parts of the axes inside it. */}
      <circle className="p4-scene__circle" cx={CENTER.x} cy={CENTER.y} r={RADIUS} />
      <line className="p4-scene__axis" x1="16" y1={CENTER.y} x2={VIEW.width - 16} y2={CENTER.y} />
      <line className="p4-scene__axis" x1={CENTER.x} y1="16" x2={CENTER.x} y2={VIEW.height - 16} />

      {/* Complete-class target: contribution copies then the radial normalization. */}
      {scene.clip.kind === "target-contribute"
        ? HERDING_DEMO_POINTS.map((point) => {
            const source = toChartPoint(point.feature);
            const at = { x: source.x + (TARGET_RAW_POINT.x - source.x) * scene.targetContribute, y: source.y + (TARGET_RAW_POINT.y - source.y) * scene.targetContribute };
            return <circle key={`tc-${point.id}`} className="p4-scene__contribution" cx={at.x} cy={at.y} r="6" />;
          })
        : null}
      {scene.clip.kind === "target-contribute"
        ? HERDING_DEMO_POINTS.map((point) => {
            const at = toChartPoint(point.feature);
            return <line key={`tcl-${point.id}`} className="p4-scene__gather-line" x1={at.x} y1={at.y} x2={TARGET_RAW_POINT.x} y2={TARGET_RAW_POINT.y} opacity={clamp(scene.targetContribute * 1.4)} />;
          })
        : null}
      {(scene.clip.kind === "target-normalize" || scene.clip.kind === "target-normalize-fade") && scene.rawMeanPoint && scene.normalizedPoint ? (
        <path
          className="p4-scene__normalize-path"
          d={`M ${scene.rawMeanPoint.x} ${scene.rawMeanPoint.y} L ${scene.normalizedPoint.x} ${scene.normalizedPoint.y}`}
          opacity={scene.clip.kind === "target-normalize-fade" ? 1 - smoothstep(scene.progress) : 1}
        />
      ) : null}

      {/* Scan ring: a continuous clockwise indicator that never teleports between candidates. */}
      {scene.scanSweep !== null && sweptFrom !== null ? (
        <path className="p4-scene__scan-track" d={arcSegmentPath(CENTER, RADIUS, SCAN_START_DEG, scene.scanSweep)} />
      ) : null}
      {scanPoint && scene.clip.kind === "scan" ? (
        <circle
          className={`p4-scene__candidate-ring${scene.clip.round === 1 && candidate?.point.id === SCAN_START_ID ? " is-anchor-confirmation" : ""}`}
          cx={scanPoint.x}
          cy={scanPoint.y}
          r={scene.clip.round === 1 && candidate?.point.id === SCAN_START_ID ? 14 + smoothstep(scene.progress) * 5 : 16}
          opacity={scene.clip.round === 1 && candidate?.point.id === SCAN_START_ID ? 0.72 + smoothstep(scene.progress) * 0.28 : 1}
          aria-label="顺时针扫描中的候选位置"
        />
      ) : null}

      {/* The light connectors mark which fixed samples participate in the real νk result. */}
      {scene.clip.kind === "review" && scene.review && scene.review.activePrefixIndex > 1
        ? HERDING_DEMO_ORDER.slice(0, scene.visiblePrefixCount).map((point, index) => {
            const from = toChartPoint(point.feature);
            const result = toChartPoint(ROUNDS[scene.review!.activePrefixIndex - 1].normalizedPrefixMean);
            const isNew = index + 1 === scene.review!.introducedPrefixIndex
              && scene.review!.fromPrefixIndex !== scene.review!.targetPrefixIndex;
            const opacity = isNew ? 0.1 + 0.58 * scene.review!.arrivalProgress : 0.28;
            return <line
              key={`review-link-${point.id}`}
              className="p4-scene__review-link"
              x1={from.x}
              y1={from.y}
              x2={result.x}
              y2={result.y}
              opacity={opacity}
              data-prefix-source={point.id}
              data-prefix-result={`ν${scene.review!.activePrefixIndex}`}
            />;
          })
        : null}

      {/* Prefix hull: connects exactly the points that take part in this comparison. */}
      {scene.hullReveal > 0.01 && candidate && round
        ? (() => {
            const vertices = [...round.prefix.slice(0, round.k - 1), candidate.point].map((point) => toChartPoint(point.feature));
            const edges: { from: Point; to: Point; key: string }[] = [];
            for (let index = 1; index < vertices.length; index += 1) {
              edges.push({ from: vertices[index - 1], to: vertices[index], key: `${candidate.point.id}-${index}` });
            }
            // Close the triangle/quadrilateral so the shape is readable as one group of points.
            if (vertices.length > 2) edges.push({ from: vertices[vertices.length - 1], to: vertices[0], key: `${candidate.point.id}-close` });
            const edgeCount = Math.max(edges.length, 1);
            return edges.map((edge, index) => {
              const local = clamp(scene.hullReveal * edgeCount - index);
              const grown = { x: edge.from.x + (edge.to.x - edge.from.x) * local, y: edge.from.y + (edge.to.y - edge.from.y) * local };
              if (local <= 0.01) return null;
              return <line key={`hull-${edge.key}`} className="p4-scene__hull-line" x1={edge.from.x} y1={edge.from.y} x2={grown.x} y2={grown.y} opacity={scene.rawMeanOpacity} />;
            });
          })()
        : null}

      {/* Candidate and prefix rays to the current raw mean. */}
      {candidate && scene.rawMeanPoint && scene.clip.kind !== "scan"
        ? [...prefixPoints, candidate.point].map((point) => {
            const from = toChartPoint(point.feature);
            return <line key={`ray-${candidate.point.id}-${point.id}`} className="p4-scene__prefix-ray" x1={from.x} y1={from.y} x2={scene.rawMeanPoint!.x} y2={scene.rawMeanPoint!.y} opacity={0.55 * scene.rawMeanOpacity} />;
          })
        : null}

      {/* Distance from the normalized prefix mean to the target, same scale as the ruler. */}
      {scene.normalizedPoint && scene.scoreReveal > 0.01 ? (
        <path
          className="p4-scene__score-line"
          d={`M ${scene.normalizedPoint.x} ${scene.normalizedPoint.y} L ${scene.normalizedPoint.x + (TARGET_POINT.x - scene.normalizedPoint.x) * scene.scoreReveal} ${scene.normalizedPoint.y + (TARGET_POINT.y - scene.normalizedPoint.y) * scene.scoreReveal}`}
          opacity={scene.scoreLineOpacity}
        />
      ) : null}

      {/* Eight stable candidate features. */}
      {HERDING_DEMO_POINTS.map((point) => {
        const at = toChartPoint(point.feature);
        const isSelected = selectedIds.has(point.id);
        const isBudgetTail = scene.clip.kind === "budget" && point.id === HERDING_DEMO_ORDER[3].id;
        const isReviewAddition = scene.clip.kind === "review"
          && scene.review !== null
          && scene.review.fromPrefixIndex !== scene.review.targetPrefixIndex
          && HERDING_DEMO_ORDER[scene.review.introducedPrefixIndex - 1]?.id === point.id;
        const reviewIntro = scene.clip.kind === "review" && scene.review !== null && scene.review.transitionProgress < 1;
        const orderedIndex = HERDING_DEMO_ORDER.findIndex((item) => item.id === point.id);
        const introPulse = reviewIntro
          ? clamp(1 - Math.abs(scene.review!.transitionProgress - (orderedIndex + 0.5) / HERDING_DEMO_ORDER.length) / 0.18)
          : 0;
        const isCandidate = point.id === candidate?.point.id && scene.clip.kind !== "scan";
        const isScanned = scene.scannedIds.has(point.id);
        const classes = ["p4-scene__point", isSelected ? "is-selected" : "", isReviewAddition ? "is-added-prefix" : "", isCandidate ? "is-candidate" : "", isScanned ? "is-scanned" : ""].filter(Boolean).join(" ");
        return (
          <g key={point.id} className={classes}>
            <title>{`${point.id}${isSelected ? ` · 有序样本 p${selectedOrdered.findIndex((item) => item.id === point.id) + 1}` : " · 未选候选"}`}</title>
            {isSelected ? <circle className="p4-scene__selected-ring" cx={at.x} cy={at.y} r="12" opacity={isBudgetTail ? scene.budget?.tailOpacity ?? 1 : isReviewAddition ? 0.32 + 0.68 * (scene.review?.arrivalProgress ?? 0) : reviewIntro ? 0.2 + 0.8 * introPulse : 1} /> : null}
            {isCandidate ? <circle className="p4-scene__candidate-ring" cx={at.x} cy={at.y} r="16" opacity={scene.candidateHighlightOpacity} /> : null}
            <circle
              className="p4-scene__dot"
              cx={at.x}
              cy={at.y}
              r={isCandidate ? 7 : isSelected ? 6.4 : 5.2}
              style={isCandidate
                ? { fill: blendHex("#91a19b", "#c2703f", scene.candidateHighlightOpacity) }
                : isBudgetTail
                  ? { fill: blendHex("#91a19b", "#35775f", scene.budget?.tailOpacity ?? 1) }
                  : isReviewAddition
                    ? { fill: blendHex("#35775f", "#c2703f", scene.review?.arrivalProgress ?? 0) }
                  : undefined}
            />
          </g>
        );
      })}

      {/* Contribution copies travel from the real endpoints; the endpoints themselves stay put. */}
      {scene.contributions.map((item, index) => (
        <circle key={`contribution-${index}`} className="p4-scene__contribution" cx={item.at.x} cy={item.at.y} r="6" opacity={item.opacity} />
      ))}

      {/* Means: raw diamond inside the circle, normalized marker on it. */}
      {scene.rawMeanPoint && scene.clip.round !== 1 ? <polygon className="p4-scene__raw-mean" points={diamond(scene.rawMeanPoint)} opacity={scene.rawMeanOpacity} /> : null}
      {scene.normalizedPoint && scene.clip.round !== 1 ? <circle className="p4-scene__unit-mean" cx={scene.normalizedPoint.x} cy={scene.normalizedPoint.y} r="8.5" opacity={scene.normalizedOpacity} /> : null}

      {/* Ordered prefix nodes while reviewing. */}
      {scene.reviewIndex !== null
        ? ROUNDS.slice(0, scene.clip.kind === "budget" ? 4 : scene.visiblePrefixCount).map((item) => {
            const point = toChartPoint(item.normalizedPrefixMean);
            const active = item.k === scene.reviewIndex;
            const transitioningFrom = scene.fromPrefixIndex === item.k && scene.targetPrefixIndex !== item.k;
            const transitioningTo = scene.targetPrefixIndex === item.k && scene.fromPrefixIndex !== item.k;
            const pending = scene.clip.kind === "budget" && scene.budget?.pendingPrefixIndex === item.k;
            const opacity = transitioningFrom
              ? 0.36 - 0.12 * scene.markerProgress
              : transitioningTo
                ? 0.3 + 0.7 * scene.markerProgress
                : active
                  ? 1
                  : pending
                    ? 0.34 + 0.26 * (scene.budget?.pendingPrefixProgress ?? 0)
                  : scene.clip.kind === "budget" && item.k === 4
                    ? 0.18
                    : 0.24;
            const retired = scene.clip.kind === "budget" && item.k === 4 && scene.budget?.tailState === "removed";
            return (
              <g key={`prefix-${item.k}`} className={`p4-scene__prefix-node${active ? " is-active" : ""}${pending ? " is-pending" : ""}${retired ? " is-retired" : ""}`} opacity={opacity}>
                <circle cx={point.x} cy={point.y} r={active ? 9 : 5} />
                <title>{`ν${item.k} = normalize(mean(z(p₁), …, z(p${item.k})))，由真实前缀计算${retired ? "；p₄ 已不属于当前保留列表" : ""}${pending ? "；预算调整后待生效，p₄ 完全退出后才切换" : ""}`}</title>
                {active ? <line x1={CENTER.x} y1={CENTER.y} x2={point.x} y2={point.y} opacity={scene.lineOpacity} /> : null}
                {pending ? <line className="p4-scene__prefix-pending-ray" x1={CENTER.x} y1={CENTER.y} x2={point.x} y2={point.y} opacity={0.36 + 0.42 * (scene.budget?.pendingPrefixProgress ?? 0)} /> : null}
              </g>
            );
          })
        : null}

      {/* Fixed display target. */}
      <polygon className="p4-scene__raw-target" points={diamond(TARGET_RAW_POINT)} opacity={scene.clip.kind === "target-contribute" ? clamp(scene.targetContribute * 1.5) : scene.clip.kind === "target-normalize" ? 1 - scene.targetNormalize * 0.7 : 0.9} />
      <path className="p4-scene__target" d={featureStar(TARGET_POINT.x, TARGET_POINT.y)} opacity={scene.targetNormalize} />
      <circle className="p4-scene__origin" cx={CENTER.x} cy={CENTER.y} r="3.4" />
      <ChartLabels labels={labels} obstacles={obstacles} width={VIEW.width} height={VIEW.height} fontSize={18} />
      {targetLabelPoint ? (
        <text
          className="p4-scene__fixed-mean-label"
          x={targetLabelPoint.x + TARGET_LABEL_OFFSET.x}
          y={targetLabelPoint.y + TARGET_LABEL_OFFSET.y}
          textAnchor="middle"
        >μ_full</text>
      ) : null}
      <text className="p4-scene__note" x="14" y="20">
        固定合成示例 · 八个单位特征 ‖z‖₂ = 1 · 距离尺与图中线段同尺度
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------- right rail --- */

function DistanceRuler({ scene }: { scene: Scene }) {
  const round = scene.clip.round >= 1 && scene.clip.round <= 4 ? roundOf(scene.clip.round) : null;
  if (!round) {
    return (
      <div className="p4-ruler p4-ruler--empty" aria-label="当前没有候选距离轮次">
        <div className="p4-ruler__head"><b>候选距离</b><span>逐轮记录</span></div>
        <p>每轮只列出尚未选中的候选；均值与单位化完成后，再按顺时针顺序记录到 μ<sub>full</sub> 的距离。</p>
      </div>
    );
  }
  const maximum = Math.max(...round.candidates.map((item) => item.score), 0.0001);
  const activeCandidate = candidateOf(scene.clip);
  const orderedCandidates = candidatesInScanOrder(round.candidates);
  return (
    <div className="p4-ruler" aria-label={`第 ${round.k} 轮候选到完整类别目标的距离，按顺时针扫描顺序排列`}>
      <div className="p4-ruler__head"><b>到 μ<sub>full</sub> 的距离</b><span>第 {round.k} 轮 · 顺时针</span></div>
      <div className="p4-ruler__rows">
        {orderedCandidates.map((item, index) => {
          const revealed = scene.barProgress(item.point.id);
          const chosen = item.point.id === round.chosen.id && scene.clip.kind === "commit";
          const active = item.point.id === activeCandidate?.point.id && scene.clip.kind !== "commit" && scene.clip.kind !== "scan";
          return (
            <span
              key={item.point.id}
              data-candidate-id={item.point.id}
              data-candidate-order={index + 1}
              data-score-progress={revealed.toFixed(3)}
              data-score-revealed={(revealed > 0.98).toString()}
              className={[active ? "is-active" : "", chosen ? "is-chosen" : ""].filter(Boolean).join(" ")}
              title={`第 ${index + 1} 个候选 ${item.point.id}，距离 ${revealed > 0.98 ? item.score.toFixed(3) : "尚未计算"}`}
            >
              <em>{String(index + 1).padStart(2, "0")}</em>
              <code>{item.point.id}</code>
              <span className="p4-ruler__bar"><i style={{ width: `${(item.score / maximum) * revealed * 100}%` }} /></span>
              <small>{revealed > 0.98 ? item.score.toFixed(3) : "…"}</small>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Slots({ count, budget, review }: { count: number; budget: BudgetState | null; review: PrefixReviewState | null }) {
  return (
    <div className="p4-slots" aria-label={`当前保留 ${Math.round(count)} 个有序 exemplar`}>
      {Array.from({ length: HERDING_DEMO_QUOTA }, (_, index) => {
        const filled = index < count;
        const arriving = filled && index >= Math.floor(count);
        const isBudgetTail = budget !== null && index === 3;
        const isVacated = isBudgetTail && budget.tailState === "removed";
        const isReviewAddition = review !== null
          && review.fromPrefixIndex !== review.targetPrefixIndex
          && review.introducedPrefixIndex === index + 1;
        return <span
          key={index}
          data-prefix-slot-index={index + 1}
          data-prefix-sample-id={filled ? HERDING_DEMO_ORDER[index].id : ""}
          data-prefix-retained={filled.toString()}
          className={[
            filled ? "is-filled" : "",
            arriving ? "is-arriving" : "",
            isReviewAddition ? "is-review-arriving" : "",
            isBudgetTail && budget.tailState === "pending" ? "is-tail-highlight" : "",
            isBudgetTail && budget.tailState === "removing" ? "is-tail-removing" : "",
            isVacated ? "is-vacated" : "",
          ].filter(Boolean).join(" ")}
          style={isReviewAddition ? { opacity: 0.62 + 0.38 * review.arrivalProgress } : undefined}
        >
          {isBudgetTail
            ? <>
                <span className="p4-slot-tail" style={{ "--tail-opacity": budget.tailOpacity, "--tail-displacement": `${budget.tailDisplacement}px` } as CSSProperties}><b>p₄</b><small>{HERDING_DEMO_ORDER[index].id}</small></span>
                {isVacated ? <small className="p4-slot-empty">空槽</small> : null}
              </>
            : <><b>p<sub>{index + 1}</sub></b><small>{filled ? HERDING_DEMO_ORDER[index].id : "待选择"}</small></>}
        </span>;
      })}
    </div>
  );
}

function OrderedMemoryStage({
  scene,
  reviewNarrative,
  onSelectPrefix,
}: {
  scene: Scene;
  reviewNarrative: string | null;
  onSelectPrefix: (index: number) => void;
}) {
  const isReview = scene.clip.kind === "review";
  const review = scene.review;
  const budget = scene.budget;
  const retainedCount = budget
    ? budget.tailState === "removed" ? 3 : 4
    : scene.visiblePrefixCount;
  const boundaryPosition = budget ? 75 + (1 - budget.quotaChangeProgress) * 25 : 100;
  const message = review
    ? review.transitionProgress < 1
      ? "上一阶段已经决定 p₁…p₄。现在停止扫描候选，把注意力转到已选顺序。"
      : review.handoffProgress > 0
        ? "下一步：预算只能留 3 项怎么办？当前完整列表仍有 4 项，p₄ 尚未移除。"
        : reviewNarrative ?? "按顺序取前缀；新增名额时保留已有项，只继续加入下一项。"
    : budget?.tailState === "removed"
      ? "只从尾部移除 p₄=a5；前三项身份和顺序不变。当前保留 3/3 项，不改原图或追加训练。"
      : budget?.tailState === "removing"
        ? "p₄=a5 正离开原图记忆；退出完成前仍显示完整 P 和真实 ν₄。"
        : budget?.tailState === "pending"
          ? "类别数增加、总预算不变，边界移到 p₃ 之后；现在标出待移除的尾项 p₄=a5。"
          : "总预算仍为 K=12。此前每类可留 4 项；类别增加后每类改留 3 项。";

  return (
    <div className={`p4-workbench__layout p4-workbench__layout--ordered ${isReview ? "is-review" : "is-budget"}`}>
      <section className="panel p4-ordered-stage" aria-label={isReview ? "Herding 有序前缀工作台" : "固定总预算下的有序记忆截断"}>
        <header className="p4-ordered-stage__header">
          <div>
            <span className="eyebrow">ORDERED EXEMPLAR MEMORY</span>
            <h3>{isReview ? "有序样本带 P" : "类别增加时，保留同一顺序的前缀"}</h3>
            <p>{isReview ? "真实 Herding 顺序：a8 → a2 → a4 → a5。前 m 项就是该容量下可保留的候选集合。" : "P4 独立预算示例：总预算固定，类别由 3 增至 4；前三项保持原位，只有尾项离开。"}</p>
          </div>
          <span className="p4-ordered-stage__count" aria-live="polite">
            {budget ? `${retainedCount} / ${budget.tailState === "removed" ? 3 : 4}` : `${scene.visiblePrefixCount} / 4 项`}
          </span>
        </header>

        {isReview ? (
          <div className="p4-ordered-stage__review-summary">
            <span>当前前缀</span>
            <b>P<sub>{scene.visiblePrefixCount}</sub> = [{HERDING_DEMO_ORDER.slice(0, scene.visiblePrefixCount).map((point) => point.id).join(", ")}]</b>
            <small>ν<sub>{scene.reviewIndex}</sub> 由这组真实样本重新计算</small>
          </div>
        ) : (
          <div className="p4-ordered-stage__quota" data-budget-state={budget?.tailState} style={{ "--quota-change-fill": `${(budget?.quotaChangeProgress ?? 0) * 100}%` } as CSSProperties}>
            <span className="p4-ordered-stage__total">总预算 <b>K = 12</b></span>
            <strong className="p4-ordered-stage__quota-before">3 类 × 4 项 = 12</strong>
            <i aria-hidden="true">→</i>
            <strong className="p4-ordered-stage__quota-after" style={{ opacity: 0.45 + (budget?.quotaChangeProgress ?? 0) * 0.55 }}>4 类 × 3 项 = 12</strong>
          </div>
        )}

        <div className="p4-ordered-stage__list" data-prefix-count={scene.visiblePrefixCount} data-tail-state={budget?.tailState ?? ""}>
          <div className="p4-ordered-stage__cards">
            {HERDING_DEMO_ORDER.map((point, index) => {
              const visible = budget !== null || index < scene.visiblePrefixCount;
              const isTail = budget !== null && index === HERDING_DEMO_ORDER.length - 1;
              const isActive = index < retainedCount;
              const isEntering = review !== null
                && visible
                && review.introducedPrefixIndex === index + 1
                && (review.arrivalProgress < 1 || review.transitionProgress < 1);
              const arrivalOpacity = review && isEntering
                ? index === 0 && review.transitionProgress < 1
                  ? 0.3 + 0.7 * review.transitionProgress
                  : 0.32 + 0.68 * review.arrivalProgress
                : visible ? 1 : 0.3;
              const slotClass = [
                "p4-ordered-card",
                visible ? "is-visible" : "is-pending",
                isActive ? "is-retained" : "",
                isEntering ? "is-arriving" : "",
                isTail && budget?.tailState === "pending" ? "is-tail-highlight" : "",
                isTail && budget?.tailState === "removing" ? "is-tail-removing" : "",
                isTail && budget?.tailState === "removed" ? "is-released" : "",
              ].filter(Boolean).join(" ");
              return (
                <article
                  key={point.id}
                  className={slotClass}
                  data-prefix-slot-index={index + 1}
                  data-prefix-sample-id={visible ? point.id : ""}
                  data-prefix-retained={isActive.toString()}
                  style={{
                    gridColumn: index + 1,
                    "--arrival-opacity": arrivalOpacity,
                    "--tail-displacement": isTail ? `${budget?.tailDisplacement ?? 0}px` : "0px",
                  } as CSSProperties}
                >
                  <span className="p4-ordered-card__position">p<sub>{index + 1}</sub></span>
                  <b>{visible ? point.id : "待加入"}</b>
                  <small>{budget
                    ? isTail
                      ? budget.tailState === "removed" ? "释放 · 不再保留" : budget.tailState === "removing" ? "移出原图记忆" : budget.tailState === "pending" ? "移除尾项" : "原有尾项"
                      : "保留 · 顺序不变"
                    : visible ? isActive ? "当前前缀" : "已选顺序" : `第 ${index + 1} 项`}</small>
                </article>
              );
            })}
            {budget ? <span className="p4-ordered-stage__quota-boundary" style={{ left: `${boundaryPosition}%` }}><b>每类上限</b></span> : null}
            <div className="p4-ordered-stage__retain-note">
              {budget?.tailState === "removed" ? "前三项仍是原来的 p₁、p₂、p₃" : "按已选顺序逐项增加，不重新挑选前面的样本"}
            </div>
            <div className={`p4-ordered-stage__release-zone${budget ? " is-active" : ""}`} aria-label="尾项释放区">
              <span>释放 / 不再保留</span>
            </div>
          </div>
        </div>

        <div className="p4-ordered-stage__footer">
          <p aria-live="polite">{message}</p>
          {isReview ? (
            <div className="p4-prefix-picker p4-prefix-picker--large" role="group" aria-label="切换要回看的 Herding 前缀长度">
              {ROUNDS.map((item) => (
                <button key={item.k} type="button" aria-pressed={scene.reviewIndex === item.k} onClick={() => onSelectPrefix(item.k)}>
                  前 {item.k} 项
                </button>
              ))}
            </div>
          ) : budget?.tailState === "removed" ? (
            <div className="p4-ordered-stage__final-result" aria-live="polite">
              <span>P′ = [p₁, p₂, p₃] = [a8, a2, a4]</span>
              <b>3 / 3</b>
              <small>当前保留集合对应真实前缀均值 ν<sub>3</sub></small>
            </div>
          ) : (
            <div className="p4-ordered-stage__budget-result" aria-live="polite">
              <b>P = [p₁, p₂, p₃, p₄] = [a8, a2, a4, a5]</b>
              <small>当前完整列表 · 真实前缀均值 ν<sub>4</sub></small>
            </div>
          )}
        </div>
      </section>

      <aside className="panel p4-ordered-reference" aria-label="有序前缀的真实特征空间对照图">
        <header>
          <span className="eyebrow">FIXED FEATURE SPACE</span>
          <h3>圆图作真实性对照</h3>
          <p>{isReview ? `当前只强调前 ${scene.visiblePrefixCount} 项与真实 ν${scene.reviewIndex}；其余已选项仍在原位。` : budget?.tailState === "removed" ? "a5 不再高亮；前三项与真实 ν₃ 对应。" : "全体候选留在原位；预算变化只影响有序记忆中的保留项。"}</p>
        </header>
        <div className="p4-ordered-reference__canvas"><HerdingScene scene={scene} /></div>
        <div className="p4-ordered-reference__legend">
          <span><i className="p4-legend-point" />样本特征</span>
          <span><i className="p4-legend-target">★</i>完整目标 μ<sub>full</sub></span>
          <span><i className="p4-legend-mean" />真实前缀均值</span>
        </div>
      </aside>
    </div>
  );
}

function CurrentFormula({ scene }: { scene: Scene }) {
  const round = scene.clip.round >= 1 && scene.clip.round <= 4 ? roundOf(scene.clip.round) : null;
  const candidate = candidateOf(scene.clip);
  if (scene.clip.kind === "target-contribute") {
    return <span>μ̄<sub>full</sub> = (1/|X<sub>y</sub>|) Σ<sub>x∈X<sub>y</sub></sub> z(x)</span>;
  }
  if (scene.clip.kind === "target-normalize" || scene.clip.kind === "target-normalize-fade") {
    return <span>μ<sub>full</sub> = normalize(μ̄<sub>full</sub>)</span>;
  }
  if (!round) {
    if (scene.clip.kind === "review") {
      return <span>ν<sub>{scene.reviewIndex}</sub> = normalize((1/{scene.reviewIndex}) Σ<sub>i=1…{scene.reviewIndex}</sub> z(p<sub>i</sub>))</span>;
    }
    if (scene.clip.kind === "budget") {
      if (scene.budget?.tailState === "removed") {
        return <span>当前前缀 ν<sub>3</sub> · P′ = [p₁, p₂, p₃]</span>;
      }
      return <span>当前 P = [p₁, p₂, p₃, p₄] · ν<sub>4</sub>；p₄ 完全退出后切换到 ν<sub>3</sub></span>;
    }
    return <span>ν<sub>k</sub> = normalize((1/k) Σ<sub>i=1…k</sub> z(p<sub>i</sub>))</span>;
  }
  const k = round.k;
  if (!candidate) {
    return <span>p<sub>{k}</sub> = arg min<sub>x∉P</sub> ‖μ<sub>full</sub> − ν<sub>{k}</sub>(x)‖₂</span>;
  }
  const x = candidate.point.id;
  if (scene.clip.kind === "commit") {
    return (
      <div className="p4-formula-stack">
        <span>p<sub>{k}</sub> = {round.chosen.id}</span>
        <span>arg min<sub>x∉P</sub> d<sub>{k}</sub>(x) = {round.chosen.id}</span>
      </div>
    );
  }
  if (k === 1) {
    return (
      <div className="p4-formula-stack">
        <span>ν₁({x}) = z({x})</span>
        <span>d₁({x}) = ‖μ<sub>full</sub> − z({x})‖₂ = {scene.scoreReveal > 0.98 ? candidate.score.toFixed(3) : "…"}</span>
      </div>
    );
  }
  return (
    <div className="p4-formula-stack">
      <span>ν̄<sub>{k}</sub>({x}) = (1/{k}) [ {round.prefix.slice(0, k - 1).map((point) => `z(${point.id})`).join(" + ")} + z({x}) ]</span>
      <span>ν<sub>{k}</sub>({x}) = normalize(ν̄<sub>{k}</sub>({x}))</span>
      <span>d<sub>{k}</sub>({x}) = ‖μ<sub>full</sub> − ν<sub>{k}</sub>({x})‖₂ = {scene.scoreReveal > 0.98 ? candidate.score.toFixed(3) : "…"}</span>
    </div>
  );
}

const P4_CONCEPT_POINTS = [
  [45, 54], [72, 35], [103, 59], [127, 41], [156, 66], [184, 43], [207, 72], [232, 51],
  [59, 105], [89, 87], [121, 112], [151, 94], [179, 119], [216, 103], [76, 139], [139, 144], [199, 142],
] as const;

function meanConceptPoint(points: readonly (readonly [number, number])[]) {
  const total = points.reduce((sum, [x, y]) => ({ x: sum.x + x, y: sum.y + y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

function P4SelectionSketch({ mode }: { mode: "clustered" | "representative" }) {
  const selected = mode === "clustered" ? new Set([0, 1, 8, 9]) : new Set([0, 5, 13, 16]);
  const selectedPoints = P4_CONCEPT_POINTS.filter((_, index) => selected.has(index));
  const memoryMean = meanConceptPoint(selectedPoints);
  const fullMean = meanConceptPoint(P4_CONCEPT_POINTS);
  const labelFullX = fullMean.x + (mode === "clustered" ? 13 : -12);
  const labelFullAnchor = mode === "clustered" ? "start" : "end";
  const starPath = `M${fullMean.x} ${fullMean.y - 14}l4 9 10 1-8 6 3 10-9-5-9 5 3-10-8-6 10-1Z`;
  return (
    <svg viewBox="0 0 280 180" role="img" aria-label={mode === "clustered" ? "二维示意坐标中，左侧保留点的坐标均值 μ keep 偏离完整点集均值 μ full" : "二维示意坐标中，分散保留点的坐标均值 μ keep 更接近完整点集均值 μ full"}>
      <path className="p4-preview__axis" d="M22 157H258M30 168V18" />
      {P4_CONCEPT_POINTS.map(([x, y], index) => <circle key={`${x}-${y}`} className={selected.has(index) ? "is-selected" : ""} cx={x} cy={y} r={selected.has(index) ? 7 : 4.5} />)}
      <path className="p4-preview__distance" d={`M${memoryMean.x} ${memoryMean.y}L${fullMean.x} ${fullMean.y}`} />
      <circle className="p4-preview__mean" cx={memoryMean.x} cy={memoryMean.y} r="10" />
      <text className="p4-preview__mean-label" x={memoryMean.x + 13} y={memoryMean.y + (mode === "clustered" ? -12 : 14)}>μ_keep</text>
      <path className="p4-preview__target" d={starPath} />
      <text className="p4-preview__target-label" x={labelFullX} y={fullMean.y - 8} textAnchor={labelFullAnchor}>μ_full</text>
    </svg>
  );
}

function P4HerdingMechanism() {
  const round = ROUNDS[1];
  const prefixBefore = round.prefix.slice(0, round.k - 1);
  const candidates = candidatesInScanOrder(round.candidates);
  return (
    <section className="p4-preview__mechanism" data-round={round.k} data-chosen={round.chosen.id} aria-labelledby="p4-herding-mechanism-title">
      <header>
        <span>CORE MECHANISM · REAL ROUND {round.k}</span>
        <h3 id="p4-herding-mechanism-title">Herding：每次只确定下一张要保留的图</h3>
        <p>完整类别数据暂时可用时，可以算出 μ<sub>full</sub>；长期记忆容量有限，随意留下几张图可能让保留均值偏离这个完整类参考。</p>
      </header>

      <ol className="p4-preview__mechanism-states">
        <li className="p4-preview__mechanism-state p4-preview__mechanism-state--prefix">
          <span>01 · 固定已有前缀</span>
          <b>[ {prefixBefore.map((point, index) => `p${index + 1}=${point.id}`).join(" · ")} ]</b>
          <small>前面已经选定，不在本轮改写；μ<sub>full</sub> 也保持固定。</small>
        </li>
        <li className="p4-preview__mechanism-state p4-preview__mechanism-state--try">
          <span>02 · 逐个试未选候选 x</span>
          <b>ν<sub>{round.k}</sub>(x) = unit(mean(prefix + x))</b>
          <div aria-label={`第 ${round.k} 轮所有未选候选的真实距离`}>
            {candidates.map((candidate) => <i key={candidate.point.id} className={candidate.point.id === round.chosen.id ? "is-minimum" : ""} data-candidate={candidate.point.id} data-score={candidate.score.toFixed(6)}>{candidate.point.id}<small>d={candidate.score.toFixed(3)}</small></i>)}
          </div>
          <small>每个候选都与同一 μ<sub>full</sub> 比较；上面数值来自本页真实第 {round.k} 轮。</small>
        </li>
        <li className="p4-preview__mechanism-state p4-preview__mechanism-state--commit">
          <span>03 · 提交本轮 arg min</span>
          <b>p<sub>{round.k}</sub> = {round.chosen.id}</b>
          <strong>d<sub>{round.k}</sub> = {round.score.toFixed(3)}</strong>
          <small>只把本轮最小项追加到末尾，得到 [ {round.prefix.map((point) => point.id).join(" → ")} ]。</small>
        </li>
      </ol>

      <p className="p4-preview__mechanism-boundary"><b>边界</b>这是<strong>逐轮贪心</strong>选择：只保证当前轮取 arg min，<strong>不保证全局最优</strong>，也不保证距离每轮下降。输出顺序支持容量缩减时截去尾项、<strong>保留前缀</strong>。</p>
    </section>
  );
}

function P4Prelude({ onInspect, onPlayAll, reducedMotion }: { onInspect: () => void; onPlayAll: () => void; reducedMotion: boolean }) {
  return (
    <section className="p4-preview" aria-labelledby="p4-preview-title">
      <header className="p4-preview__header">
        <span className="eyebrow">Prototype 来自保留图片的特征均值</span>
        <h2 id="p4-preview-title">少量图片怎么选，才不让类别参考偏到分布的一角？</h2>
        <p>P3 的预测依赖 Prototype，因此选样要关心<strong>保留均值能否接近完整类目标 μ<sub>full</sub></strong>。</p>
      </header>

      <div className="p4-preview__comparison">
        <div className="p4-preview__contrast"><span>同一批完整样本，保留方式不同</span></div>
        <article className="p4-preview__case p4-preview__case--clustered">
          <header><span>解释性示意</span><h3>随意少量选样可能集中在一侧</h3></header>
          <P4SelectionSketch mode="clustered" />
          <p>圆点是同一二维示意点集；μ<sub>keep</sub> 与 μ<sub>full</sub> 分别按保留点和全体点的坐标均值计算。</p>
        </article>
        <article className="p4-preview__case p4-preview__case--representative">
          <header><span>Herding 的目标</span><h3>让保留均值逐轮逼近完整类目标</h3></header>
          <P4SelectionSketch mode="representative" />
          <p>在同一套二维示意点中，分散选取让两种均值更近。每轮取本轮距离最小的候选，是逐轮贪心；这不意味着贪心结果是全局最优，也不保证距离每轮下降。</p>
        </article>
      </div>

      <P4HerdingMechanism />

      <div className="p4-preview__prefix-result" aria-label="有序前缀支持容量缩减">
        <div><span>有序列表</span><b>[ p₁</b><b>p₂</b><b>p₃</b><b className="is-tail">p₄ ]</b></div>
        <svg viewBox="0 0 58 26" aria-hidden="true"><path d="M2 13h48m-8-7 8 7-8 7" /></svg>
        <div className="p4-preview__quota"><i />名额边界前移<span>截去尾项，保留前缀</span></div>
        <p><strong>每轮选使当前距离最小的候选，不保证距离逐轮下降或全局最优。</strong>长期保存的是原始图片与顺序；预算缩减时截去尾项，保留前缀。</p>
      </div>

      <footer className="p4-preview__footer">
        <p><b>接下来观察</b>固定前缀，逐个试候选；看本轮哪个候选让保留均值最接近完整类参考。<span>本次示例：8 个合成单位特征选前 4 项；容量例 K=12，3→4 类、每类 4→3 项。P5/P7 的 3→6 类示例用于说明增类。</span></p>
        <div><button type="button" className="icarl-button icarl-button--quiet p4-start-button" onClick={onInspect}>查看逐轮计算 ↓</button><button type="button" className="icarl-button icarl-button--primary" onClick={onPlayAll} disabled={reducedMotion}>▶ 完整播放</button></div>
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------- page --- */

export function PageFour({ onContinue }: { onContinue?: () => void } = {}) {
  const reducedMotion = useReducedMotion();
  const { state, controls } = useAnimationTimeline({ clips, reducedMotion, autoPlay: false });
  const [playMode, setPlayMode] = useState<"all" | "phase">("phase");
  const [manualReviewIndex, setManualReviewIndex] = useState<number | null>(null);
  const workbenchRef = useRef<HTMLElement | null>(null);
  const clip = clips[state.clipIndex];
  const scene = useMemo(() => sceneAt(clip, state.progress, manualReviewIndex), [clip, state.progress, manualReviewIndex]);
  const round = clip.round >= 1 && clip.round <= 4 ? roundOf(clip.round) : null;
  const candidate = candidateOf(clip);
  const activePhaseIndex = Math.max(0, phaseRanges.findIndex((phase) => state.clipIndex >= phase.startIndex && state.clipIndex <= phase.endIndex));
  const activePhase = phaseRanges[activePhaseIndex];
  const phaseComplete = state.clipIndex === activePhase.endIndex && state.isHolding;
  const completedPhaseMs = clips.slice(activePhase.startIndex, state.clipIndex)
    .reduce((total, item) => total + item.durationMs + (item.holdMs ?? 0), 0);
  const phaseProgress = clamp((completedPhaseMs + state.elapsedMs) / activePhase.durationMs);
  const reviewNarrative = scene.review
    ? scene.review.activePrefixIndex === 1
      ? "从首个已选样本 p₁ = a8 开始：ν₁ = z(p₁)，无需再次平均。"
      : scene.review.arrivalProgress < 0.9
        ? `加入 p${scene.review.introducedPrefixIndex} = ${HERDING_DEMO_ORDER[scene.review.introducedPrefixIndex - 1].id}；它与之前 ${scene.review.introducedPrefixIndex - 1} 项共同参与新的前缀均值。`
        : `前 ${scene.review.activePrefixIndex} 项共同形成真实前缀均值 ν${scene.review.activePrefixIndex}；距离不保证逐项下降。`
    : null;
  const workbenchNarrative = scene.review?.transitionProgress !== undefined && scene.review.transitionProgress < 1
    ? "上一阶段已经决定每个 pₖ；现在停止扫描候选，开始整理最终顺序。"
    : scene.review?.handoffProgress
      ? "下一步预算只能留 3 项；现在仍保留完整四项，p₄ 尚未删除。"
      : reviewNarrative ?? clip.narrative;
  const currentAction = clip.kind === "score-fade"
    ? `${candidate?.point.id ?? "上一候选"} 的真实分数已记录；清场后继续比较下一候选。`
    : clip.kind === "commit"
      ? `本轮全部候选已比较，${round?.chosen.id} 以最小真实距离成为 p${clip.round}。`
      : workbenchNarrative;
  const orderedMemoryMode = clip.kind === "review" || clip.kind === "budget";

  useEffect(() => {
    if (playMode === "phase" && state.status === "playing" && state.clipIndex === activePhase.endIndex && state.isHolding) controls.pause();
  }, [state.status, state.clipIndex, state.isHolding, activePhase.endIndex, controls.pause, playMode]);

  const slotCount = Math.round(scene.slotCount);

  function focusWorkbench() {
    workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function jumpToPhase(index: number, options?: { autoPlay?: boolean }) {
    const phase = phaseRanges[index];
    if (phase) {
      setPlayMode("phase");
      setManualReviewIndex(null);
      controls.goToClip(reducedMotion ? phase.endIndex : phase.startIndex, { autoPlay: false, ...options });
    }
  }

  function togglePlayback() {
    if (state.status === "playing") {
      controls.pause();
      return;
    }
    if (reducedMotion) return;
    if (phaseComplete || state.status === "finished") {
      jumpToPhase(activePhaseIndex, { autoPlay: true });
      return;
    }
    controls.play();
  }

  function replayPhase() {
    jumpToPhase(activePhaseIndex, { autoPlay: !reducedMotion });
  }

  function playAll() {
    if (reducedMotion) return;
    setPlayMode("all");
    setManualReviewIndex(null);
    workbenchRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    controls.goToClip(0, { autoPlay: true });
  }

  return (
    <article className="tutorial-page icarl-page icarl-page--p4">
      <header className="page-heading icarl-page__heading p4-intro">
        <div className="icarl-page__eyebrow"><span>PAGE 04</span><i /> EXEMPLAR SELECTION &amp; MANAGEMENT</div>
        <h1>每个类别只能留下少量图片，怎样选择才更有代表性？</h1>
        <p>P3 的 Prototype 依赖每类保留 Exemplar 的特征均值。本页从“完整新类数据暂时可用、长期记忆有限”这个条件出发，推导怎样选样并保存有序列表。</p>
      </header>

      <P4Prelude onInspect={focusWorkbench} onPlayAll={playAll} reducedMotion={reducedMotion} />

      <section
        className="p4-workbench"
        aria-label="Herding 同屏教学工作台"
        data-phase={clip.id}
        data-clip={clip.id}
        data-kind={clip.kind}
        data-round={clip.round}
        data-clip-duration-ms={clip.durationMs}
        data-progress={state.progress.toFixed(3)}
        data-phase-group={activePhaseIndex + 1}
        data-phase-progress={phaseProgress.toFixed(3)}
        data-phase-complete={phaseComplete.toString()}
        data-current-candidate-id={candidate?.point.id ?? ""}
        data-scored-candidate-ids={round?.candidates.filter((item) => scene.barProgress(item.point.id) > 0.98).map((item) => item.point.id).join(",") ?? ""}
        data-memory-slot-count={slotCount}
        data-memory-slot-quota={scene.budget?.tailState === "removed" ? scene.budget.visiblePrefixCount : HERDING_DEMO_QUOTA}
        data-prefix-count={scene.visiblePrefixCount}
        data-prefix-index={scene.reviewIndex ?? ""}
        data-prefix-entry-index={scene.review?.introducedPrefixIndex ?? ""}
        data-prefix-entry-progress={scene.review?.arrivalProgress.toFixed(3) ?? ""}
        data-tail-state={scene.budget?.tailState ?? ""}
        data-tail-opacity={scene.budget?.tailOpacity.toFixed(3) ?? ""}
        data-quota-change-progress={scene.budget?.quotaChangeProgress.toFixed(3) ?? ""}
        data-status={state.status}
        data-clip-ids={clips.map((item) => item.id).join(",")}
        ref={workbenchRef}
      >
        <header className="p4-workbench__heading">
          <div>
            <span className="eyebrow">
              {activePhaseIndex === 0
                ? "BUILD THE CLASS TARGET"
                : activePhaseIndex <= 4
                  ? `HERDING · ROUND ${activePhaseIndex}`
                  : "REVIEW THE ORDERED MEMORY"}
              {" · 阶段 "}{activePhaseIndex + 1} / {phaseRanges.length}
            </span>
            <h2>{stablePhaseTitle(activePhaseIndex, clip)}</h2>
            <p aria-live="polite"><strong>当前动作：</strong>{currentAction}</p>
          </div>
          <span className="p4-workbench__phase">
            {phaseComplete ? "阶段完成" : `${Math.round(phaseProgress * 100)}%`}
          </span>
        </header>

        {orderedMemoryMode ? (
          <OrderedMemoryStage
            scene={scene}
            reviewNarrative={reviewNarrative}
            onSelectPrefix={(index) => {
              setManualReviewIndex(index);
              controls.goToClip(clipIndexById.get("review-prefix") ?? 0, { autoPlay: false });
            }}
          />
        ) : (
          <div className="p4-workbench__layout">
          <section className="panel p4-visual-panel">
            <div className="p4-panel-title">
              <div><span className="eyebrow">ONE FIXED FEATURE SPACE</span><h3>目标、候选与当前前缀</h3></div>
              <span>扫描顺序：从 a8 顺时针</span>
            </div>
            <div className="p4-visual-body">
              <div className="p4-canvas">
                <HerdingScene scene={scene} />
              </div>
              <DistanceRuler scene={scene} />
            </div>
            <div className="p4-legend" aria-label="图形标记说明">
              <span><i className="p4-legend-point" />单位特征</span>
              <span><i className="p4-legend-target">★</i>完整类别目标 μ<sub>full</sub></span>
              <span><i className="p4-legend-contribution" />贡献副本</span>
              <span><i className="p4-legend-mean" />当前前缀均值</span>
              <span><i className="p4-legend-score" />到目标的比较距离</span>
              <span><i className="p4-legend-scan" />顺时针扫描环</span>
            </div>
          </section>

          <aside className="panel p4-guidance-panel" aria-live="polite">
            <div className="p4-panel-title">
              <div>
                <span className="eyebrow">CURRENT CALCULATION</span>
                <h3>{clip.round <= 4 ? `第 ${clip.round || 0} 轮 · ${clip.kind === "commit" ? "已选结果" : clip.kind === "scan" ? "扫描候选" : "计算前缀均值"}` : clip.kind === "review" ? "有序前缀" : "固定总预算 K"}</h3>
              </div>
              {round ? <span className="p4-k-badge">k = {round.k}</span> : null}
            </div>
            <div className="p4-current-formula" aria-label="当前公式">{CurrentFormula({ scene })}</div>
            <div className="p4-memory-heading"><b>有序 Exemplars</b><span>{slotCount} / {scene.budget?.tailState === "removed" ? scene.budget.visiblePrefixCount : HERDING_DEMO_QUOTA}</span></div>
            <Slots count={scene.slotCount} budget={scene.budget} review={scene.review} />
            {clip.kind === "review" ? (
              <div className="p4-prefix-picker" role="group" aria-label="切换要回看的 Herding 前缀长度">
                {ROUNDS.map((item) => (
                  <button key={item.k} type="button" aria-pressed={scene.reviewIndex === item.k} onClick={() => {
                    setManualReviewIndex(item.k);
                    controls.goToClip(clipIndexById.get("review-prefix") ?? 0, { autoPlay: false });
                  }}>
                    前 {item.k} 项
                  </button>
                ))}
              </div>
            ) : null}
            {clip.kind === "budget" ? (
              <div
                className="p4-budget-change"
                data-budget-state={scene.budget?.tailState ?? "steady"}
                style={{ "--quota-change-fill": `${(scene.budget?.quotaChangeProgress ?? 0) * 100}%` } as CSSProperties}
              >
                <span>总容量 K = 12</span>
                <b>3 类 × 4 项 <i>→</i> 4 类 × 3 项</b>
                <small>{scene.budget?.tailState === "removed"
                  ? "p₄ = a5 已离开尾槽；前三项顺序不变，P′=[p₁,p₂,p₃]，当前结果切换为真实前缀 ν₃。"
                  : scene.budget?.tailState === "removing"
                    ? "仅尾项 p₄ = a5 正从列表退出；前三项保持不变。退出完成前，当前列表与结果仍是 P=[p₁,p₂,p₃,p₄]、ν₄。"
                    : scene.budget?.tailState === "pending"
                      ? "K 保持 12；类别由 3 增至 4，每类配额从 4 降到 3。只标记尾项 p₄ = a5；当前仍为 ν₄。"
                      : "P4 独立预算示例：当前有序列表 P=[p₁,p₂,p₃,p₄]，结果为 ν₄；名额由 3 类各 4 项调整为 4 类各 3 项。"}</small>
              </div>
            ) : null}
            {clip.kind === "commit" && clip.round === 4 ? (
              <p className="p4-commit-note">
                胜出项来自全部未选候选的实际分数：{round?.chosen.id} 的 ν<sub>{clip.round}</sub> 离 μ<sub>full</sub> 最近。贪心选择不保证固定长度下的全局最优。
              </p>
            ) : null}
          </aside>
          </div>
        )}

        <div className="p4-workbench__controls" aria-label="Page 4 动画控制">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={() => jumpToPhase(activePhaseIndex - 1)} disabled={activePhaseIndex === 0}>← 上一阶段</button>
          <button type="button" className="icarl-button icarl-button--primary" onClick={togglePlayback} disabled={reducedMotion}>{reducedMotion ? "逐步查看" : state.status === "playing" ? "Ⅱ 暂停" : state.elapsedMs > 0 && !phaseComplete ? "▶ 继续播放" : "▶ 播放本阶段"}</button>
          <div className="p4-workbench__control-center">
            <button type="button" className="icarl-button icarl-button--quiet" onClick={replayPhase} disabled={reducedMotion}>↺ 重播本阶段</button>
            <button type="button" className="icarl-button icarl-button--quiet" onClick={playAll} disabled={reducedMotion}>▶ 完整播放</button>
            <span aria-live="polite">阶段 {activePhaseIndex + 1} / {phaseRanges.length} · {playMode === "all" ? "全程" : "本阶段"} · {Math.round(phaseProgress * 100)}%</span>
          </div>
          <button type="button" className="icarl-button icarl-button--quiet" onClick={() => jumpToPhase(activePhaseIndex + 1)} disabled={activePhaseIndex >= phaseRanges.length - 1}>下一阶段 →</button>
        </div>

        <div className="p4-phase-rail" role="group" aria-label="七个教学阶段">
          {phaseRanges.map((entry, index) => {
            const currentGroup = entry.group;
            const activeGroup = phaseRanges[activePhaseIndex].group;
            return (
              <button
                key={entry.id}
                type="button"
                className={currentGroup === activeGroup ? "is-current" : currentGroup < activeGroup ? "is-complete" : ""}
                aria-pressed={currentGroup === activeGroup}
                onClick={() => jumpToPhase(index)}
              >
                <b>{String(currentGroup + 1).padStart(2, "0")}</b>{entry.label}
              </button>
            );
          })}
        </div>
      </section>

      <details className="p4-calculation-details">
        <summary>查看精确坐标与逐轮距离记录</summary>
        <p>
          完整类别原始均值：({HERDING_DEMO_TARGET_RAW[0].toFixed(3)}, {HERDING_DEMO_TARGET_RAW[1].toFixed(3)})；
          单位目标 μ<sub>full</sub>：({HERDING_DEMO_TARGET[0].toFixed(3)}, {HERDING_DEMO_TARGET[1].toFixed(3)})。
          图中全部向量共用等距线性投影，因此两点间的显示长度与同尺度距离尺对应；每轮均值由真实有序前缀计算，再按公式单位化。
        </p>
        {ROUNDS.map((item) => (
          <details key={item.k}>
            <summary>第 {item.k} 轮 · p{item.k} = {item.chosen.id} · {item.candidates.length} 个未选候选</summary>
            <div className="p4-score-table" role="table" aria-label={`第 ${item.k} 轮按扫描顺序排列的候选坐标与距离`}>
              <div className="p4-score-table__head" role="row"><span>顺序</span><span>候选</span><span>原始前缀均值</span><span>单位化前缀均值</span><span>距离</span></div>
              {candidatesInScanOrder(item.candidates).map((entry, index) => (
                <div role="row" key={entry.point.id} className={entry.point.id === item.chosen.id ? "is-chosen" : ""}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{entry.point.id}{entry.point.id === item.chosen.id ? " · 选中" : ""}</span>
                  <span>({entry.rawPrefixMean[0].toFixed(3)}, {entry.rawPrefixMean[1].toFixed(3)})</span>
                  <span>({entry.normalizedPrefixMean[0].toFixed(3)}, {entry.normalizedPrefixMean[1].toFixed(3)})</span>
                  <span>{entry.score.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </details>

      <details className="p4-pseudocode">
        <summary>查看简短算法步骤</summary>
        <div>
          <code>目标：μ<sub>full</sub> ← normalize(mean({`{ normalize(φ(x)) | x ∈ X_y }`}))</code>
          <code>对 k = 1…m，固定已有前缀 P<sub>k−1</sub></code>
          <code>对每个未选 x，计算 ν<sub>k</sub>(x) = normalize(mean(z(P<sub>k−1</sub>) ∪ z(x)))</code>
          <code>追加距离 μ<sub>full</sub> 最小的候选；每轮只追加一个样本</code>
        </div>
      </details>

      <section className="p4-next-step" aria-label="第 4 页到第 5 页的学习衔接">
        <div className="p4-next-step__list" aria-hidden="true"><span>p₁</span><span>p₂</span><span>p₃</span><span>p₄</span><svg viewBox="0 0 52 24"><path d="M2 12h43m-8-7 8 7-8 7" /></svg><b>D</b></div>
        <p>
          <strong><b>本页结论</b>Herding 得到的是有顺序、可裁剪的代表列表。</strong>
          <span><b>还缺什么</b>只把旧类图片留在记忆中还不够；新类到来后，模型仍要继续更新参数。</span>
          <span><b>下一页问题</b>旧类记忆怎样重新进入训练，而不只用于预测？</span>
        </p>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>让 Exemplars 参与更新 →</button> : null}
      </section>
    </article>
  );
}
