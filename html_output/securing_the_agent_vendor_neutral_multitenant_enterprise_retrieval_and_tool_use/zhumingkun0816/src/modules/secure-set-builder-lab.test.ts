import { describe, expect, it } from 'vitest';
import { deriveSecureSetScene } from './secure-set-builder-lab';

describe('secure result set morph', () => {
  it.each([
    [63, ['finance-budget', 'engineering-incident', 'legal-contract', 'finance-travel']],
    [76, ['finance-budget', 'engineering-incident', 'legal-contract']],
    [86, ['finance-budget', 'legal-contract']],
    [95, ['legal-contract']],
  ] as const)('uses score >= threshold at %s', (threshold, expected) => {
    const scene = deriveSecureSetScene(1, threshold, false);
    expect(scene.documents.filter((doc) => doc.relevant).map((doc) => doc.id).sort()).toEqual([...expected].sort());
  });

  it('never places denied documents in the secure intersection', () => {
    const scene = deriveSecureSetScene(1, 55, false);
    const denied = scene.documents.filter((doc) => !doc.authorized);
    expect(denied.every((doc) => !doc.secure && doc.targetArea !== 'secure')).toBe(true);
    expect(scene.secureIds).toEqual(['finance-budget', 'finance-travel']);
  });

  it('changes Legal membership only when policy permits it', () => {
    const denied = deriveSecureSetScene(1, 90, false);
    const permitted = deriveSecureSetScene(1, 90, true);
    expect(denied.documents.find((doc) => doc.id === 'legal-contract')?.displayLabel).toBe('Legal · 并购合同 95');
    expect(denied.secureIds).not.toContain('legal-contract');
    expect(permitted.secureIds).toContain('legal-contract');
  });

  it('holds relevance before applying authorization', () => {
    const held = deriveSecureSetScene(0.58, 70, false);
    expect(held.phase).toBe('relevance-hold');
    expect(held.authorizedIds).toEqual([]);
    expect(held.secureIds).toEqual([]);
    expect(deriveSecureSetScene(0.72, 70, false).phase).toBe('authorize');
  });
});
