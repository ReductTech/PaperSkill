import { describe, expect, it } from 'vitest';
import { deriveAbacScene } from './abac-policy-lab';

describe('two-tier ABAC route', () => {
  it('default deny terminates before search and inference', () => {
    const scene = deriveAbacScene(1, 'deny');
    expect(scene.phase).toBe('denied-before-search');
    expect(scene.resourceDecision).toBe('deny');
    expect(scene.searchActive).toBe(false);
    expect(scene.inferenceActive).toBe(false);
    expect(scene.contextChunkCount).toBe(0);
    expect(scene.downstreamLocked).toBe(true);
    expect(scene.returnedChunkCount).toBe(0);
    expect(scene.searchReveal).toBe(0);
    expect(scene.chunkFilterProgress).toBe(0);
  });

  it('owner policy permits the resource and all matching chunks', () => {
    const scene = deriveAbacScene(1, 'owner');
    expect(scene.resourceDecision).toBe('permit');
    expect(scene.chunkDecisions.every((decision) => decision === 'permit')).toBe(true);
    expect(scene.contextChunkCount).toBe(4);
    expect(scene.passedChunkCount).toBe(4);
    expect(scene.rejectedChunkCount).toBe(0);
    expect(scene.inferenceActive).toBe(true);
  });

  it('team policy permits search but filters individual chunks', () => {
    const scene = deriveAbacScene(1, 'team');
    expect(scene.resourceDecision).toBe('permit');
    expect(scene.searchActive).toBe(true);
    expect(scene.chunkDecisions.filter((decision) => decision === 'permit')).toHaveLength(2);
    expect(scene.chunkDecisions.filter((decision) => decision === 'deny')).toHaveLength(2);
    expect(scene.contextChunkCount).toBe(2);
    expect(scene.returnedChunkCount).toBe(4);
    expect(scene.passedChunkCount).toBe(2);
    expect(scene.rejectedChunkCount).toBe(2);
    expect(scene.inferenceActive).toBe(true);
  });

  it('reveals search before starting the chunk inspection', () => {
    const scene = deriveAbacScene(0.4, 'team');
    expect(scene.requestProgress).toBe(1);
    expect(scene.searchReveal).toBeGreaterThan(0);
    expect(scene.chunkFilterProgress).toBe(0);
    expect(scene.returnedChunkCount).toBeGreaterThan(0);
  });

  it('rewinds every downstream stage from normalized progress', () => {
    const start = deriveAbacScene(0, 'owner');
    const request = deriveAbacScene(0.1, 'owner');
    const rewound = deriveAbacScene(0.25, 'owner');
    expect(start.requestProgress).toBe(0);
    expect(request.requestProgress).toBeGreaterThan(0);
    expect(rewound.searchReveal).toBe(0);
    expect(rewound.chunks.every((chunk) => chunk.filterProgress === 0)).toBe(true);
    expect(rewound.contextAssemblyProgress).toBe(0);
    expect(rewound.inferenceProgress).toBe(0);
  });

  it('stagger-evaluates chunk slots instead of changing every decision at once', () => {
    const scene = deriveAbacScene(0.57, 'team');
    const progresses = scene.chunks.map((chunk) => chunk.filterProgress);
    expect(progresses[0]).toBeGreaterThan(progresses[1]);
    expect(progresses[1]).toBeGreaterThan(progresses[2]);
    expect(progresses[2]).toBeGreaterThan(progresses[3]);
    expect(scene.chunks.some((chunk) => chunk.decision === 'pending')).toBe(true);
  });

  it('holds both policy decisions visibly', () => {
    expect(deriveAbacScene(0.3, 'owner').phase).toBe('resource-hold');
    expect(deriveAbacScene(0.66, 'team').phase).toBe('chunk-hold');
  });
});
