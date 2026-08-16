import { describe, expect, it } from 'vitest';
import {
  advanceTimeline,
  createTimelineState,
  pauseTimeline,
  playTimeline,
  seekTimeline,
  setTimelineRate,
} from './timelineState';

describe('timeline state', () => {
  it('advances from elapsed milliseconds instead of frame count', () => {
    let state = playTimeline(createTimelineState(4_000), 1_000);
    state = advanceTimeline(state, 2_000);
    expect(state.progress).toBeCloseTo(0.25, 6);
  });

  it('keeps unrelated timeline instances independent', () => {
    const left = seekTimeline(createTimelineState(5_000), 0.75);
    const right = createTimelineState(5_000);
    expect(left.progress).toBe(0.75);
    expect(right.progress).toBe(0);
  });

  it('does not move while paused', () => {
    const paused = pauseTimeline(seekTimeline(createTimelineState(5_000), 0.4));
    expect(advanceTimeline(paused, 99_000).progress).toBe(0.4);
  });

  it('is idempotent when an offscreen observer pauses an already paused timeline', () => {
    const paused = seekTimeline(createTimelineState(5_000), 0.4);
    expect(pauseTimeline(paused)).toBe(paused);
  });

  it('clamps seeking and completes exactly at one', () => {
    expect(seekTimeline(createTimelineState(1_000), -2).progress).toBe(0);
    let state = playTimeline(seekTimeline(createTimelineState(1_000), 0.8), 0);
    state = advanceTimeline(state, 500);
    expect(state.progress).toBe(1);
    expect(state.status).toBe('complete');
  });

  it('applies playback rate to elapsed time', () => {
    let state = setTimelineRate(createTimelineState(1_000), 1.5);
    state = playTimeline(state, 100);
    state = advanceTimeline(state, 300);
    expect(state.progress).toBeCloseTo(0.3, 6);
  });

  it('can start with a module-specific playback rate', () => {
    expect(createTimelineState(7_000, 0.5).playbackRate).toBe(0.5);
  });
});
