import { describe, expect, it } from 'vitest';
import { PAPER_EVIDENCE, recallAtCorpusSize } from './paperEvidence';

describe('paper evidence', () => {
  it('keeps every measured post-filter recall anchor exact', () => {
    expect(PAPER_EVIDENCE.postFilter).toEqual([
      { corpusSize: 100, recallAt5: 1, overheadMs: 0.74 },
      { corpusSize: 1_000, recallAt5: 0.1, overheadMs: 0.79 },
      { corpusSize: 10_000, recallAt5: 0.01, overheadMs: 1 },
      { corpusSize: 50_000, recallAt5: 0.002, overheadMs: 2.95 },
    ]);
  });

  it('marks values between measured anchors as visual interpolation', () => {
    expect(recallAtCorpusSize(1_000)).toEqual({ value: 0.1, approximate: false });
    const between = recallAtCorpusSize(5_000);
    expect(between.approximate).toBe(true);
    expect(between.value).toBeLessThan(0.1);
    expect(between.value).toBeGreaterThan(0.01);
  });

  it('keeps the paper result matrix immutable and exact', () => {
    expect(PAPER_EVIDENCE.security.ctlr).toEqual([100, 0, 98, 0]);
    expect(PAPER_EVIDENCE.security.avr).toEqual([50, 0, 50, 0]);
    expect(PAPER_EVIDENCE.injectionLeaks).toEqual([72, 0, 56, 0]);
    expect(PAPER_EVIDENCE.qpsAt25).toEqual([5.4, 4.2, 2.2, 2.6]);
  });

  it('keeps the evaluated gated-search overhead explicitly approximate', () => {
    expect(PAPER_EVIDENCE.gatedSearchOverhead).toEqual({ valueMs: 19, approximate: true });
  });

  it('keeps the evaluated server path cost approximate and protocol-bound', () => {
    expect(PAPER_EVIDENCE.serverSideOrchestrationOverhead).toEqual({
      valueSeconds: 3,
      approximate: true,
      protocol: 'non-streaming Responses API tool execution round-trip',
    });
  });
});
