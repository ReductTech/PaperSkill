import type { Sample } from "./icarl-runtime";

export type SnapshotWriteProgress = {
  completedIds: readonly string[];
  activeSampleId: string | null;
  activeCellProgress: readonly number[];
};

/** Derive row and cell progress from the current clip's ordered sample list and local clock. */
export function snapshotWriteProgress(
  samples: readonly Sample[],
  elapsedMs: number,
  options: { startMs?: number; rowTravelMs: number; rowHoldMs?: number; cellCount?: number },
): SnapshotWriteProgress {
  const startMs = options.startMs ?? 0;
  const rowTravelMs = Math.max(1, options.rowTravelMs);
  const rowHoldMs = Math.max(0, options.rowHoldMs ?? 0);
  const cellCount = Math.max(1, Math.floor(options.cellCount ?? 3));
  const stepMs = rowTravelMs + rowHoldMs;
  const localElapsed = elapsedMs - startMs;
  const completedIds: string[] = [];

  samples.forEach((sample, index) => {
    if (localElapsed >= index * stepMs + rowTravelMs) {
      completedIds.push(sample.id);
    }
  });

  const activeIndex = localElapsed >= 0 && localElapsed < samples.length * stepMs
    ? Math.floor(localElapsed / stepMs)
    : -1;
  const activeSample = activeIndex >= 0 ? samples[activeIndex] : null;
  const rowElapsed = activeIndex >= 0 ? localElapsed - activeIndex * stepMs : 0;
  const rowProgress = activeIndex >= 0 ? Math.min(1, Math.max(0, rowElapsed / rowTravelMs)) : 0;

  const activeCellProgress = activeIndex < 0
    ? []
    : Array.from({ length: cellCount }, (_, index) => Math.min(1, Math.max(0, rowProgress * cellCount - index)));

  return {
    completedIds,
    activeSampleId: activeSample?.id ?? null,
    activeCellProgress,
  };
}
