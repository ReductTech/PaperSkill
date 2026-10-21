import {
  INCOMING_CLASS_IDS,
  MEMORY_BUDGET,
  NEXT_QUOTA,
  OLD_CLASS_IDS,
  P_AFTER,
  P_BEFORE,
} from "./icarl-runtime";

export type P9MemoryPhase = "inherited" | "marking" | "marked" | "removing" | "slots-freed" | "selecting" | "submitted";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const P9_MEMORY_REPLAY_DURATION_MS = 7500;
const INITIAL_HOLD_MS = 400;
const MARK_START_MS = INITIAL_HOLD_MS;
const MARK_SAMPLE_MS = 200;
const MARK_END_MS = MARK_START_MS + MARK_SAMPLE_MS * OLD_CLASS_IDS.reduce((count, classId) => count + P_BEFORE[classId].length - NEXT_QUOTA, 0);
const MARKED_PAUSE_MS = 500;
const REMOVE_START_MS = MARK_END_MS + MARKED_PAUSE_MS;
const REMOVE_SAMPLE_MS = 540;
const REMOVE_END_MS = REMOVE_START_MS + REMOVE_SAMPLE_MS * OLD_CLASS_IDS.reduce((count, classId) => count + P_BEFORE[classId].length - NEXT_QUOTA, 0);
const FREED_PAUSE_MS = 500;
const SELECTING_START_MS = REMOVE_END_MS + FREED_PAUSE_MS;
const NEW_SAMPLE_MS = 270;
const SELECTING_END_MS = SELECTING_START_MS + NEW_SAMPLE_MS * INCOMING_CLASS_IDS.reduce((count, classId) => count + P_AFTER[classId].length, 0);

export function p9MemoryTimelineAt(progress: number) {
  const normalizedProgress = clamp(progress);
  const timeMs = normalizedProgress * P9_MEMORY_REPLAY_DURATION_MS;
  const removedOldSampleCount = OLD_CLASS_IDS.reduce((count, classId) => count + P_BEFORE[classId].slice(NEXT_QUOTA).filter((_sample, tailIndex) => {
    const oldClassIndex = OLD_CLASS_IDS.indexOf(classId);
    const orderIndex = oldClassIndex * (P_BEFORE[classId].length - NEXT_QUOTA) + tailIndex;
    const removalProgress = clamp((timeMs - REMOVE_START_MS - orderIndex * REMOVE_SAMPLE_MS) / REMOVE_SAMPLE_MS);
    return removalProgress >= 1;
  }).length, 0);
  const oldClasses = OLD_CLASS_IDS.map((classId, classIndex) => {
    const tailCount = P_BEFORE[classId].length - NEXT_QUOTA;
    const samples = P_BEFORE[classId].map((sample, sampleIndex) => {
      if (sampleIndex < NEXT_QUOTA) return { sample, markedProgress: 0, removalProgress: 0, marked: false, removed: false };
      const orderIndex = classIndex * tailCount + sampleIndex - NEXT_QUOTA;
      const markedProgress = clamp((timeMs - MARK_START_MS - orderIndex * MARK_SAMPLE_MS) / MARK_SAMPLE_MS);
      const removalProgress = clamp((timeMs - REMOVE_START_MS - orderIndex * REMOVE_SAMPLE_MS) / REMOVE_SAMPLE_MS);
      return { sample, markedProgress, removalProgress, marked: markedProgress > 0, removed: removalProgress >= 1 };
    });
    const removedCount = samples.filter((item) => item.removed).length;
    return {
      classId,
      samples,
      removedCount,
      retainedCount: P_BEFORE[classId].length - removedCount,
    };
  });
  const incomingClasses = INCOMING_CLASS_IDS.map((classId, classIndex) => {
    const samples = P_AFTER[classId].map((sample, sampleIndex) => {
      const orderIndex = classIndex * P_AFTER[classId].length + sampleIndex;
      const arrivalProgress = clamp((timeMs - SELECTING_START_MS - orderIndex * NEW_SAMPLE_MS) / NEW_SAMPLE_MS);
      return { sample, arrivalProgress, selected: arrivalProgress >= 1 };
    });
    const selectedCount = samples.filter((item) => item.selected).length;
    return { classId, samples, selectionProgress: Math.max(0, ...samples.map((item) => item.arrivalProgress)), selectedCount };
  });
  const oldRetainedCount = oldClasses.reduce((count, item) => count + item.retainedCount, 0);
  const newSelectedCount = incomingClasses.reduce((count, item) => count + item.selectedCount, 0);
  const markedOldSampleCount = oldClasses.reduce((count, item) => count + item.samples.filter((sample) => sample.marked).length, 0);
  const fullyMarkedOldSampleCount = oldClasses.reduce((count, item) => count + item.samples.filter((sample) => sample.markedProgress >= 1).length, 0);
  const phase: P9MemoryPhase = timeMs >= SELECTING_END_MS
    ? "submitted"
    : timeMs >= SELECTING_START_MS
      ? "selecting"
      : timeMs >= REMOVE_END_MS
        ? "slots-freed"
        : timeMs >= REMOVE_START_MS
          ? "removing"
          : timeMs >= MARK_END_MS
            ? "marked"
            : timeMs >= MARK_START_MS
              ? "marking"
              : "inherited";

  return {
    progress: normalizedProgress,
    timeMs,
    phase,
    oldClasses,
    incomingClasses,
    markedOldSampleCount,
    fullyMarkedOldSampleCount,
    removedOldSampleCount,
    oldRetainedCount,
    newSelectedCount,
    candidateCount: oldRetainedCount + newSelectedCount,
    freedSlotCount: OLD_CLASS_IDS.reduce((count, classId) => count + P_BEFORE[classId].length - NEXT_QUOTA, 0),
    budget: MEMORY_BUDGET,
    timing: { initialHoldMs: INITIAL_HOLD_MS, markStartMs: MARK_START_MS, markEndMs: MARK_END_MS, removeStartMs: REMOVE_START_MS, removeEndMs: REMOVE_END_MS, selectingStartMs: SELECTING_START_MS, selectingEndMs: SELECTING_END_MS },
  };
}
