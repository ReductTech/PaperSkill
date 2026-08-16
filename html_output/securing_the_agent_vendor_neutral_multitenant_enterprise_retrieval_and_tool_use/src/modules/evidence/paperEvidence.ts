export const PAPER_EVIDENCE = {
  security: {
    ctlr: [100, 0, 98, 0],
    avr: [50, 0, 50, 0],
  },
  injectionLeaks: [72, 0, 56, 0],
  quality: {
    precisionAt5: [0.2, 0.433],
    mrr: [0.7, 1],
  },
  qpsAt25: [5.4, 4.2, 2.2, 2.6],
  gatedSearchOverhead: { valueMs: 19, approximate: true },
  serverSideOrchestrationOverhead: {
    valueSeconds: 3,
    approximate: true,
    protocol: 'non-streaming Responses API tool execution round-trip',
  },
  postFilter: [
    { corpusSize: 100, recallAt5: 1, overheadMs: 0.74 },
    { corpusSize: 1_000, recallAt5: 0.1, overheadMs: 0.79 },
    { corpusSize: 10_000, recallAt5: 0.01, overheadMs: 1 },
    { corpusSize: 50_000, recallAt5: 0.002, overheadMs: 2.95 },
  ],
} as const;

export interface InterpolatedValue {
  value: number;
  approximate: boolean;
}

export function recallAtCorpusSize(corpusSize: number): InterpolatedValue {
  const anchors = PAPER_EVIDENCE.postFilter;
  const clamped = Math.max(anchors[0].corpusSize, Math.min(anchors[anchors.length - 1].corpusSize, corpusSize));
  const exact = anchors.find((point) => point.corpusSize === clamped);
  if (exact) return { value: exact.recallAt5, approximate: false };

  const rightIndex = anchors.findIndex((point) => point.corpusSize > clamped);
  const left = anchors[rightIndex - 1];
  const right = anchors[rightIndex];
  const segmentProgress =
    (Math.log10(clamped) - Math.log10(left.corpusSize)) /
    (Math.log10(right.corpusSize) - Math.log10(left.corpusSize));
  const value = 10 ** (
    Math.log10(left.recallAt5) +
    (Math.log10(right.recallAt5) - Math.log10(left.recallAt5)) * segmentProgress
  );
  return { value, approximate: true };
}

export function overheadAtCorpusSize(corpusSize: number): InterpolatedValue {
  const anchors = PAPER_EVIDENCE.postFilter;
  const clamped = Math.max(anchors[0].corpusSize, Math.min(anchors[anchors.length - 1].corpusSize, corpusSize));
  const exact = anchors.find((point) => point.corpusSize === clamped);
  if (exact) return { value: exact.overheadMs, approximate: false };

  const rightIndex = anchors.findIndex((point) => point.corpusSize > clamped);
  const left = anchors[rightIndex - 1];
  const right = anchors[rightIndex];
  const segmentProgress =
    (Math.log10(clamped) - Math.log10(left.corpusSize)) /
    (Math.log10(right.corpusSize) - Math.log10(left.corpusSize));
  return {
    value: left.overheadMs + (right.overheadMs - left.overheadMs) * segmentProgress,
    approximate: true,
  };
}
