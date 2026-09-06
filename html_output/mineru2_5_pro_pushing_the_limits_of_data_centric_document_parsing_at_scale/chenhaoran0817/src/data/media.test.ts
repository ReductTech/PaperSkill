import { describe, expect, it } from 'vitest';
import type { MediaAsset } from '../types';
import { MEDIA_ASSETS, getMediaAsset } from './media';

describe('MEDIA_ASSETS', () => {
  it('keeps core imagery local and every paper crop traceable', () => {
    for (const asset of Object.values(MEDIA_ASSETS) as MediaAsset[]) {
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
      mergedCellTable: expect.objectContaining({
        x: 65,
        y: 46,
        width: 33,
        height: 38,
        label: '合并单元格表格',
      }),
    });
  });

  it('keeps every crop finite, positive, and inside its source image', () => {
    for (const asset of Object.values(MEDIA_ASSETS) as MediaAsset[]) {
      for (const [cropId, crop] of Object.entries(asset.crops ?? {})) {
        for (const value of [crop.x, crop.y, crop.width, crop.height]) {
          expect(Number.isFinite(value), `${asset.id}/${cropId} must be finite`).toBe(true);
        }
        expect(crop.width, `${asset.id}/${cropId} width`).toBeGreaterThan(0);
        expect(crop.height, `${asset.id}/${cropId} height`).toBeGreaterThan(0);
        expect(crop.x, `${asset.id}/${cropId} x`).toBeGreaterThanOrEqual(0);
        expect(crop.y, `${asset.id}/${cropId} y`).toBeGreaterThanOrEqual(0);
        expect(crop.x + crop.width, `${asset.id}/${cropId} right edge`).toBeLessThanOrEqual(100);
        expect(crop.y + crop.height, `${asset.id}/${cropId} bottom edge`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('registers a landscape merged-cell crop suitable for a bounded stage', () => {
    const asset = getMediaAsset('omni-table');
    const crop = asset.crops?.mergedCellTable;
    expect(crop).toBeDefined();
    if (!crop || !asset.width || !asset.height) throw new Error('Missing crop geometry');
    const effectiveAspect = (asset.width * crop.width / 100) / (asset.height * crop.height / 100);
    expect(effectiveAspect).toBeGreaterThanOrEqual(1.4);
  });

  it('centrally forbids treating every Omni asset as training data or the 296-page Hard subset', () => {
    for (const assetId of ['omni-output', 'omni-layout', 'omni-table'] as const) {
      expect(getMediaAsset(assetId).forbiddenClaims).toEqual(expect.arrayContaining([
        '不是 MinerU2.5-Pro 训练样本。',
        '不能默认视为 OmniDocBench v1.6 的296页Hard子集。',
      ]));
    }
  });
});
