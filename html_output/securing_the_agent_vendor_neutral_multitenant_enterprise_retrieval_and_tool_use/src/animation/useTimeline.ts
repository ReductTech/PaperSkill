import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import {
  advanceTimeline,
  createTimelineState,
  pauseTimeline,
  playTimeline,
  seekTimeline,
  setTimelineRate,
} from './timelineState';
import type { PlaybackRate, TimelineState, TimelineStatus } from './types';

export interface TimelineStore {
  getSnapshot(): TimelineState;
  subscribe(listener: () => void): () => void;
  play(timestamp?: number): void;
  pause(): void;
  replay(timestamp?: number): void;
  seek(progress: number): void;
  setPlaybackRate(rate: PlaybackRate): void;
  dispose(): void;
}

export interface TimelineController {
  progress: number;
  durationMs: number;
  status: TimelineStatus;
  playbackRate: PlaybackRate;
  play(): void;
  pause(): void;
  replay(): void;
  seek(progress: number): void;
  setPlaybackRate(rate: PlaybackRate): void;
}

type BrowserFrame = ReturnType<typeof requestAnimationFrame>;

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createTimelineStore(
  durationMs: number,
  initialPlaybackRate: PlaybackRate = 1,
): TimelineStore {
  let state = createTimelineState(durationMs, initialPlaybackRate);
  let frame: BrowserFrame | null = null;
  let resumeAfterVisibility = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const replace = (next: TimelineState) => {
    if (Object.is(next, state)) return;
    state = next;
    emit();
  };

  const cancelFrame = () => {
    if (frame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frame);
    }
    frame = null;
  };

  const scheduleFrame = () => {
    if (
      frame !== null
      || state.status !== 'playing'
      || listeners.size === 0
      || typeof requestAnimationFrame !== 'function'
    ) return;

    frame = requestAnimationFrame((timestamp) => {
      frame = null;
      if (state.status !== 'playing') return;

      if (prefersReducedMotion()) {
        replace(seekTimeline(state, 1));
        return;
      }

      replace(advanceTimeline(state, timestamp));
      scheduleFrame();
    });
  };

  const onVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.hidden) {
      resumeAfterVisibility = state.status === 'playing';
      cancelFrame();
      replace(pauseTimeline(state));
    } else if (resumeAfterVisibility) {
      resumeAfterVisibility = false;
      replace(playTimeline(state, now()));
      scheduleFrame();
    }
  };

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibilityChange);
      }
      scheduleFrame();

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          cancelFrame();
          if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', onVisibilityChange);
          }
        }
      };
    },
    play(timestamp = now()) {
      resumeAfterVisibility = false;
      replace(playTimeline(state, timestamp));
      scheduleFrame();
    },
    pause() {
      resumeAfterVisibility = false;
      cancelFrame();
      replace(pauseTimeline(state));
    },
    replay(timestamp = now()) {
      resumeAfterVisibility = false;
      cancelFrame();
      state = seekTimeline(state, 0);
      replace(playTimeline(state, timestamp));
      scheduleFrame();
    },
    seek(progress) {
      resumeAfterVisibility = false;
      cancelFrame();
      replace(seekTimeline(state, progress));
    },
    setPlaybackRate(rate) {
      replace(setTimelineRate(state, rate));
    },
    dispose() {
      cancelFrame();
      listeners.clear();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    },
  };
}

export const TimelineContext = createContext<TimelineStore | null>(null);

export function useTimeline(
  durationMs = 4_000,
  initialPlaybackRate: PlaybackRate = 1,
): TimelineController {
  const groupedStore = useContext(TimelineContext);
  const localStoreRef = useRef<TimelineStore | null>(null);
  if (localStoreRef.current === null) {
    localStoreRef.current = createTimelineStore(durationMs, initialPlaybackRate);
  }

  const store = groupedStore ?? localStoreRef.current;
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  return useMemo(() => ({
    progress: snapshot.progress,
    durationMs: snapshot.durationMs,
    status: snapshot.status,
    playbackRate: snapshot.playbackRate,
    play: () => store.play(),
    pause: () => store.pause(),
    replay: () => store.replay(),
    seek: (progress: number) => store.seek(progress),
    setPlaybackRate: (rate: PlaybackRate) => store.setPlaybackRate(rate),
  }), [snapshot, store]);
}
