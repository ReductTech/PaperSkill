import type { Sample } from "./icarl-runtime";

const bounded = (value: number) => Math.max(0, Math.min(1, value));

export function p9TrainingAssemblyAt(
  progress: number,
  oldExemplars: readonly Sample[],
  incomingSamples: readonly Sample[],
  oldExampleId: string,
  incomingExampleId: string,
) {
  const boundedProgress = bounded(progress);
  const oldCopies = Math.round(boundedProgress * oldExemplars.length);
  const incomingCount = Math.round(boundedProgress * incomingSamples.length);
  const arrivedOldIds = new Set(oldExemplars.slice(0, oldCopies).map((sample) => sample.id));
  const arrivedIncomingIds = new Set(incomingSamples.slice(0, incomingCount).map((sample) => sample.id));

  return {
    oldCopies,
    incomingCount,
    assembledCount: oldCopies + incomingCount,
    oldExampleArrived: arrivedOldIds.has(oldExampleId),
    incomingExampleArrived: arrivedIncomingIds.has(incomingExampleId),
  };
}
