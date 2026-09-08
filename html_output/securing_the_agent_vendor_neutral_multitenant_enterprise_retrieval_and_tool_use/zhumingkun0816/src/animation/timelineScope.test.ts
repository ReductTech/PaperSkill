import { describe, expect, it } from 'vitest';
import { createTimelineStore } from './useTimeline';

describe('timeline scope store', () => {
  it('shares a snapshot only through the same explicit store', () => {
    const shared = createTimelineStore(5_000);
    const unrelated = createTimelineStore(5_000);
    shared.seek(0.6);
    expect(shared.getSnapshot().progress).toBe(0.6);
    expect(unrelated.getSnapshot().progress).toBe(0);
  });

  it('notifies every linked subscriber with one snapshot', () => {
    const store = createTimelineStore(2_000);
    const snapshots: number[] = [];
    const left = store.subscribe(() => snapshots.push(store.getSnapshot().progress));
    const right = store.subscribe(() => snapshots.push(store.getSnapshot().progress));
    store.seek(0.375);
    left();
    right();
    expect(snapshots).toEqual([0.375, 0.375]);
  });

  it('replay resets progress and enters playing state', () => {
    const store = createTimelineStore(1_000);
    store.seek(1);
    store.replay(100);
    expect(store.getSnapshot()).toMatchObject({ progress: 0, status: 'playing', lastTimestamp: 100 });
  });
});
