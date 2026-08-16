import { describe, expect, it } from 'vitest';
import { deriveRelevanceLeakScene, RELEVANCE_LIST_LAYOUT } from './relevance-leak-lab';

describe('relevance-only leakage scene', () => {
  it('uses clearly illustrative similarity and ranks continuously', () => {
    const scene = deriveRelevanceLeakScene(0.4, 0.92);
    expect(scene.illustrativeSimilarity).toBe(true);
    expect(scene.ranking[0]).toMatchObject({ id: 'legal-contract', tenant: 'Legal' });
    expect(scene.ranking[0].similarity).toBeCloseTo(1, 6);
  });

  it('keeps soft row positions continuous across a rank crossing', () => {
    const before = deriveRelevanceLeakScene(0.4, 0.3495);
    const after = deriveRelevanceLeakScene(0.4, 0.3505);
    const beforeIncident = before.documents.find((doc) => doc.id === 'engineering-incident')!;
    const afterIncident = after.documents.find((doc) => doc.id === 'engineering-incident')!;
    expect(Math.abs(afterIncident.rowY - beforeIncident.rowY)).toBeLessThan(2);
  });

  it('keeps every animated row below the list heading and inside the list frame', () => {
    for (let index = 0; index <= 100; index += 1) {
      const scene = deriveRelevanceLeakScene(0.4, index / 100);
      const rowTops = scene.documents.map((document) => document.rowY - 13);
      const rowBottoms = scene.documents.map((document) => document.rowY + 14);
      expect(Math.min(...rowTops)).toBeGreaterThanOrEqual(108);
      expect(Math.max(...rowBottoms)).toBeLessThanOrEqual(240);
    }
  });

  it('reserves separate horizontal columns for the longest tenant and score', () => {
    const layout = RELEVANCE_LIST_LAYOUT;
    expect(layout.tenantX + layout.longestTenantWidth + layout.minimumColumnGap)
      .toBeLessThanOrEqual(layout.scoreX - layout.scoreWidth);
  });

  it('holds the rank-one decision before transferring the document', () => {
    expect(deriveRelevanceLeakScene(0, 0.92).phase).toBe('query');
    expect(deriveRelevanceLeakScene(0.54, 0.92).phase).toBe('decision-hold');
    expect(deriveRelevanceLeakScene(0.75, 0.92).phase).toBe('transfer');
  });

  it('ends with an unauthorized Legal document in Finance context', () => {
    const scene = deriveRelevanceLeakScene(1, 0.92);
    expect(scene.phase).toBe('context');
    expect(scene.contextTenant).toBe('Legal');
    expect(scene.leakage).toBe(true);
    expect(scene.enforcedSafety).toBe(false);
  });

  it('labels a Finance hit as accidental rather than enforced safety', () => {
    const scene = deriveRelevanceLeakScene(1, 0.08);
    expect(scene.contextTenant).toBe('Finance');
    expect(scene.accidentalSameTenant).toBe(true);
    expect(scene.enforcedSafety).toBe(false);
  });
});
