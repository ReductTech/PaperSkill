import { describe, expect, it } from 'vitest';
import { shouldRenderSupplementary } from './App';

describe('supplementary material loading', () => {
  it('does not mount external video media while the disclosure is closed', () => {
    expect(shouldRenderSupplementary(false, 3)).toBe(false);
    expect(shouldRenderSupplementary(true, 3)).toBe(true);
    expect(shouldRenderSupplementary(true, 0)).toBe(false);
  });
});
