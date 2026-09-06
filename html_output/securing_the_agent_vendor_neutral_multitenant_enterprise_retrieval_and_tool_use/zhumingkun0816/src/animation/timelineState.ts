import type { PlaybackRate, TimelineState } from './types';
import { clamp01 } from './easing';

export function createTimelineState(
  durationMs: number,
  playbackRate: PlaybackRate = 1,
): TimelineState {
  return {
    progress: 0,
    durationMs: Math.max(1, durationMs),
    status: 'idle',
    playbackRate,
    lastTimestamp: null,
  };
}

export function playTimeline(state: TimelineState, timestamp: number): TimelineState {
  if (state.progress >= 1) return { ...state, status: 'complete', lastTimestamp: null };
  return { ...state, status: 'playing', lastTimestamp: timestamp };
}

export function pauseTimeline(state: TimelineState): TimelineState {
  if (state.status !== 'playing') return state;
  return { ...state, status: 'paused', lastTimestamp: null };
}

export function seekTimeline(state: TimelineState, progress: number): TimelineState {
  const next = clamp01(progress);
  return {
    ...state,
    progress: next,
    status: next >= 1 ? 'complete' : 'paused',
    lastTimestamp: null,
  };
}

export function setTimelineRate(state: TimelineState, playbackRate: PlaybackRate): TimelineState {
  return { ...state, playbackRate };
}

export function advanceTimeline(state: TimelineState, timestamp: number): TimelineState {
  if (state.status !== 'playing') return state;
  if (state.lastTimestamp === null) return { ...state, lastTimestamp: timestamp };

  const deltaMs = Math.max(0, timestamp - state.lastTimestamp) * state.playbackRate;
  const progress = clamp01(state.progress + deltaMs / state.durationMs);
  return {
    ...state,
    progress,
    status: progress >= 1 ? 'complete' : 'playing',
    lastTimestamp: progress >= 1 ? null : timestamp,
  };
}
