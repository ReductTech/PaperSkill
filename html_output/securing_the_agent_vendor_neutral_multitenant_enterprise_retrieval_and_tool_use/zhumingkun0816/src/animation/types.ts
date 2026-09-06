export type TimelineStatus = 'idle' | 'playing' | 'paused' | 'complete';
export type PlaybackRate = 0.5 | 1 | 1.5;

export interface TimelineState {
  progress: number;
  durationMs: number;
  status: TimelineStatus;
  playbackRate: PlaybackRate;
  lastTimestamp: number | null;
}

export interface TimelinePhase {
  id: string;
  label: string;
  start: number;
  end: number;
}
