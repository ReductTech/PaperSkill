import { describe, expect, it } from 'vitest';
import { OGX_ENFORCEMENT_POINTS, deriveOgxProviderScene } from './ogx-provider-lab';

describe('OGX provider replacement', () => {
  it('keeps all three authorization positions stable', () => {
    expect(OGX_ENFORCEMENT_POINTS).toEqual([
      'API route middleware',
      'routing table resolution',
      'storage read time',
    ]);
    const before = deriveOgxProviderScene(0, 'sqlite-vec');
    const after = deriveOgxProviderScene(1, 'pgvector');
    expect(after.enforcementPoints).toEqual(before.enforcementPoints);
    expect(after.provider).not.toBe(before.provider);
  });
});
