import { HERDING_DEMO_ROUNDS } from "./herding-teaching-demo";
import type { Vector2 } from "./icarl-runtime";

export type PrefixReviewState = {
  visiblePrefixCount: number;
  activePrefixIndex: number;
  introducedPrefixIndex: number;
  fromPrefixIndex: number;
  targetPrefixIndex: number;
  markerProgress: number;
  arrivalProgress: number;
  transitionProgress: number;
  handoffProgress: number;
  currentPrefixPoint: Vector2;
  lineOpacity: number;
};

export type BudgetTailState = "steady" | "pending" | "removing" | "removed";

export type BudgetState = PrefixReviewState & {
  pendingPrefixIndex: number | null;
  pendingPrefixProgress: number;
  quotaChangeProgress: number;
  tailOpacity: number;
  tailDisplacement: number;
  tailState: BudgetTailState;
};

const REVIEW_INTRO_END = 0.1125;
const REVIEW_ENTRY_ENDS = [0.2625, 0.45, 0.6375, 0.825] as const;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function prefixPoint(index: number): Vector2 {
  return HERDING_DEMO_ROUNDS[index - 1].normalizedPrefixMean;
}

function makePrefixState(
  fromPrefixIndex: number,
  targetPrefixIndex: number,
  markerProgress: number,
  visiblePrefixCount: number,
  arrivalProgress = 1,
  transitionProgress = 1,
  handoffProgress = 0,
): PrefixReviewState {
  const progress = clamp01(markerProgress);
  const activePrefixIndex = targetPrefixIndex;
  return {
    visiblePrefixCount,
    activePrefixIndex,
    introducedPrefixIndex: targetPrefixIndex,
    fromPrefixIndex,
    targetPrefixIndex,
    markerProgress: progress,
    arrivalProgress: clamp01(arrivalProgress),
    transitionProgress: clamp01(transitionProgress),
    handoffProgress: clamp01(handoffProgress),
    currentPrefixPoint: prefixPoint(activePrefixIndex),
    lineOpacity: 0.24 + progress * 0.7,
  };
}

/** Derives the automatic review state from the timeline; manual selection pins an exact result. */
export function reviewAt(progress: number, manualReviewIndex: number | null = null): PrefixReviewState {
  if (manualReviewIndex !== null) {
    const selected = Math.max(1, Math.min(HERDING_DEMO_ROUNDS.length, Math.round(manualReviewIndex)));
    return makePrefixState(selected, selected, 1, selected);
  }

  const p = clamp01(progress);
  if (p < REVIEW_INTRO_END) {
    return makePrefixState(1, 1, 1, 1, 0, ease(p / REVIEW_INTRO_END));
  }

  for (let target = 1; target <= HERDING_DEMO_ROUNDS.length; target += 1) {
    const start = target === 1 ? REVIEW_INTRO_END : REVIEW_ENTRY_ENDS[target - 2];
    const end = REVIEW_ENTRY_ENDS[target - 1];
    if (p < end) {
      const arrival = ease((p - start) / (end - start));
      return makePrefixState(target - 1, target, arrival, target, arrival, 1);
    }
  }

  return makePrefixState(4, 4, 1, 4, 1, 1, ease((p - REVIEW_ENTRY_ENDS[3]) / (1 - REVIEW_ENTRY_ENDS[3])));
}

/** Shows p₄ leaving its slot while preserving all candidate and prefix coordinates. */
export function budgetAt(progress: number): BudgetState {
  const p = clamp01(progress);
  const quotaChangeProgress = ease((p - 0.214) / (0.386 - 0.214));
  const tailMotion = ease((p - 0.514) / (0.743 - 0.514));
  const tailState: BudgetTailState = p < 0.214 ? "steady" : p < 0.514 ? "pending" : p < 0.743 ? "removing" : "removed";
  const isRemoved = tailState === "removed";
  const prefix = isRemoved
    ? makePrefixState(4, 3, 1, 3)
    : makePrefixState(4, 4, 1, 4);
  return {
    ...prefix,
    pendingPrefixIndex: p >= 0.214 && !isRemoved ? 3 : null,
    pendingPrefixProgress: p < 0.386 ? 0 : p < 0.514 ? ease((p - 0.386) / (0.514 - 0.386)) : isRemoved ? 0 : 1,
    quotaChangeProgress,
    tailOpacity: 1 - tailMotion,
    tailDisplacement: 118 * tailMotion,
    tailState,
  };
}
