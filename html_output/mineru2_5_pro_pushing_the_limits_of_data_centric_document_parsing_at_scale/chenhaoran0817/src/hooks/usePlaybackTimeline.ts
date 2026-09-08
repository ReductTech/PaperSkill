import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGlossaryAttentionPause } from '../components/Glossary';

export interface PlaybackTimelineOptions {
  durationMs: number;
  beatMs: readonly number[];
  initialMs?: number;
}

export interface PlaybackTimelineState {
  currentMs: number;
  progress: number;
  activeBeat: number;
  playing: boolean;
  reducedMotion: boolean;
  play(): void;
  pause(): void;
  toggle(): void;
  seek(progress: number): void;
  step(delta: -1 | 1): void;
  replay(): void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function usePlaybackTimeline({ durationMs, beatMs, initialMs = 0 }: PlaybackTimelineOptions): PlaybackTimelineState {
  const attentionPaused = useGlossaryAttentionPause();
  const safeDuration = Math.max(0, durationMs);
  const safeBeats = useMemo(() => [...beatMs].map((beat) => clamp(beat, 0, safeDuration)).sort((a, b) => a - b), [beatMs, safeDuration]);
  const [currentMs, setCurrentMs] = useState(() => clamp(initialMs, 0, safeDuration));
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const currentRef = useRef(currentMs);
  const playingRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const setPosition = useCallback((next: number) => {
    const clamped = clamp(next, 0, safeDuration);
    currentRef.current = clamped;
    setCurrentMs(clamped);
  }, [safeDuration]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (attentionPaused || reducedMotion || safeDuration === 0 || playingRef.current) return;
    if (currentRef.current >= safeDuration) setPosition(0);
    startedAtRef.current = performance.now() - currentRef.current;
    playingRef.current = true;
    setPlaying(true);
    const advance = (timestamp: number) => {
      if (!playingRef.current) return;
      const next = clamp(timestamp - startedAtRef.current, 0, safeDuration);
      setPosition(next);
      if (next >= safeDuration) { pause(); return; }
      frameRef.current = window.requestAnimationFrame(advance);
    };
    frameRef.current = window.requestAnimationFrame(advance);
  }, [attentionPaused, pause, reducedMotion, safeDuration, setPosition]);

  const seek = useCallback((progress: number) => {
    setPosition(clamp(progress, 0, 1) * safeDuration);
    if (playingRef.current) startedAtRef.current = performance.now() - currentRef.current;
  }, [safeDuration, setPosition]);

  const step = useCallback((delta: -1 | 1) => {
    const active = safeBeats.reduce((index, beat, candidate) => (currentRef.current >= beat ? candidate : index), 0);
    const nextIndex = clamp(active + delta, 0, Math.max(0, safeBeats.length - 1));
    setPosition(safeBeats[nextIndex] ?? 0);
  }, [safeBeats, setPosition]);

  const toggle = useCallback(() => { if (playingRef.current) pause(); else play(); }, [pause, play]);
  const replay = useCallback(() => { setPosition(0); play(); }, [play, setPosition]);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const update = () => {
      setReducedMotion(query.matches);
      if (query.matches) pause();
    };
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, [pause]);

  useEffect(() => {
    const pauseWhenVisibilityChanges = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', pauseWhenVisibilityChanges);
    return () => document.removeEventListener('visibilitychange', pauseWhenVisibilityChanges);
  }, [pause]);

  useEffect(() => {
    if (attentionPaused) pause();
  }, [attentionPaused, pause]);

  useEffect(() => () => pause(), [pause]);

  const progress = safeDuration === 0 ? 0 : currentMs / safeDuration;
  const activeBeat = safeBeats.reduce((index, beat, candidate) => (currentMs >= beat ? candidate : index), 0);
  return { currentMs, progress, activeBeat, playing, reducedMotion, play, pause, toggle, seek, step, replay };
}
