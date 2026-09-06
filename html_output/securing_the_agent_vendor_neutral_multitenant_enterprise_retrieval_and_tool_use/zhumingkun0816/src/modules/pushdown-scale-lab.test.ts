import { describe, expect, it } from 'vitest';
import {
  deriveCandidateCompetition,
  deriveModeMix,
  derivePushdownScaleDisplayMetrics,
  derivePushdownScaleScene,
  deriveResultTokenMotion,
  preserveScaleModeOnCorpusDrag,
  type ScaleModeTransition,
} from './pushdown-scale-lab';

describe('post-filter scaling scene', () => {
  it.each([
    [100, 1, 0.74],
    [1_000, 0.1, 0.79],
    [10_000, 0.01, 1],
    [50_000, 0.002, 2.95],
  ] as const)('preserves the exact paper anchor at N=%s', (corpusSize, recall, overhead) => {
    const scene = derivePushdownScaleScene(1, corpusSize, 'post');
    expect(scene.recall).toBe(recall);
    expect(scene.overheadMs).toBe(overhead);
    expect(scene.approximate).toBe(false);
  });

  it('labels values between measured anchors as interpolation', () => {
    const scene = derivePushdownScaleScene(0.5, 5_000, 'post');
    expect(scene.approximate).toBe(true);
    expect(scene.interpolationLabel).toBe('视觉插值；锚点为论文实测');
  });

  it('is monotonic across the complete corpus range', () => {
    const sizes = [100, 500, 1_000, 5_000, 10_000, 25_000, 50_000];
    const recalls = sizes.map((size) => derivePushdownScaleScene(1, size, 'post').recall);
    expect(recalls.every((value, index) => index === 0 || value <= recalls[index - 1])).toBe(true);
  });

  it('does not fabricate a universal pushdown latency', () => {
    const scene = derivePushdownScaleScene(1, 50_000, 'pushdown');
    expect(scene.recall).toBe(1);
    expect(scene.ctlr).toBe(0);
    expect(scene).not.toHaveProperty('pushdownLatencyMs');
    expect(scene.overheadMs).toBeNull();
  });

  it('keeps the selected filtering mode while corpus size is dragged', () => {
    expect(preserveScaleModeOnCorpusDrag('post', 0.73)).toEqual({ mode: 'post', corpusProgress: 0.73 });
    expect(preserveScaleModeOnCorpusDrag('pushdown', 0.21)).toEqual({ mode: 'pushdown', corpusProgress: 0.21 });
  });

  it('keeps 25 candidate positions and 5 result positions at every corpus size', () => {
    [0, 0.25, 0.5, 0.75, 1].forEach((corpusProgress) => {
      const competition = deriveCandidateCompetition(corpusProgress, 0);
      expect(competition.candidates).toHaveLength(25);
      expect(competition.results).toHaveLength(5);
      expect(new Set(competition.candidates.map((token) => token.id)).size).toBe(25);
    });
  });

  it('derives fractional token state instead of rounded candidate counts', () => {
    const competition = deriveCandidateCompetition(0.5, 0);
    expect(competition.candidates.some((token) => token.financeMix > 0 && token.financeMix < 1)).toBe(true);
    expect(competition.results.some((token) => token.financeMix > 0 && token.financeMix < 1)).toBe(true);
  });

  it('restores the same candidate state when progress is reversed', () => {
    const early = deriveCandidateCompetition(0.24, 0);
    deriveCandidateCompetition(0.9, 1);
    expect(deriveCandidateCompetition(0.24, 0)).toEqual(early);
  });

  it('morphs filter position continuously in both directions', () => {
    const forward: ScaleModeTransition = { from: 'post', to: 'pushdown' };
    const backward: ScaleModeTransition = { from: 'pushdown', to: 'post' };
    expect(deriveModeMix(forward, 0)).toBe(0);
    expect(deriveModeMix(forward, 0.5)).toBeGreaterThan(0);
    expect(deriveModeMix(forward, 0.5)).toBeLessThan(1);
    expect(deriveModeMix(forward, 1)).toBe(1);
    expect(deriveModeMix(backward, 0)).toBe(1);
    expect(deriveModeMix(backward, 1)).toBe(0);
  });

  it('contracts the filter marker while it travels beside the candidate grid', () => {
    const start = deriveCandidateCompetition(0.5, 0);
    const middle = deriveCandidateCompetition(0.5, 0.5);
    const end = deriveCandidateCompetition(0.5, 1);
    expect(middle.filterWidth).toBeLessThan(start.filterWidth);
    expect(middle.filterX).toBeGreaterThan(start.filterX);
    expect(end.filterWidth).toBe(start.filterWidth);
    expect(end.filterY).toBeLessThan(start.filterY);
  });

  it('preserves corpus progress while the mode target changes', () => {
    const before = preserveScaleModeOnCorpusDrag('post', 0.417);
    expect(before.corpusProgress).toBe(0.417);
    expect({ ...before, mode: 'pushdown' }).toEqual({ mode: 'pushdown', corpusProgress: 0.417 });
  });

  it('keeps mechanism state explicitly illustrative', () => {
    expect(deriveCandidateCompetition(1, 0).illustrative).toBe(true);
  });

  it('keeps the post-filter evidence available during pushdown comparison', () => {
    const scene = derivePushdownScaleScene(1, 50_000, 'pushdown');
    expect(scene.recall).toBe(1);
    expect(scene.postFilterRecall).toBe(0.002);
    expect(scene.overheadMs).toBeNull();
  });

  it('marks non-anchor post-filter evidence as interpolation during pushdown comparison', () => {
    const scene = derivePushdownScaleScene(1, 1_335, 'pushdown');
    expect(scene.postFilterApproximate).toBe(true);
  });

  it('separates outgoing denial and incoming Finance glyphs during the result morph', () => {
    const motion = deriveResultTokenMotion(0.5);
    expect(motion.deniedX).toBeGreaterThan(motion.financeX);
    expect(motion.deniedY).toBeGreaterThan(motion.financeY);
    expect(motion.deniedOpacity).toBe(0.5);
    expect(motion.financeOpacity).toBe(0.5);
  });

  it('keeps the moving filter outside every candidate token across the complete morph', () => {
    for (let step = 0; step <= 100; step += 1) {
      const competition = deriveCandidateCompetition(0.5, step / 100);
      const filter = {
        left: competition.filterX,
        right: competition.filterX + competition.filterWidth,
        top: competition.filterY,
        bottom: competition.filterY + 24,
      };
      competition.candidates.forEach((token) => {
        const intersects = filter.left < token.x + 5
          && filter.right > token.x - 5
          && filter.top < token.y + 5
          && filter.bottom > token.y - 5;
        expect(intersects).toBe(false);
      });
    }
  });

  it('scales the smallest Canvas labels to a desktop-readable size', () => {
    const metrics = derivePushdownScaleDisplayMetrics();
    expect(metrics.logicalWidth).toBe(560);
    expect(metrics.maxDisplayWidth).toBe(820);
    expect(metrics.scale).toBeGreaterThan(1.4);
    expect(metrics.minimumDisplayedFontPx).toBeGreaterThanOrEqual(11.5);
  });
});
