import { describe, expect, it } from 'vitest';
import { MEDIA_ASSETS, getMediaAsset } from './media';

describe('MEDIA_ASSETS', () => {
  it('keeps core imagery local and every paper crop traceable', () => {
    for (const asset of Object.values(MEDIA_ASSETS)) {
      if (asset.kind !== 'external-video') expect(asset.src).not.toMatch(/^https?:/);
      if (asset.kind === 'paper-page' || asset.kind === 'paper-figure') {
        expect(asset.source?.url).toMatch(/^https:\/\//);
        expect(asset.source?.licenseReview).toMatch(/^(pending|verified)$/);
        expect(asset.allowedClaim.length).toBeGreaterThan(20);
      }
    }
  });

  it('declares every crop used by the six chapter experiences', () => {
    expect(getMediaAsset('omni-layout').crops).toMatchObject({
      doubleColumn: expect.any(Object),
      tripleColumn: expect.any(Object),
      complexLayout: expect.any(Object),
    });
    expect(getMediaAsset('omni-table').crops).toMatchObject({
      rotated: expect.any(Object),
      formula: expect.any(Object),
      mergedCells: expect.any(Object),
    });
  });
});
