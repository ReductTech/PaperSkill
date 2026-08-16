import { describe, expect, it } from 'vitest';
import {
  beginDirectManipulation,
  endDirectManipulation,
  logProgressToCorpusSize,
  pointerToProgress,
} from './useContinuousControl';

describe('continuous controls', () => {
  it('maps a pointer to a clamped normalized position', () => {
    expect(pointerToProgress(50, { left: 0, width: 100 })).toBe(0.5);
    expect(pointerToProgress(-10, { left: 0, width: 100 })).toBe(0);
    expect(pointerToProgress(120, { left: 0, width: 100 })).toBe(1);
  });

  it('maps the continuous slider to a logarithmic corpus size', () => {
    expect(logProgressToCorpusSize(0)).toBe(100);
    expect(logProgressToCorpusSize(1)).toBe(50_000);
    expect(logProgressToCorpusSize(0.5)).toBeCloseTo(Math.sqrt(100 * 50_000), 0);
  });

  it('keeps direct manipulation ownership after pointer release', () => {
    const dragging = beginDirectManipulation({ owner: 'timeline', dragging: false });
    expect(dragging).toEqual({ owner: 'pointer', dragging: true });
    expect(endDirectManipulation(dragging)).toEqual({ owner: 'manual', dragging: false });
  });
});
