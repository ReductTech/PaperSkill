const bounded = (value: number) => Math.max(0, Math.min(1, value));
const windowProgress = (progress: number, start: number, end: number) =>
  bounded((bounded(progress) - start) / (end - start));

export type P9PredictionPhase = "encoding" | "prototypes" | "query" | "comparison" | "nearest";

export function p9PredictionTimelineAt(progress: number) {
  const boundedProgress = bounded(progress);
  const encodingProgress = windowProgress(boundedProgress, 0, 0.27);
  const prototypeProgress = windowProgress(boundedProgress, 0.28, 0.50);
  const prototypeCount = boundedProgress < 0.28
    ? 0
    : Math.min(6, Math.max(1, Math.ceil(prototypeProgress * 6)));
  const queryVisible = boundedProgress >= 0.52;
  const queryRevealProgress = queryVisible ? windowProgress(boundedProgress, 0.52, 0.67) : 0;
  const comparisonProgress = boundedProgress >= 0.69 ? windowProgress(boundedProgress, 0.69, 0.93) : 0;
  const comparisonsComplete = Math.min(6, Math.floor(comparisonProgress * 6 + 1e-9));
  const nearestHighlightActive = boundedProgress >= 0.94;
  const nearestHighlightProgress = nearestHighlightActive
    ? windowProgress(boundedProgress, 0.94, 1)
    : 0;

  let phase: P9PredictionPhase;
  if (boundedProgress < 0.28) phase = "encoding";
  else if (boundedProgress < 0.52) phase = "prototypes";
  else if (boundedProgress < 0.69) phase = "query";
  else if (boundedProgress < 0.94) phase = "comparison";
  else phase = "nearest";

  return {
    progress: boundedProgress,
    phase,
    encodingProgress,
    prototypeProgress,
    prototypeCount,
    queryVisible,
    queryRevealProgress,
    comparisonProgress,
    comparisonsComplete,
    nearestHighlightActive,
    nearestHighlightProgress,
  };
}
